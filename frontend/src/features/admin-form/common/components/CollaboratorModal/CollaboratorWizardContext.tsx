import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useForm, UseFormHandleSubmit, UseFormReturn } from 'react-hook-form'

import { FormPermission } from '~shared/types'

import { useUser } from '~features/user/queries'

import { useMutateCollaborators } from '../../mutations'
import { useAdminForm } from '../../queries'

import { DropdownRole } from './constants'
import { roleToPermission } from './utils'

export enum CollaboratorFlowStates {
  List = 'list',
  TransferOwner = 'transferOwner',
}

type CollaboratorWizardContextReturn = {
  currentStep: CollaboratorFlowStates
  direction: number
  /** So wizard screens can keep track of the current form state */
  formMethods: UseFormReturn<AddCollaboratorInputs>
  handleBackToList: () => void
  handleListSubmit: ReturnType<UseFormHandleSubmit<AddCollaboratorInputs>>
  handleTransferOwnershipSubmit: ReturnType<
    UseFormHandleSubmit<AddCollaboratorInputs>
  >
  isMutationLoading: boolean
  formAdminEmail?: string
  isFormAdmin: boolean
}

export type AddCollaboratorInputs = {
  email: string
  role: DropdownRole
}

const CollaboratorWizardContext = createContext<
  CollaboratorWizardContextReturn | undefined
>(undefined)

const INITIAL_STEP_STATE: [CollaboratorFlowStates, number] = [
  CollaboratorFlowStates.List,
  0 | 1 | -1,
]

const useCollaboratorWizardContext = (): CollaboratorWizardContextReturn => {
  const { data: form } = useAdminForm()
  const { user } = useUser()
  const { mutateAddCollaborator, mutateTransferFormOwnership } =
    useMutateCollaborators()

  const [[currentStep, direction], setCurrentStep] =
    useState(INITIAL_STEP_STATE)

  const formMethods = useForm<AddCollaboratorInputs>({
    defaultValues: {
      email: '',
      role: DropdownRole.Editor,
    },
  })

  const isFormAdmin = useMemo(
    () => !!user && !!form && user.email === form.admin.email,
    [form, user],
  )

  const handleBackToList = useCallback(() => {
    setCurrentStep([CollaboratorFlowStates.List, -1])
  }, [])

  const handleForwardToTransferOwnership = useCallback(() => {
    setCurrentStep([CollaboratorFlowStates.TransferOwner, 1])
  }, [])

  const handleAddCollaborator = useCallback(
    (inputs: AddCollaboratorInputs) => {
      if (!form?.permissionList) return

      const newPermission: FormPermission = {
        ...roleToPermission(inputs.role),
        email: inputs.email,
      }
      return mutateAddCollaborator.mutate(
        {
          newPermission,
          currentPermissions: form.permissionList,
        },
        {
          onSuccess: () => formMethods.reset(),
        },
      )
    },
    [form?.permissionList, formMethods, mutateAddCollaborator],
  )

  const handleListSubmit = formMethods.handleSubmit((inputs) => {
    if (!form?.permissionList) return

    // Handle transfer form ownership instead of granting admin rights.
    if (inputs.role === DropdownRole.Owner) {
      return handleForwardToTransferOwnership()
    }

    return handleAddCollaborator(inputs)
  })

  const handleTransferOwnershipSubmit = formMethods.handleSubmit((inputs) => {
    if (!form?.permissionList || inputs.role !== DropdownRole.Owner) return
    return mutateTransferFormOwnership.mutate(inputs.email, {
      onSuccess: () => {
        handleBackToList()
        formMethods.reset()
      },
    })
  })

  return {
    currentStep,
    direction,
    handleBackToList,
    formMethods,
    formAdminEmail: form?.admin.email,
    isFormAdmin,
    handleListSubmit,
    handleTransferOwnershipSubmit,
    isMutationLoading:
      mutateAddCollaborator.isLoading || mutateTransferFormOwnership.isLoading,
  }
}

export const CollaboratorWizardProvider = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const values = useCollaboratorWizardContext()
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
