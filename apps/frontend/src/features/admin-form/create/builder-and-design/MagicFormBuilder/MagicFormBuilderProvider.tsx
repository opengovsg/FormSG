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
  isMfbTextPromptSubmitLoading: boolean
  onMfbVisionPromptSubmit: (imageDataUrls: string[]) => void
  isMfbVisionPromptSubmitLoading: boolean
}

const magicFormBuilderProviderDefaults: MagicFormBuilderProviderProps = {
  isModalOpen: false,
  isAcceptDenyOpen: false,
  onAccept: () => {},
  onDeny: () => {},
  onModalClose: () => {},
  toggleIsModalOpen: () => {},
  onMfbTextPromptSubmit: () => {},
  isMfbTextPromptSubmitLoading: false,
  onMfbVisionPromptSubmit: () => {},
  isMfbVisionPromptSubmitLoading: false,
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
  const { useMakeTextPromptMutation, useMakeVisionPromptMutation } =
    useAssistanceMutations()

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

  const closeModal = () => setIsModalOpen(false)

  const onMfbTextPromptSubmit = (textPrompt: string) => {
    useMakeTextPromptMutation.mutate(textPrompt, {
      onSuccess: closeModal,
    })
  }

  const onMfbVisionPromptSubmit = (imageDataUrls: string[]) => {
    useMakeVisionPromptMutation.mutate(imageDataUrls, {
      onSuccess: closeModal,
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
        isMfbTextPromptSubmitLoading: useMakeTextPromptMutation.isLoading,
        onMfbVisionPromptSubmit,
        isMfbVisionPromptSubmitLoading: useMakeVisionPromptMutation.isLoading,
      }}
    >
      {children}
    </MagicFormBuilderContext.Provider>
  )
}

export default MagicFormBuilderProvider
