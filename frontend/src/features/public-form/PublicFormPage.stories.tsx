import { Meta, StoryFn } from '@storybook/react'
import { expect, userEvent, waitFor, within } from '@storybook/test'
import dedent from 'dedent'

import { ErrorCode } from '~shared/types'
import { BasicField } from '~shared/types/field'
import {
  FormAuthType,
  FormColorTheme,
  FormResponseMode,
  WorkflowType,
} from '~shared/types/form'

import {
  MOCK_PREFILLED_MYINFO_FIELDS,
  TABLE_FIELD_ADDITIONAL_ROWS_FIELD,
} from '~/mocks/msw/handlers/admin-form'
import { envHandlers } from '~/mocks/msw/handlers/env'
import {
  getPublicFormErrorResponse,
  getPublicFormResponse,
  getPublicFormSubmissionSuccessResponse,
  getPublicFormWithoutSectionsResponse,
  postGenerateVfnOtpResponse,
  postVerifyVfnOtpResponse,
  postVfnTransactionResponse,
  PREVENT_SUBMISSION_LOGIC,
  SHOW_FIELDS_ON_YES_LOGIC,
} from '~/mocks/msw/handlers/public-form'

import {
  getMobileViewParameters,
  getTabletViewParameters,
  StoryRouter,
} from '~utils/storybook'
import { ShortTextFieldSchema } from '~templates/Field'

import PublicFormPage from './PublicFormPage'
import SaveDraftSetupWrapper from './SaveDraftSetupWrapper'

const DEFAULT_MSW_HANDLERS = [
  ...envHandlers,
  getPublicFormResponse(),
  postVfnTransactionResponse(),
  postGenerateVfnOtpResponse(),
  postVerifyVfnOtpResponse(),
]

// Bunch of encodings to test prefill and its sanitization.
const PREFILLABLE_TEST_STRING =
  '%E8%87%AA%E7%94%B1 %F0%90%90%80 hello+world 日本語%20normal space'

const PREFILLABLE_NORMAL_SHORTTEXT_FIELD: ShortTextFieldSchema = {
  ValidationOptions: {
    customVal: null,
    selectedValidation: null,
  },
  allowPrefill: true, // This prop allows for prefill
  title: 'Short Text With Normal Prefill',
  description:
    'Probably do not have to worry so much, React automatically sanitizes what gets rendered',
  required: true,
  disabled: false,
  fieldType: BasicField.ShortText,
  _id: '5da04eafe397fc0013f63b22',
}

const PREFILLABLE_LOCKED_SHORTTEXT_FIELD: ShortTextFieldSchema = {
  ValidationOptions: {
    customVal: null,
    selectedValidation: null,
  },
  allowPrefill: true, // This prop allows for prefill
  lockPrefill: true, // This prop locks the prefill
  title: 'Short Text With Prefill Locked',
  description:
    'Probably do not have to worry so much, React automatically sanitizes what gets rendered',
  required: true,
  disabled: false,
  fieldType: BasicField.ShortText,
  _id: '5da04eafe397fc0013f63b23',
}

const generateMswHandlersForColorTheme = (colorTheme: FormColorTheme) => {
  return [
    ...envHandlers,
    getPublicFormResponse({
      overrides: {
        form: {
          startPage: {
            colorTheme,
          },
        },
      },
    }),
    postVfnTransactionResponse(),
    postGenerateVfnOtpResponse(),
    postVerifyVfnOtpResponse(),
  ]
}

export default {
  title: 'Pages/PublicFormPage',
  component: PublicFormPage,
  decorators: [
    StoryRouter({
      initialEntries: [
        `/61540ece3d4a6e50ac0cc6ff?${PREFILLABLE_NORMAL_SHORTTEXT_FIELD._id}=${PREFILLABLE_TEST_STRING}&${PREFILLABLE_LOCKED_SHORTTEXT_FIELD._id}=${PREFILLABLE_TEST_STRING}`,
      ],
      path: '/:formId',
    }),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: DEFAULT_MSW_HANDLERS,
  },
} as Meta

const Template: StoryFn = () => <PublicFormPage />
export const Default = Template.bind({})

export const WithShortInstructions = Template.bind({})
WithShortInstructions.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          startPage: { paragraph: 'Fill in this mock form in this story.' },
        },
      },
    }),
  ],
}

export const WithLongInstructions = Template.bind({})
WithLongInstructions.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          startPage: {
            paragraph: dedent`
            Fill in this mock form in this story. 
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ac tincidunt orci. Go watch this funny video of a cat https://www.youtube.com/watch?v=dQw4w9WgXcQ. Vivamus id nisl tellus. Aliquam ullamcorper nec diam id ornare. Praesent mattis ligula egestas magna sagittis, non aliquet mauris sollicitudin. In maximus euismod nunc eget pellentesque. Maecenas sollicitudin lobortis consectetur. Suspendisse potenti. Nam a est risus.

            Aliquam egestas diam in velit pellentesque lacinia. Praesent nunc ex, fermentum sed nunc nec, laoreet dignissim nisi. Vivamus et lorem non velit facilisis luctus. Sed et luctus magna, sed tincidunt odio. Fusce quis pretium eros. Mauris in est ornare, aliquam odio quis, porttitor lacus. Aliquam dignissim laoreet libero, sed pharetra enim. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
          
            Donec scelerisque eros mattis tempor commodo. Vestibulum massa ante, fermentum nec sollicitudin eu, tincidunt sed lectus. Etiam maximus luctus dapibus. Morbi et mollis nibh. Praesent ante orci, pellentesque vel molestie ut, lobortis nec dui. Aliquam eleifend luctus pharetra. Nullam lacinia eget erat ac commodo. Curabitur suscipit felis a venenatis consectetur. Cras dictum, metus a egestas aliquam, ipsum neque fermentum orci, vitae fermentum neque mi non arcu.`,
          },
        },
      },
    }),
  ],
}

