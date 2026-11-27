import { Options } from 'k6/options'

import { selectForm } from '../lib/fixtures'
import { openFormPage, submitStorage } from '../lib/form'
import { intParam } from '../lib/params'
import { buildScenario, selectVariant } from '../lib/profiles'
import { buildThresholds } from '../lib/thresholds'

const DEFAULT_RATE = 3

const JOURNEY_HEADROOM_SECONDS = 20

const variant = selectVariant()
const { fixture, formId } = selectForm()

export const options: Options = {
  scenarios: {
    submitStorage: buildScenario(
      variant,
      DEFAULT_RATE,
      JOURNEY_HEADROOM_SECONDS,
    ),
  },
  thresholds: buildThresholds(variant),
}

export function setup(): void {
  console.log(
    `variant=${variant} fixture=${fixture} form=${formId} ` +
      `rate=${intParam('RATE', DEFAULT_RATE)} submissions/s`,
  )
}

export default function (): void {
  const fields = openFormPage(formId)
  if (fields) {
    submitStorage(formId, fields)
  }
}
