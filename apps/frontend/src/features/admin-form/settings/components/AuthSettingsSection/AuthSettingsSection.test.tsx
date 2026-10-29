import { render, screen } from '@testing-library/react'

import {
  AdminFormDto,
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from 'formsg-shared/types'

import { AuthSettingsSection } from './AuthSettingsSection'

const state = vi.hoisted(() => ({ form: {} as AdminFormDto }))
vi.mock('~features/admin-form/common/queries', () => ({
  useAdminForm: () => ({ data: state.form }),
}))
vi.mock(
  '~features/admin-form/create/workflow/hooks/useIsMrfStepLoginEnabled',
  () => ({ useIsMrfStepLoginEnabled: () => true }),
)
vi.mock('./AuthSettingsDisabledExplanationText', () => ({
  AuthSettingsDisabledExplanationText: () => null,
}))
vi.mock('./AuthSettingsDescriptionText', () => ({
  AuthSettingsDescriptionText: () => null,
}))
vi.mock('./FormSingpassAuthToggle', () => ({
  FormSingpassAuthToggle: ({ isDisabled }: { isDisabled: boolean }) => (
    <button disabled={isDisabled}>Enable authentication</button>
  ),
}))
vi.mock('./AuthSettingsSingpassSection', () => ({
  AuthSettingsSingpassSection: ({
    hasLoginFields,
    isFormPublic,
  }: {
    hasLoginFields: boolean
    isFormPublic: boolean
  }) => (
    <button disabled={hasLoginFields || isFormPublic}>Choose provider</button>
  ),
}))
vi.mock('./StepLoginAccordion', () => ({
  StepLoginAccordion: () => <div>Step cards</div>,
}))

const base = {
  responseMode: FormResponseMode.Encrypt,
  status: FormStatus.Private,
  authType: FormAuthType.NIL,
  isSubmitterIdCollectionEnabled: false,
  form_fields: [
    {
      _id: 'uen',
      title: 'Organisation UEN',
      fieldType: BasicField.Uen,
      corppass: { attr: CorppassAttribute.Uen },
    },
  ],
} as unknown as AdminFormDto
const setup = (overrides: Partial<FormSettings> = {}) => {
  state.form = { ...base, ...overrides } as AdminFormDto
  render(
    <AuthSettingsSection settings={state.form as unknown as FormSettings} />,
  )
}

describe('flat-form authentication draft recovery', () => {
  it('lets a private form enable authentication while Corppass fields are still unconfigured', () => {
    setup()
    expect(
      screen.getByRole('button', { name: 'Enable authentication' }),
    ).not.toBeDisabled()
    expect(
      screen.getByText(
        /These fields need matching authentication before you can publish/,
      ),
    ).toHaveTextContent('Organisation UEN')
  })
  it('lets a private form choose the matching provider instead of being locked by its fields', () => {
    setup({ authType: FormAuthType.MyInfo })
    expect(
      screen.getByRole('button', { name: 'Choose provider' }),
    ).not.toBeDisabled()
  })
  it('still locks public forms and hides the incomplete-draft warning once provider matches', () => {
    setup({ status: FormStatus.Public, authType: FormAuthType.CP })
    expect(
      screen.getByRole('button', { name: 'Enable authentication' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Choose provider' }),
    ).toBeDisabled()
    expect(
      screen.queryByText(
        /These fields need matching authentication before you can publish/,
      ),
    ).not.toBeInTheDocument()
  })
})
