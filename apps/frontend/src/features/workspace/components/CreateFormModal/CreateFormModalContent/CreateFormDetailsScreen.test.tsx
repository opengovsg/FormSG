import { PropsWithChildren } from 'react'
import { useForm } from 'react-hook-form'
import { ChakraProvider, Modal, ModalContent, theme } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'

import { FormResponseMode } from 'formsg-shared/types/form/form'

import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
  CreateFormWizardInputProps,
} from '../CreateFormWizardContext'

import { CreateFormDetailsScreen } from './CreateFormDetailsScreen'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  Trans: ({ children }: PropsWithChildren) => children,
}))

// The title input and data-classification box pull from queries/SDK we do not
// exercise here; stub them so the screen renders in isolation.
vi.mock('./FormTitleInput', () => ({
  FormTitleInput: () => <div data-testid="form-title-input" />,
}))
vi.mock('./EscapeHatchLink', () => ({
  EscapeHatchLink: () => <div data-testid="escape-hatch" />,
}))
vi.mock('./FormResponseOptions', () => ({
  FormResponseOptions: () => <div data-testid="form-response-options" />,
}))
vi.mock(
  '~features/admin-form/settings/components/DataClassificationInfoBox',
  () => ({
    __esModule: true,
    default: () => <div data-testid="data-classification" />,
  }),
)

const renderDetailsScreen = (
  overrides: Partial<CreateFormWizardContextReturn>,
) => {
  const Harness = () => {
    const formMethods = useForm<CreateFormWizardInputProps>({
      defaultValues: {
        title: 'My form',
        responseMode: FormResponseMode.Encrypt,
      },
    })
    const value = {
      currentStep: CreateFormFlowStates.Details,
      direction: 1,
      formMethods,
      handleEmailFeedbackSubmit: vi.fn(),
      handleCreateEmailModeForm: vi.fn(),
      submitEmailModeFeedback: vi.fn(),
      handleCreateStorageModeOrMultirespondentForm: vi.fn(),
      handleProceedFromDetails: vi.fn(),
      goToFormDetails: vi.fn(),
      proceedCtaLabel: 'Create form',
      keypair: {} as any,
      isFetching: false,
      isLoading: false,
      modalHeader: 'Set up your form',
      isSingpass: false,
      hasMyInfoChildren: false,
      onClose: vi.fn(),
      // Render the simpler escape-hatch branch so the proceed CTA assertion is
      // isolated from the response-mode option tiles and their dependencies.
      isMrfCutoverEnabled: true,
      goToStorageModeDetails: vi.fn(),
      goToMrfDetails: vi.fn(),
      ...overrides,
    } as CreateFormWizardContextReturn

    return (
      <ChakraProvider theme={theme}>
        <Modal isOpen onClose={() => undefined}>
          <ModalContent>
            <CreateFormWizardContext.Provider value={value}>
              <CreateFormDetailsScreen />
            </CreateFormWizardContext.Provider>
          </ModalContent>
        </Modal>
      </ChakraProvider>
    )
  }

  render(<Harness />)
}

describe('CreateFormDetailsScreen', () => {
  it('renders the proceed CTA label from the wizard context', () => {
    renderDetailsScreen({ proceedCtaLabel: 'Next step' })

    expect(
      screen.getByRole('button', { name: /next step/i }),
    ).toBeInTheDocument()
  })

  it('renders the create label when the provider supplies it', () => {
    renderDetailsScreen({ proceedCtaLabel: 'Create form' })

    expect(
      screen.getByRole('button', { name: /create form/i }),
    ).toBeInTheDocument()
  })
})
