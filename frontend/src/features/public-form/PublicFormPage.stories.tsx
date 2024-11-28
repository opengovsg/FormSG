import { Meta, StoryFn } from '@storybook/react'
import { expect, userEvent, waitFor, within } from '@storybook/test'
import dedent from 'dedent'

import { ErrorCode } from '~shared/types'
import { BasicField } from '~shared/types/field'
import {
  FormAuthType,
  FormColorTheme,
  FormResponseMode,
} from '~shared/types/form'

import { MOCK_PREFILLED_MYINFO_FIELDS } from '~/mocks/msw/handlers/admin-form'
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
    await expect(canvas.getByText(/yes\/no/i)).toBeInTheDocument
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
