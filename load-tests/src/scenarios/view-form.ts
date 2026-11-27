import { Options } from 'k6/options'

import { selectForm } from '../lib/fixtures'
import { openFormPage } from '../lib/form'
import { intParam } from '../lib/params'
import { buildScenario, selectVariant } from '../lib/profiles'
import { buildThresholds } from '../lib/thresholds'

const DEFAULT_RATE = 10

const JOURNEY_HEADROOM_SECONDS = 10

const variant = selectVariant()
const { fixture, formId } = selectForm()

export const options: Options = {
  scenarios: {
    viewForm: buildScenario(variant, DEFAULT_RATE, JOURNEY_HEADROOM_SECONDS),
  },
  thresholds: buildThresholds(variant),
}

export function setup(): void {
  console.log(
    `variant=${variant} fixture=${fixture} form=${formId} ` +
      `rate=${intParam('RATE', DEFAULT_RATE)} page loads/s`,
  )
}

export default function (): void {
  openFormPage(formId)
}
