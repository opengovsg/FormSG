import { PropsWithChildren } from 'react'
import { ChakraProvider, Modal, ModalContent, theme } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'

import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
} from '../CreateFormWizardContext'

import { CreateFormModalContent } from './CreateFormModalContent'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  Trans: ({ children }: PropsWithChildren) => children,
}))

// Render children directly to avoid framer-motion in jsdom.
vi.mock('~templates/MotionBox', () => ({
  XMotionBox: ({ children }: PropsWithChildren) => <div>{children}</div>,
  MotionBox: ({ children }: PropsWithChildren) => <div>{children}</div>,
}))

// The step screens are irrelevant to the progress indicator; stub them out.
vi.mock('./CreateFormDetailsScreen', () => ({
  CreateFormDetailsScreen: () => <div data-testid="details-screen" />,
}))
vi.mock('./CreateFormOriginScreen', () => ({
  CreateFormOriginScreen: () => <div data-testid="origin-screen" />,
}))
vi.mock('./CreateFormStorageModeScreen', () => ({
  CreateFormStorageModeScreen: () => <div data-testid="storage-screen" />,
}))
vi.mock('./EmailModeFeedbackAndCreateScreen', () => ({
  EmailModeCreationScreen: () => <div data-testid="email-creation-screen" />,
  EmailModeFeedbackScreen: () => <div data-testid="email-feedback-screen" />,
}))
vi.mock('./SaveSecretKeyScreen', () => ({
  SaveSecretKeyScreen: () => <div data-testid="secret-key-screen" />,
}))

const renderModalContent = (
  overrides: Partial<CreateFormWizardContextReturn>,
) => {
  const value = {
    currentStep: CreateFormFlowStates.Details,
    direction: 1,
    isPaperTrackingSetUpPageEnabled: true,
    isLegacySetup: false,
    onClose: vi.fn(),
    ...overrides,
  } as CreateFormWizardContextReturn

  render(
    <ChakraProvider theme={theme}>
      <Modal isOpen onClose={() => undefined}>
        <ModalContent>
          <CreateFormWizardContext.Provider value={value}>
            <CreateFormModalContent />
          </CreateFormWizardContext.Provider>
        </ModalContent>
      </Modal>
    </ChakraProvider>,
  )
}

// ProgressIndicator renders one button per step, labelled "Page X of Y".
const getStepDots = () =>
  screen.queryAllByRole('button', { name: /^Page \d+ of \d+$/ })

describe('CreateFormModalContent progress indicator', () => {
  it('shows 3 steps on the paper-tracking set-up flow', () => {
    renderModalContent({
      currentStep: CreateFormFlowStates.Details,
      isLegacySetup: false,
    })

    expect(getStepDots()).toHaveLength(3)
  })

  it('shows 2 steps on the legacy set-up flow', () => {
    renderModalContent({
      currentStep: CreateFormFlowStates.StorageModeDetails,
      isLegacySetup: true,
    })

    expect(getStepDots()).toHaveLength(2)
  })

  it('keeps the 2-step legacy sequence through to the secret key page', () => {
    renderModalContent({
      currentStep: CreateFormFlowStates.Landing,
      isLegacySetup: true,
    })

    expect(getStepDots()).toHaveLength(2)
  })

  it('does not render the indicator when the paper-tracking flag is off', () => {
    renderModalContent({
      currentStep: CreateFormFlowStates.Details,
      isPaperTrackingSetUpPageEnabled: false,
    })

    expect(getStepDots()).toHaveLength(0)
  })
})