export const WithCaptcha = Template.bind({})
WithCaptcha.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          hasCaptcha: true,
        },
      },
    }),
  ],
}

export const WithPrefilledNormalFields = Template.bind({})
WithPrefilledNormalFields.parameters = {
  msw: [
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          responseMode: FormResponseMode.Encrypt,
          form_fields: [PREFILLABLE_NORMAL_SHORTTEXT_FIELD],
        },
      },
    }),
  ],
}

export const WithPrefilledNormalFieldsMobile = Template.bind({})
WithPrefilledNormalFieldsMobile.parameters = {
  ...WithPrefilledNormalFields.parameters,
  ...getMobileViewParameters(),
}

export const WithPrefilledLockedFields = Template.bind({})
WithPrefilledLockedFields.parameters = {
  msw: [
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          responseMode: FormResponseMode.Encrypt,
          form_fields: [PREFILLABLE_LOCKED_SHORTTEXT_FIELD],
        },
      },
    }),
  ],
}

export const WithPrefilledLockedFieldsMobile = Template.bind({})
WithPrefilledLockedFieldsMobile.parameters = {
  ...WithPrefilledLockedFields.parameters,
  ...getMobileViewParameters(),
}

export const WithPrefilledLockedAndNormalFields = Template.bind({})
WithPrefilledLockedAndNormalFields.parameters = {
  msw: [
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          responseMode: FormResponseMode.Encrypt,
          form_fields: [
            PREFILLABLE_LOCKED_SHORTTEXT_FIELD,
            PREFILLABLE_NORMAL_SHORTTEXT_FIELD,
          ],
        },
      },
    }),
  ],
}

export const WithPrefilledLockedAndNormalFieldsMobile = Template.bind({})
WithPrefilledLockedAndNormalFieldsMobile.parameters = {
  ...WithPrefilledLockedAndNormalFields.parameters,
  ...getMobileViewParameters(),
}

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const ColorThemeGreen = Template.bind({})
ColorThemeGreen.parameters = {
  msw: generateMswHandlersForColorTheme(FormColorTheme.Green),
}

export const ColorThemeGrey = Template.bind({})
ColorThemeGrey.parameters = {
  msw: generateMswHandlersForColorTheme(FormColorTheme.Grey),
}

export const ColorThemeBrown = Template.bind({})
ColorThemeBrown.parameters = {
  msw: generateMswHandlersForColorTheme(FormColorTheme.Brown),
}

export const ColorThemeRed = Template.bind({})
ColorThemeRed.parameters = {
  msw: generateMswHandlersForColorTheme(FormColorTheme.Red),
}

export const ColorThemeOrange = Template.bind({})
ColorThemeOrange.parameters = {
  msw: generateMswHandlersForColorTheme(FormColorTheme.Orange),
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [...envHandlers, getPublicFormResponse({ delay: 'infinite' })],
}

export const SingpassUnauthorized = Template.bind({})
SingpassUnauthorized.storyName = 'Singpass/Unauthorized'
SingpassUnauthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Singpass login form',
          authType: FormAuthType.SP,
          startPage: {
            colorTheme: FormColorTheme.Grey,
          },
        },
      },
    }),
  ],
}

export const SingpassUnauthorizedSubmitterIdCollectionEnabled = Template.bind(
  {},
)
SingpassUnauthorizedSubmitterIdCollectionEnabled.storyName =
  'Singpass/Unauthorized/Submitter ID Collection Enabled'
SingpassUnauthorizedSubmitterIdCollectionEnabled.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Singpass login form',
          authType: FormAuthType.SP,
          startPage: {
            colorTheme: FormColorTheme.Grey,
          },
          isSubmitterIdCollectionEnabled: true,
        },
      },
    }),
  ],
}

export const UnauthedMobile = Template.bind({})
UnauthedMobile.parameters = {
  ...SingpassUnauthorized.parameters,
  ...getMobileViewParameters(),
}

export const SingpassAuthorized = Template.bind({})
SingpassAuthorized.storyName = 'Singpass/Authorized'
SingpassAuthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Singpass login form',
          authType: FormAuthType.SP,
        },
        spcpSession: {
          userName: 'S1234567A',
        },
      },
    }),
  ],
}

export const CorppassUnauthorized = Template.bind({})
CorppassUnauthorized.storyName = 'Corppass/Unauthorized'
CorppassUnauthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Corppass login form',
          authType: FormAuthType.CP,
        },
      },
    }),
  ],
}

export const CorppassUnauthorizedSubmitterIdCollectionEnabled = Template.bind(
  {},
)
CorppassUnauthorizedSubmitterIdCollectionEnabled.storyName =
  'Corppass/Unauthorized/Submitter ID Collection Enabled'
CorppassUnauthorizedSubmitterIdCollectionEnabled.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Corppass login form',
          authType: FormAuthType.CP,
          isSubmitterIdCollectionEnabled: true,
        },
      },
    }),
  ],
}

export const CorppassAuthorized = Template.bind({})
CorppassAuthorized.storyName = 'Corppass/Authorized'
CorppassAuthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Corppass login form',
          authType: FormAuthType.CP,
        },
        spcpSession: {
          userName: '200000000A',
        },
      },
    }),
  ],
}

