import { check } from 'k6'
import { Options } from 'k6/options'

import { apiGet } from '../lib/client'
import { buildScenario, selectVariant } from '../lib/profiles'
import { buildThresholds } from '../lib/thresholds'

const variant = selectVariant()

export const options: Options = {
  scenarios: { smoke: buildScenario(variant) },
  thresholds: buildThresholds(variant),
}

export default function (): void {
  const res = apiGet('/api/v3/client/env', '/api/v3/client/env')
  check(res, {
    'status is 200': (r) => r.status === 200,
    'returns client env': (r) =>
      typeof r.body === 'string' && r.body.indexOf('{') === 0,
  })
}
