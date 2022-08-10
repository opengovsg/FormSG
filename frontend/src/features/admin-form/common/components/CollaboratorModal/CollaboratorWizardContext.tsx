import { createContext, useCallback, useContext, useState } from 'react'

export enum CollaboratorFlowStates {
  List = 'list',
  TransferOwner = 'transferOwner',
  RemoveSelf = 'removeSelf',
}

type CollaboratorWizardContextReturn = {
  currentStep: CollaboratorFlowStates
  direction: number
  handleBackToList: () => void
  emailToTransfer: string | null
  handleForwardToTransferOwnership: (emailToTransfer: string) => void
  handleForwardToRemoveSelf: () => void
  formId: string | undefined
}

const CollaboratorWizardContext = createContext<
  CollaboratorWizardContextReturn | undefined
>(undefined)

const INITIAL_STEP_STATE: [CollaboratorFlowStates, number] = [
  CollaboratorFlowStates.List,
  0 | 1 | -1,
]

const useCollaboratorWizardContext = (
  formIdContext: string | undefined,
): CollaboratorWizardContextReturn => {
  const [[currentStep, direction], setCurrentStep] =
    useState(INITIAL_STEP_STATE)
  const [emailToTransfer, setEmailToTransfer] = useState<string | null>(null)

  const handleBackToList = useCallback(() => {
    setEmailToTransfer(null)
    setCurrentStep([CollaboratorFlowStates.List, -1])
  }, [])

  const handleForwardToTransferOwnership = useCallback(
    (emailToTransfer: string) => {
      setEmailToTransfer(emailToTransfer)
      setCurrentStep([CollaboratorFlowStates.TransferOwner, 1])
    },
    [],
  )

  const handleForwardToRemoveSelf = useCallback(() => {
    setCurrentStep([CollaboratorFlowStates.RemoveSelf, 1])
  }, [])

  const formId = formIdContext

  return {
    currentStep,
    direction,
    handleBackToList,
    emailToTransfer,
    handleForwardToTransferOwnership,
    handleForwardToRemoveSelf,
    formId,
  }
}

export const CollaboratorWizardProvider = ({
  children,
  formIdContext,
}: {
  children: React.ReactNode
  formIdContext: string | undefined
}): JSX.Element => {
  const values = useCollaboratorWizardContext(formIdContext)
  return (
    <CollaboratorWizardContext.Provider value={values}>
      {children}
    </CollaboratorWizardContext.Provider>
  )
}

export const useCollaboratorWizard = (): CollaboratorWizardContextReturn => {
  const context = useContext(CollaboratorWizardContext)
  if (!context) {
    throw new Error(
      `useCollaboratorWizard must be used within a CollaboratorWizardProvider component`,
    )
  }
  return context
}
