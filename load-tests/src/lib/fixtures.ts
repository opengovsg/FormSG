import { optionalParam } from './params'

export const FIXTURES = {
  typical: '6c6f61647465737400000011',
  large: '6c6f61647465737400000012',
} as const

export type FixtureName = keyof typeof FIXTURES

export function selectForm(): { fixture: string; formId: string } {
  const fixture = optionalParam('FIXTURE', 'typical')
  const fixtureId = FIXTURES[fixture as FixtureName]
  if (!fixtureId) {
    throw new Error(
      `--env FIXTURE must be one of ${Object.keys(FIXTURES).join(
        ', ',
      )}, got "${fixture}"`,
    )
  }
  return { fixture, formId: optionalParam('FORM_ID', fixtureId) }
}