export const SgidUnauthorized = Template.bind({})
SgidUnauthorized.storyName = 'SGID/Unauthorized'
SgidUnauthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SGID login form',
          authType: FormAuthType.SGID,
        },
      },
    }),
  ],
}

export const SgidUnauthorizedSubmitterIdCollectionEnabled = Template.bind({})
SgidUnauthorizedSubmitterIdCollectionEnabled.storyName =
  'SGID/Unauthorized/Submitter ID Collection Enabled'
SgidUnauthorizedSubmitterIdCollectionEnabled.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SGID login form',
          authType: FormAuthType.SGID,
          isSubmitterIdCollectionEnabled: true,
        },
      },
    }),
  ],
}

export const SgidAuthorized = Template.bind({})
SgidAuthorized.storyName = 'SGID/Authorized'
SgidAuthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SGID login form',
          authType: FormAuthType.SGID,
        },
        spcpSession: {
          userName: 'S0000000Z',
        },
      },
    }),
  ],
}

export const SgidMyInfoUnauthorized = Template.bind({})
SgidMyInfoUnauthorized.storyName = 'SGID_MyInfo/Unauthorized'
SgidMyInfoUnauthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SGID_MyInfo login form',
          authType: FormAuthType.SGID_MyInfo,
        },
      },
    }),
  ],
}

export const SgidMyInfoUnauthorizedSubmitterIdCollectionEnabled = Template.bind(
  {},
)
SgidMyInfoUnauthorizedSubmitterIdCollectionEnabled.storyName =
  'SGID_MyInfo/Unauthorized/Submitter ID Collection Enabled'
SgidMyInfoUnauthorizedSubmitterIdCollectionEnabled.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SGID_MyInfo login form',
          authType: FormAuthType.SGID_MyInfo,
          isSubmitterIdCollectionEnabled: true,
        },
      },
    }),
  ],
}

export const SingpassMyInfoUnauthorized = Template.bind({})
SingpassMyInfoUnauthorized.storyName = 'SP_MyInfo/Unauthorized'
SingpassMyInfoUnauthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SP_MyInfo login form',
          authType: FormAuthType.MyInfo,
        },
      },
    }),
  ],
}

export const SingpassMyInfoUnauthorizedSubmitterIdCollectionEnabled =
  Template.bind({})
SingpassMyInfoUnauthorizedSubmitterIdCollectionEnabled.storyName =
  'SP_MyInfo/Unauthorized/Submitter ID Collection Enabled'
SingpassMyInfoUnauthorizedSubmitterIdCollectionEnabled.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SP_MyInfo login form',
          authType: FormAuthType.MyInfo,
          isSubmitterIdCollectionEnabled: true,
        },
      },
    }),
  ],
}

export const SgIdSingleSubmissionFailureMessage = Template.bind({})
SgIdSingleSubmissionFailureMessage.storyName =
  'SGID/Single Submission Per NRIC/FIN/UEN Failure Sign In Screen Message'
SgIdSingleSubmissionFailureMessage.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SGID login form',
          authType: FormAuthType.SGID,
          isSingleSubmission: true,
        },
        errorCodes: [ErrorCode.respondentSingleSubmissionValidationFailure],
      },
    }),
  ],
}

export const SingpassSingleSubmissionFailureMessage = Template.bind({})
SingpassSingleSubmissionFailureMessage.storyName =
  'Singpass/Single Submission Per NRIC/FIN/UEN Failure Sign In Screen Message'
SingpassSingleSubmissionFailureMessage.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SP login form',
          authType: FormAuthType.SP,
          isSingleSubmission: true,
        },
        errorCodes: [ErrorCode.respondentSingleSubmissionValidationFailure],
      },
    }),
  ],
}

export const CorppassSingleSubmissionFailureMessage = Template.bind({})
CorppassSingleSubmissionFailureMessage.storyName =
  'Corppass/Single Submission Per NRIC/FIN/UEN Failure Sign In Screen Message'
CorppassSingleSubmissionFailureMessage.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'CP login form',
          authType: FormAuthType.CP,
          isSingleSubmission: true,
        },
        errorCodes: [ErrorCode.respondentSingleSubmissionValidationFailure],
      },
    }),
  ],
}

export const SgIdSingleSubmissionFailureModalAfterSubmit = Template.bind({})
SgIdSingleSubmissionFailureModalAfterSubmit.storyName =
  'SGID/Single Submission Per NRIC/FIN/UEN Failure Modal After Submit'
SgIdSingleSubmissionFailureModalAfterSubmit.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SGID login form',
          authType: FormAuthType.SGID,
          isSingleSubmission: true,
        },
        spcpSession: {
          userName: 'S1234567A',
        },
        errorCodes: [ErrorCode.respondentSingleSubmissionValidationFailure],
      },
    }),
  ],
}

export const CpSingleSubmissionFailureModalAfterSubmit = Template.bind({})
CpSingleSubmissionFailureModalAfterSubmit.storyName =
  'CP/Single Submission Per NRIC/FIN/UEN Failure Modal After Submit'
CpSingleSubmissionFailureModalAfterSubmit.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'CP login form',
          authType: FormAuthType.CP,
          isSingleSubmission: true,
        },
        spcpSession: {
          userName: 'uen-123456789A',
        },
        errorCodes: [ErrorCode.respondentSingleSubmissionValidationFailure],
      },
    }),
  ],
}

export const SgIdRespondentNotWhitelistedFailureMessage = Template.bind({})
SgIdRespondentNotWhitelistedFailureMessage.storyName =
  'SGID/Respondent Not Whitelisted Failure Sign In Screen Message'
