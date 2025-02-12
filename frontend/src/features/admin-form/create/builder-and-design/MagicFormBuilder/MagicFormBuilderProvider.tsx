import { createContext, useState } from 'react'
import { useParams } from 'react-router-dom'

import { FCC } from '~typings/react'

import { useAssistanceMutations } from '~features/admin-form/assistance/mutations'

import { useDeleteFormField } from '../mutations/useDeleteFormField'

import {
  recentlyCreatedFieldIdsSelector,
  useMagicFormBuilderStore,
} from './useMagicFormBuilderStore'

export interface MagicFormBuilderProviderProps {
  isModalOpen: boolean
  toggleIsModalOpen: () => void
  onModalClose: () => void
  isAcceptDenyOpen: boolean
  onAccept: () => void
  onDeny: () => void
  onMfbTextPromptSubmit: (textPrompt: string) => void
  isSubmissionLoading: boolean
}

const magicFormBuilderProviderDefaults: MagicFormBuilderProviderProps = {
  isModalOpen: false,
  isAcceptDenyOpen: false,
  onAccept: () => {},
  onDeny: () => {},
  onModalClose: () => {},
  toggleIsModalOpen: () => {},
  onMfbTextPromptSubmit: () => {},
  isSubmissionLoading: false,
}

export const MagicFormBuilderContext =
  createContext<MagicFormBuilderProviderProps>(magicFormBuilderProviderDefaults)

const MagicFormBuilderProvider: FCC = ({ children }) => {
  const { formId } = useParams()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const clearRecentlyCreatedFieldIds = useMagicFormBuilderStore(
    (state) => state.clearRecentlyCreatedFieldIds,
  )
  const recentlyCreatedFieldIds = useMagicFormBuilderStore(
    recentlyCreatedFieldIdsSelector,
  )

  const { deleteMultipleFormFieldsMutation } = useDeleteFormField()
  const { useMakeTextPromptMutation } = useAssistanceMutations()

  const onModalClose = () => {
    setIsModalOpen(false)
  }

  const closeMfbModalAndClearRecentlyCreated = () => {
    setIsModalOpen(false)
    if (formId) {
      setTimeout(() => {
        clearRecentlyCreatedFieldIds(formId)
      }, 100)
    }
  }

  const onDeny = () => {
    if (formId) {
      deleteMultipleFormFieldsMutation.mutate(
        Array.from(recentlyCreatedFieldIds[formId]),
        {
          onSuccess: closeMfbModalAndClearRecentlyCreated,
        },
      )
    }
  }

  const onMfbTextPromptSubmit = (textPrompt: string) => {
    useMakeTextPromptMutation.mutate(textPrompt, {
      onSuccess: () => {
        setIsModalOpen(false)
      },
    })
  }

  const fieldIds = formId ? recentlyCreatedFieldIds[formId] : null
  const isAcceptDenyOpen = !!fieldIds && fieldIds.size > 0

  return (
    <MagicFormBuilderContext.Provider
      value={{
        isModalOpen,
        toggleIsModalOpen: () => setIsModalOpen(!isModalOpen),
        onModalClose,
        isAcceptDenyOpen,
        onAccept: closeMfbModalAndClearRecentlyCreated,
        onDeny,
        onMfbTextPromptSubmit,
        isSubmissionLoading: useMakeTextPromptMutation.isLoading,
      }}
    >
      {children}
    </MagicFormBuilderContext.Provider>
  )
}

export default MagicFormBuilderProvider
