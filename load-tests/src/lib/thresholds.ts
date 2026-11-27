import { Threshold } from 'k6/options'

import { intParam } from './params'
import { Variant } from './profiles'

type Thresholds = Record<string, Threshold[]>

export const THROTTLED_METRIC = 'formsg_throttled'

const DEFAULT_LOAD_P95_MS = 5000

const DEFAULT_LOAD_MAX_DROPPED = 0

export function buildThresholds(variant: Variant): Thresholds {
  const thresholds: Thresholds = {
    [THROTTLED_METRIC]: [
      {
        threshold: 'rate==0',
        abortOnFail: true,
        delayAbortEval: '10s',
      },
    ],
  }

  if (variant === 'load') {
    thresholds['http_req_failed'] = ['rate<0.01']
    thresholds['checks'] = ['rate>0.99']

    const maxDropped = intParam('MAX_DROPPED', DEFAULT_LOAD_MAX_DROPPED)
    thresholds['dropped_iterations'] = [`count<=${maxDropped}`]
  }

  const p95 = intParam('P95_MS', variant === 'load' ? DEFAULT_LOAD_P95_MS : 0)
  if (p95 > 0) {
    thresholds['http_req_duration'] = [`p(95)<${p95}`]
  }

  return thresholds
}