SgIdRespondentNotWhitelistedFailureMessage.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SGID login form',
          authType: FormAuthType.SGID,
          whitelistedSubmitterIds: {
            isWhitelistEnabled: true,
          },
        },
        errorCodes: [ErrorCode.respondentNotWhitelisted],
      },
    }),
  ],
}

export const MyInfoRespondentNotWhitelistedFailureMessage = Template.bind({})
MyInfoRespondentNotWhitelistedFailureMessage.storyName =
  'MyInfo/Respondent Not Whitelisted Failure Sign In Screen Message'
MyInfoRespondentNotWhitelistedFailureMessage.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'MyInfo login form',
          authType: FormAuthType.MyInfo,
          whitelistedSubmitterIds: {
            isWhitelistEnabled: true,
          },
        },
        errorCodes: [ErrorCode.respondentNotWhitelisted],
      },
    }),
  ],
}

export const VerifiedFieldsExpiry = Template.bind({})
VerifiedFieldsExpiry.parameters = {
  msw: [
    postVfnTransactionResponse({
      expiryMsOverride: 3 * 1000,
    }),
    getPublicFormResponse({
      overrides: {
        form: {
          form_fields: [
            {
              allowIntlNumbers: true,
              isVerifiable: true,
              title: 'Verifiable Mobile Number',
              description:
                'Verify with random number and OTP. The field should reset after 3 seconds.',
              required: true,
              disabled: false,
              fieldType: BasicField.Mobile,
              _id: 'some-random-id',
              globalId: 'not-used',
            },
          ],
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

export const WithShowFieldLogic = Template.bind({})
WithShowFieldLogic.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          form_fields: [
            {
              title: '',
              description:
                'Select "Yes" on the field below to show more fields',
              required: true,
              disabled: false,
              fieldType: BasicField.Statement,
              _id: 'some-random-id',
              globalId: 'not-used',
            },
          ],
          form_logics: [SHOW_FIELDS_ON_YES_LOGIC],
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

export const WithPreventSubmissionLogic = Template.bind({})
WithPreventSubmissionLogic.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          form_fields: [
            {
              title: '',
              description:
                'Select "Yes" on the field below to prevent submission',
              required: true,
              disabled: false,
              fieldType: BasicField.Statement,
              _id: 'some-random-id',
              globalId: 'not-used',
            },
          ],
          form_logics: [PREVENT_SUBMISSION_LOGIC],
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}
WithPreventSubmissionLogic.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await waitFor(
    async () => {
      await userEvent.click(
        canvas.getByTestId(
          `${PREVENT_SUBMISSION_LOGIC.conditions[0].field}-right`,
        ),
      )
    },
    { timeout: 5000 },
  )
  await expect(
    canvas.getByText(
      /this should show up in storybook mock when yes\/no is true/i,
    ),
  ).toBeInTheDocument()
}

export const FormNotFound = Template.bind({})
FormNotFound.parameters = {
  msw: [getPublicFormErrorResponse()],
}

export const FormNotFoundTablet = Template.bind({})
FormNotFoundTablet.parameters = {
  ...FormNotFound.parameters,
  ...getTabletViewParameters(),
}

export const FormNotFoundMobile = Template.bind({})
FormNotFoundMobile.parameters = {
  ...FormNotFound.parameters,
  ...getMobileViewParameters(),
}

export const WithMyInfo = Template.bind({})
WithMyInfo.storyName = 'With MyInfo'
WithMyInfo.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Encrypt,
          form_fields: MOCK_PREFILLED_MYINFO_FIELDS,
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

export const WithPayment = Template.bind({})
WithPayment.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Encrypt,
          payments_field: {
            enabled: true,
            amount_cents: 5000,
            description: 'Mock event registration',
          },
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

export const ThankYouPage = Template.bind({})
ThankYouPage.parameters = {
  msw: [
    getPublicFormWithoutSectionsResponse(),
    getPublicFormSubmissionSuccessResponse(),
    ...DEFAULT_MSW_HANDLERS,
  ],
}
ThankYouPage.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await waitFor(async () => {
    await expect(canvas.getByText(/yes\/no/i)).toBeInTheDocument()
  })
  await waitFor(async () => {
    const noQuestionChoice = canvas.getByRole('button', {
      name: /1\. yes\/no no option, unselected/i,
    })
    await userEvent.click(noQuestionChoice)
  })
  await waitFor(
    async () => {
      await userEvent.click(canvas.getByRole('button', { name: /submit/i }))
    },
    {
      timeout: 5000,
    },
  )
  await waitFor(
    async () => {
      await expect(
        canvas.getByRole('link', { name: /submit another form/i }),
      ).toBeInTheDocument()
    },
    {
      timeout: 5000,
    },
  )
}

export const WithRespondentCopy = Template.bind({})
WithRespondentCopy.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Encrypt,
          hasRespondentCopy: true,
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

export const WithSaveDraftEnabled = Template.bind({})
WithSaveDraftEnabled.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Encrypt,
          isSaveDraftEnabled: true,
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

export const WithSaveDraftEnabledMobile = Template.bind({})
WithSaveDraftEnabledMobile.parameters = {
  ...WithSaveDraftEnabled.parameters,
  ...getMobileViewParameters(),
}

export const WithSaveDraftEnabledAndClickFloatingSaveDraftButton =
  Template.bind({})
WithSaveDraftEnabledAndClickFloatingSaveDraftButton.parameters = {
  ...WithSaveDraftEnabled.parameters,
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Encrypt,
          isSaveDraftEnabled: true,
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}
WithSaveDraftEnabledAndClickFloatingSaveDraftButton.play = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement)
  const screen = within(document.body)

  let floatingSaveDraftButton: HTMLElement

  await step('Find the floating save draft button', async () => {
    await waitFor(
      async () => {
        const foundFloatingSaveDraftButton =
          canvas.getByLabelText('Save a draft')
        floatingSaveDraftButton = foundFloatingSaveDraftButton
        expect(floatingSaveDraftButton).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  await step('Click the floating save draft button', async () => {
    await userEvent.click(floatingSaveDraftButton)
  })

  await step(
    'Assert that the saved draft success toast message appears',
    async () => {
      await waitFor(
        async () => {
          await expect(document.body).toHaveTextContent(
            'Your draft has been saved.',
          )
        },
        { timeout: 3000 },
      )
    },
  )

  await step(
    'Hover over the save draft button to see the save draft tooltip',
    async () => {
      await userEvent.hover(floatingSaveDraftButton)
    },
  )

  await step(
    'Assert that a tooltip appears reflecting that draft has been saved',
    async () => {
      let tooltip: HTMLElement | null = null
      await waitFor(
        () => {
          tooltip = screen.getByRole('tooltip', { name: /Last saved/i })
          expect(tooltip).toBeInTheDocument()
        },
        { timeout: 5000 },
      )
    },
  )
}

export const WithSaveDraftEnabledAndClickSaveDraftButton = Template.bind({})
WithSaveDraftEnabledAndClickSaveDraftButton.parameters = {
  ...WithSaveDraftEnabled.parameters,
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Encrypt,
          isSaveDraftEnabled: true,
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}
WithSaveDraftEnabledAndClickSaveDraftButton.play = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement)
  const screen = within(document.body)

  let mainSaveDraftButton: HTMLElement

  await step('Find the main save draft button', async () => {
    await waitFor(
      () => {
        const foundMainSaveDraftButton = canvas
          .getAllByRole('button', {
            name: 'Save a draft',
          })
          .find((button) => button.textContent?.includes('Save a draft'))
        if (!foundMainSaveDraftButton) {
          throw new Error('Main save draft button not found')
        }
        mainSaveDraftButton = foundMainSaveDraftButton
        expect(foundMainSaveDraftButton).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  await step('Click the main save draft button', async () => {
    await userEvent.click(mainSaveDraftButton)
  })

  await step(
    'Assert that the saved draft success toast message appears',
    async () => {
      await waitFor(
        () => {
          expect(document.body).toHaveTextContent('Your draft has been saved.')
        },
        { timeout: 3000 },
      )
    },
  )

  await step(
    'Hover over the save draft button to see the save draft tooltip',
    async () => {
      await userEvent.hover(mainSaveDraftButton)
    },
  )

  await step(
    'Assert that a tooltip appears reflecting that draft has been saved',
    async () => {
      await waitFor(
        async () => {
          const tooltip = await screen.getByRole('tooltip', {
            name: /Last saved/i,
          })
          expect(tooltip).toBeInTheDocument()
        },
        { timeout: 5000 },
      )
    },
  )
}

const DRAFT_TO_RESTORE = {
  lastUpdated: 1759305125679,
  draftResponses: {
    '5da04eb5e397fc0013f63c7e': 'Yes',
    '5da0290b4073c800128388b4': {
      value: 'kevin.foong@washere.com',
    },
    '5da0290b4073c800128388z4': {
      value: 'open@open.gov.sg',
    },
    '5da04ea3e397fc0013f63c78': {
      value: '+6590008000',
    },
    '5da04ea3e397fc0013f63c11': {
      value: '+6562223535',
    },
    '5da04ea9e397fc0013f63c7b': '321',
    '5da04eab3738d10012607734': '3.21',
    '5da04eafe397fc0013f63c7c': '<Start>This is a short text.</End>',
    '5da04eb1e397fc0013f63c7d': '<Start>This is a long text.</End>',
    '5da04eb23738d10012607737': 'Option 2',
    '5da04eb7e397fc0013f63c80': {
      value: ['Option 1', 'Option 3', 'Option 2'],
    },
    '5da04eb93738d10012607738': {
      value: 'Option 3',
    },
    '5da04ebfe397fc0013f63c83': '01/10/2025',
    '5da04ec13738d1001260773a': '3',
    '5da04ec43738d1001260773b': 'T2546896H',
    '5da04f833738d1001260777f': [
      {
        '5da04f833738d10012607781': 'Row 1/2',
        '5dadaeb719eccb0012364550': 'Option 1',
      },
      {
        '5da04f833738d10012607781': 'Row 2/2',
        '5dadaeb719eccb0012364550': 'Option 2',
      },
    ],
  },
  fieldDefinitionsChecksum: {
    '5da04eb5e397fc0013f63c7e':
      '{"title":"Yes/No","description":"This is a\\n\\nmultiline description\\r\\nanother line","required":true,"disabled":false,"fieldType":"yes_no","_id":"5da04eb5e397fc0013f63c7e","globalId":"CnGRpTpnqSrISnk28yLDvKt8MI2HCFJuYbk72ie0l56"}',
    '5da0290b4073c800128388b4':
      '{"autoReplyOptions":{"hasAutoReply":true,"autoReplySubject":"my subject","autoReplySender":"my name","autoReplyMessage":"my email","includeFormSummary":true},"isVerifiable":false,"hasAllowedEmailDomains":false,"allowedEmailDomains":[],"title":"Email","description":"","required":true,"disabled":false,"fieldType":"email","_id":"5da0290b4073c800128388b4","globalId":"nhTtR59j90TGAxKCIdSQ7FFFjF5z0d6ifKDIxr2IfgO"}',
    '5da0290b4073c800128388z4':
      '{"autoReplyOptions":{"hasAutoReply":true,"autoReplySubject":"my subject","autoReplySender":"my name","autoReplyMessage":"my email","includeFormSummary":true},"isVerifiable":true,"hasAllowedEmailDomains":true,"allowedEmailDomains":["@open.gov.sg"],"title":"Verifiable Email","description":"Only allows @open.gov.sg email domains","required":true,"disabled":false,"fieldType":"email","_id":"5da0290b4073c800128388z4","globalId":"nhTtR59j90TGAxKCIdSQ7FFFjF5z0d6ifKDIxr2Ifg1"}',
    '5da04ea3e397fc0013f63c78':
      '{"allowIntlNumbers":false,"isVerifiable":false,"title":"Mobile Number","description":"","required":true,"disabled":false,"fieldType":"mobile","_id":"5da04ea3e397fc0013f63c78","globalId":"IsZAjzS1J2AJqsUnAnCSQStxoknyIdUEXam6cPlNYuJ"}',
    '5da04ea3e397fc0013f63c11':
      '{"allowIntlNumbers":true,"isVerifiable":true,"title":"Verifiable Mobile Number","description":"","required":true,"disabled":false,"fieldType":"mobile","_id":"5da04ea3e397fc0013f63c11","globalId":"IsZAjzS1J2AJqsUnAnCSQStxoknyIdUEXam6cPlNYuY"}',
    '5da04ea9e397fc0013f63c7b':
      '{"ValidationOptions":{"_id":"6148614ee2fb650012928dd9","selectedValidation":null,"LengthValidationOptions":{"selectedLengthValidation":null,"customVal":null},"RangeValidationOptions":{"customMin":null,"customMax":null},"id":"6148614ee2fb650012928dd9"},"title":"Number","description":"","required":true,"disabled":false,"fieldType":"number","_id":"5da04ea9e397fc0013f63c7b","globalId":"TUAlegPQaX1L5kzEBtNWNlohV0eUoFsZ7WL2m3IMbFv"}',
    '5da04eab3738d10012607734':
      '{"ValidationOptions":{"customMax":null,"customMin":null},"validateByValue":false,"title":"Decimal","description":"","required":true,"disabled":false,"fieldType":"decimal","_id":"5da04eab3738d10012607734","globalId":"bRvL9Y3syNYSZDUI09lbMM0ET1nAaDoJNXxGEYH5P4S"}',
    '5da04eafe397fc0013f63c7c':
      '{"ValidationOptions":{"_id":"6148614ee2fb650012928ddb","customVal":null,"selectedValidation":null,"customMin":null,"customMax":null,"id":"6148614ee2fb650012928ddb"},"allowPrefill":false,"title":"Short Text","description":"","required":true,"disabled":false,"fieldType":"textfield","_id":"5da04eafe397fc0013f63c7c","globalId":"gi588V2s1fBk7BcWOHoqnFy1by7KIxjw8njXV5NeC3g"}',
    '5da04eb1e397fc0013f63c7d':
      '{"ValidationOptions":{"_id":"6148614ee2fb650012928ddd","customVal":null,"selectedValidation":null,"customMin":null,"customMax":null,"id":"6148614ee2fb650012928ddd"},"title":"Long Text","description":"","required":true,"disabled":false,"fieldType":"textarea","_id":"5da04eb1e397fc0013f63c7d","globalId":"iJpZkr9GasJrAvQHOYAyRiGRGNhDJAzRw6FwTLaQImS"}',
    '5da04eb23738d10012607737':
      '{"fieldOptions":["Option 1","Option 2","Option 3"],"title":"Dropdown","description":"","required":true,"disabled":false,"fieldType":"dropdown","_id":"5da04eb23738d10012607737","globalId":"wzV4A56NIxpfdjdB0WJO0vcovDOiY7wjuE8ZH4Pr9at"}',
    '5da04eb7e397fc0013f63c80':
      '{"ValidationOptions":{"customMax":null,"customMin":null},"fieldOptions":["Option 1","Option 2","Option 3"],"othersRadioButton":false,"validateByValue":false,"title":"Checkbox","description":"","required":true,"disabled":false,"fieldType":"checkbox","_id":"5da04eb7e397fc0013f63c80","globalId":"l4gMDfFhA1ITmhUPQCjA05aUAOROUOwlNAjMJMkwmJ7"}',
    '5da04eb93738d10012607738':
      '{"fieldOptions":["Option 1","Option 2","Option 3"],"othersRadioButton":false,"title":"Radio","description":"","required":true,"disabled":false,"fieldType":"radiobutton","_id":"5da04eb93738d10012607738","globalId":"pJc2jhdmSk0auIes9O4Y1Wwq3xLVab1e3D3VrMWuJVt"}',
    '5da04ebfe397fc0013f63c83':
      '{"dateValidation":{"customMinDate":null,"customMaxDate":null,"selectedDateValidation":null},"title":"Date","description":"","required":true,"disabled":false,"fieldType":"date","_id":"5da04ebfe397fc0013f63c83","globalId":"pq8tWED4Jf6FkuWr9VKUqz5Ea6rCASbx73aO6T2LhAN"}',
    '5da04ec13738d1001260773a':
      '{"ratingOptions":{"steps":5,"shape":"Heart"},"title":"Rating","description":"","required":true,"disabled":false,"fieldType":"rating","_id":"5da04ec13738d1001260773a","globalId":"1KjTqMp582fiF9oChFxmw6De7B2U1zQGvJ0TLm5rcZu"}',
    '5da04ec43738d1001260773b':
      '{"title":"NRIC","description":"","required":true,"disabled":false,"fieldType":"nric","_id":"5da04ec43738d1001260773b","globalId":"0KHU4aNnFVS5y8CLqkXWf9A0RknGIqzNoVfOUlqNRDl"}',
    '5da04f833738d1001260777f':
      '{"addMoreRows":false,"title":"Table","description":"","required":true,"disabled":false,"fieldType":"table","_id":"5da04f833738d1001260777f","columns":[{"ValidationOptions":{"_id":"6148614ee2fb650012928ddf","customMax":null,"customMin":null,"customVal":null,"selectedValidation":null,"id":"6148614ee2fb650012928ddf"},"allowPrefill":false,"columnType":"textfield","_id":"5da04f833738d10012607781","title":"Text Field","required":true},{"fieldOptions":["Option 1","Option 2"],"columnType":"dropdown","_id":"5dadaeb719eccb0012364550","title":"Db","required":true}],"minimumRows":2,"globalId":"E7udA19YGZOZuiFhlDSm5FwmogBiz9DaUulRFe9ygGD"}',
    '5da04f873738d10012607783':
      '{"title":"Attachment","description":"","required":false,"disabled":false,"fieldType":"attachment","_id":"5da04f873738d10012607783","attachmentSize":"1","globalId":"gE8XOqZA6MA3Rl7bQbrSOKpxjfeVSeYSfMZhRSitEn1"}',
  },
}

export const WithSaveDraftRestored = Template.bind({})
WithSaveDraftRestored.parameters = {
  docs: {
    storyDescription:
      'This story asserts that the saved draft is restored when the page is loaded.' +
      'Note that the attachment field is not stored and will not be restored.',
  },
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Encrypt,
          isSaveDraftEnabled: true,
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}
WithSaveDraftRestored.decorators = [
  (Story) => {
    return (
      <SaveDraftSetupWrapper
        draftKey="formsg-save-draft-61540ece3d4a6e50ac0cc6ff"
        draftValue={DRAFT_TO_RESTORE}
      >
        <Story />
      </SaveDraftSetupWrapper>
    )
  },
]

export const WithSaveDraftRestoredYesNoFieldSchemaChanged = Template.bind({})
WithSaveDraftRestoredYesNoFieldSchemaChanged.parameters = {
  docs: {
    storyDescription:
      'This story asserts that the saved draft does not restore fields where the schema has changed. In particular, the Yes no field definition has changed and hence is not restored.',
  },
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Encrypt,
          isSaveDraftEnabled: true,
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}
WithSaveDraftRestoredYesNoFieldSchemaChanged.decorators = [
  (Story) => {
    return (
      <SaveDraftSetupWrapper
        draftKey="formsg-save-draft-61540ece3d4a6e50ac0cc6ff"
        draftValue={{
          lastUpdated: new Date().getTime() - 10,
          draftResponses: {
            ...DRAFT_TO_RESTORE.draftResponses,
          },
          fieldDefinitionsChecksum: {
            ...DRAFT_TO_RESTORE.fieldDefinitionsChecksum,
            '5da04eb5e397fc0013f63c7e': '{}', // Emulates Yes no field definition change
          },
        }}
      >
        <Story />
      </SaveDraftSetupWrapper>
    )
  },
]

export const WithPrefilledNormalFieldsWithSaveDraftRestored = Template.bind({})
WithPrefilledNormalFieldsWithSaveDraftRestored.parameters = {
  msw: [
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          isSaveDraftEnabled: true,
          responseMode: FormResponseMode.Encrypt,
          form_fields: [PREFILLABLE_NORMAL_SHORTTEXT_FIELD],
        },
      },
    }),
  ],
}
WithPrefilledNormalFieldsWithSaveDraftRestored.decorators = [
  (Story) => {
    return (
      <SaveDraftSetupWrapper
        draftKey="formsg-save-draft-61540ece3d4a6e50ac0cc6ff"
        draftValue={{
          lastUpdated: new Date().getTime() - 10,
          draftResponses: {
            '5da04eafe397fc0013f63b22':
              'This draft value should not be restored since prefills have higher precedence.',
            ...DRAFT_TO_RESTORE.draftResponses,
          },
          fieldDefinitionsChecksum: {
            '5da04eafe397fc0013f63b22': JSON.stringify(
              PREFILLABLE_NORMAL_SHORTTEXT_FIELD,
            ),
            ...DRAFT_TO_RESTORE.fieldDefinitionsChecksum,
          },
        }}
      >
        <Story />
      </SaveDraftSetupWrapper>
    )
  },
]

export const WithStorageModeTableFieldAdditionalRows = Template.bind({})
WithStorageModeTableFieldAdditionalRows.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Encrypt,
          form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

// Assert that the table field additional rows limits and add another row buttons are working as expected
WithStorageModeTableFieldAdditionalRows.play = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement)

  let tableFieldTable: HTMLElement
  let tableFieldAddAnotherRowButton: HTMLElement

  await step(
    'Find the table field table and add another row button',
    async () => {
      await waitFor(async () => {
        const foundTableFieldGroup = canvas.getByRole('group', {
          name: (_, element) => {
            const label = element.querySelector(
              '#table-field-for-test-id-label',
            )
            return !!label
          },
        })
        if (!foundTableFieldGroup)
          throw new Error('Table field group not found')

        const foundTableFieldTable =
          within(foundTableFieldGroup).getByRole('table')
        if (!foundTableFieldTable)
          throw new Error('Table field table not found')
        tableFieldTable = foundTableFieldTable

        const foundTableFieldAddAnotherRowButton = within(
          foundTableFieldGroup,
        ).getByRole('button', { name: /Add another row/i })
        if (!foundTableFieldAddAnotherRowButton)
          throw new Error('Table field add another row button not found')
        tableFieldAddAnotherRowButton = foundTableFieldAddAnotherRowButton
      })
    },
  )

  await step(
    'Assert that the table is initiated with 2 rows which is the minimum rows',
    async () => {
      await waitFor(async () => {
        const rowGroups = within(tableFieldTable).getAllByRole('rowgroup')
        const tbody = rowGroups.find((group) => group.localName === 'tbody')
        if (!tbody) throw new Error('Table field table body not found')
        const rows = within(tbody).getAllByRole('row')
        expect(rows).toHaveLength(2)
      })
    },
  )

  await step(
    'Click the add another row button for the table field so there is 3 rows',
    async () => {
      await userEvent.click(tableFieldAddAnotherRowButton)
    },
  )

  await step(
    'Assert that the table is initiated with 3 rows which is the minimum rows',
    async () => {
      await waitFor(async () => {
        const rowGroups = within(tableFieldTable).getAllByRole('rowgroup')
        const tbody = rowGroups.find((group) => group.localName === 'tbody')
        if (!tbody) throw new Error('Table field table body not found')
        const rows = within(tbody).getAllByRole('row')
        expect(rows).toHaveLength(3)
      })
    },
  )

  await step(
    'Click the add another row button for the table field so there is 4 rows',
    async () => {
      await userEvent.click(tableFieldAddAnotherRowButton)
    },
  )

  await step(
    'Assert that the table is initiated with 4 rows which is the minimum rows',
    async () => {
      await waitFor(async () => {
        const rowGroups = within(tableFieldTable).getAllByRole('rowgroup')
        const tbody = rowGroups.find((group) => group.localName === 'tbody')
        if (!tbody) throw new Error('Table field table body not found')
        const rows = within(tbody).getAllByRole('row')
        expect(rows).toHaveLength(4)
      })
    },
  )

  await step(
    'Assert the add another row button is disabled since number of rows is maximum ',
    async () => {
      await waitFor(async () => {
        expect(tableFieldAddAnotherRowButton).toBeDisabled()
      })
    },
  )
}

export const WithMultiRespondentFormStep1TableFieldAdditionalRows =
  Template.bind({})
WithMultiRespondentFormStep1TableFieldAdditionalRows.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Multirespondent,
          workflow: [
            {
              _id: 'step-0',
              edit: ['table-field-for-test-id'],
              workflow_type: WorkflowType.Static,
              emails: [],
            },
          ],
          form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

// Assert that the table field additional rows limits and add another row buttons are working as expected
WithMultiRespondentFormStep1TableFieldAdditionalRows.play = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement)

  let tableFieldTable: HTMLElement
  let tableFieldAddAnotherRowButton: HTMLElement

  await step(
    'Find the table field table and add another row button',
    async () => {
      await waitFor(async () => {
        const foundTableFieldGroup = canvas.getByRole('group', {
          name: (_, element) => {
            const label = element.querySelector(
              '#table-field-for-test-id-label',
            )
            return !!label
          },
        })
        if (!foundTableFieldGroup)
          throw new Error('Table field group not found')

        const foundTableFieldTable =
          within(foundTableFieldGroup).getByRole('table')
        if (!foundTableFieldTable)
          throw new Error('Table field table not found')
        tableFieldTable = foundTableFieldTable

        const foundTableFieldAddAnotherRowButton = within(
          foundTableFieldGroup,
        ).getByRole('button', { name: /Add another row/i })
        if (!foundTableFieldAddAnotherRowButton)
          throw new Error('Table field add another row button not found')
        tableFieldAddAnotherRowButton = foundTableFieldAddAnotherRowButton
      })
    },
  )

  await step(
    'Assert that the table is initiated with 2 rows which is the minimum rows',
    async () => {
      await waitFor(async () => {
        const rowGroups = within(tableFieldTable).getAllByRole('rowgroup')
        const tbody = rowGroups.find((group) => group.localName === 'tbody')
        if (!tbody) throw new Error('Table field table body not found')
        const rows = within(tbody).getAllByRole('row')
        expect(rows).toHaveLength(2)
      })
    },
  )

  await step(
    'Click the add another row button for the table field so there is 3 rows',
    async () => {
      await userEvent.click(tableFieldAddAnotherRowButton)
    },
  )

  await step(
    'Assert that the table is initiated with 3 rows which is the minimum rows',
    async () => {
      await waitFor(async () => {
        const rowGroups = within(tableFieldTable).getAllByRole('rowgroup')
        const tbody = rowGroups.find((group) => group.localName === 'tbody')
        if (!tbody) throw new Error('Table field table body not found')
        const rows = within(tbody).getAllByRole('row')
        expect(rows).toHaveLength(3)
      })
    },
  )

  await step(
    'Click the add another row button for the table field so there is 4 rows',
    async () => {
      await userEvent.click(tableFieldAddAnotherRowButton)
    },
  )

  await step(
    'Assert that the table is initiated with 4 rows which is the minimum rows',
    async () => {
      await waitFor(async () => {
        const rowGroups = within(tableFieldTable).getAllByRole('rowgroup')
        const tbody = rowGroups.find((group) => group.localName === 'tbody')
        if (!tbody) throw new Error('Table field table body not found')
        const rows = within(tbody).getAllByRole('row')
        expect(rows).toHaveLength(4)
      })
    },
  )

  await step(
    'Assert the add another row button is disabled since number of rows is maximum ',
    async () => {
      await waitFor(async () => {
        expect(tableFieldAddAnotherRowButton).toBeDisabled()
      })
    },
  )
}
