import { Scenario } from 'k6/options'

import { intParam, optionalParam } from './params'

export type Variant = 'load' | 'stress' | 'spike'

const VARIANTS: Variant[] = ['load', 'stress', 'spike']

const STRESS_RUNGS = [1, 2, 5, 10, 20]

const VU_HEADROOM_SECONDS = 5

const MIN_VUS = 100

export function selectVariant(): Variant {
  const raw = optionalParam('VARIANT', 'load')
  if (VARIANTS.indexOf(raw as Variant) === -1) {
    throw new Error(
      `--env VARIANT must be one of ${VARIANTS.join(', ')}, got "${raw}"`,
    )
  }
  return raw as Variant
}

function vuPool(startRate: number, peakRate: number, headroomSeconds: number) {
  return {
    preAllocatedVUs: intParam(
      'PRE_ALLOCATED_VUS',
      Math.max(startRate * headroomSeconds, 20),
    ),
    maxVUs: intParam(
      'MAX_VUS',
      Math.max(peakRate * headroomSeconds, startRate * 10, MIN_VUS),
    ),
  }
}

export function buildScenario(
  variant: Variant,
  defaultRate = 20,
  headroomSeconds = VU_HEADROOM_SECONDS,
): Scenario {
  const rate = intParam('RATE', defaultRate)
  const timeUnit = '1s'

  switch (variant) {
    case 'load': {
      return {
        executor: 'constant-arrival-rate',
        rate,
        timeUnit,
        duration: optionalParam('DURATION', '60s'),
        ...vuPool(rate, rate, headroomSeconds),
      }
    }

    case 'stress': {
      const stageDuration = optionalParam('STAGE_DURATION', '30s')
      const peak = rate * STRESS_RUNGS[STRESS_RUNGS.length - 1]
      return {
        executor: 'ramping-arrival-rate',
        startRate: rate,
        timeUnit,
        ...vuPool(rate, peak, headroomSeconds),
        stages: STRESS_RUNGS.map((multiple) => ({
          target: rate * multiple,
          duration: stageDuration,
        })).concat([{ target: 0, duration: '15s' }]),
      }
    }

    case 'spike': {
      const multiplier = intParam('SPIKE_MULTIPLIER', 20)
      const baseline = optionalParam('BASELINE_DURATION', '30s')
      const burst = optionalParam('BURST_DURATION', '30s')
      const recovery = optionalParam('RECOVERY_DURATION', '60s')
      return {
        executor: 'ramping-arrival-rate',
        startRate: rate,
        timeUnit,
        ...vuPool(rate, rate * multiplier, headroomSeconds),
        stages: [
          { target: rate, duration: baseline },
          { target: rate * multiplier, duration: '10s' },
          { target: rate * multiplier, duration: burst },
          { target: rate, duration: recovery },
          { target: 0, duration: '15s' },
        ],
      }
    }
  }
}
