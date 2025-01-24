import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Flex, Portal, Text } from '@chakra-ui/react'

import { NextAndBackButtonGroup } from '~components/Button'
import BottomHugBox from '~components/Hug/BottomHugBox'

import { useAssistanceMutations } from '~features/admin-form/assistance/mutations'

import { useDeleteFormField } from '../../mutations/useDeleteFormField'
import {
  recentlyCreatedFieldIdsSelector,
  useMagicFormBuilderStore,
} from '../../useMagicFormBuilderStore'
import MagicFormBuilderPromptModal, {
  TextPromptInputs,
} from '../MagicFormBuilderPromptModal'

export const MagicFormBuilderContainer = ({
  renderClickable,
}: {
  renderClickable: ({
    isActive,
    onClick,
  }: {
    isActive?: boolean
    onClick: () => void
  }) => JSX.Element
}) => {
  const { formId } = useParams()

  const [isOpen, setIsOpen] = useState(false)

  const clearRecentlyCreatedFieldIds = useMagicFormBuilderStore(
    (state) => state.clearRecentlyCreatedFieldIds,
  )
  const recentlyCreatedFieldIds = useMagicFormBuilderStore(
    recentlyCreatedFieldIdsSelector,
  )

  const onClickDefaults = () => {
    setIsOpen(false)
    if (formId) {
      setTimeout(() => {
        clearRecentlyCreatedFieldIds(formId)
      }, 100) // only clear after the popover is closed
    }
  }

  const { deleteMultipleFormFieldsMutation } = useDeleteFormField()

  const deleteRecentlyCreatedFieldIds = () => {
    if (formId) {
      deleteMultipleFormFieldsMutation.mutate(
        Array.from(recentlyCreatedFieldIds[formId]),
        {
          onSuccess: onClickDefaults,
        },
      )
    }
  }

  const { useMakeTextPromptMutation } = useAssistanceMutations()

  const submitGenerateFormTextPrompt = async ({ prompt }: TextPromptInputs) => {
    useMakeTextPromptMutation.mutate(prompt, {
      onSuccess: () => {
        setIsOpen(false)
      },
    })
  }

  const fieldIds = formId ? recentlyCreatedFieldIds[formId] : null
  const isAcceptDenyOpen = !!fieldIds && fieldIds.size > 0

  return (
    <>
      <MagicFormBuilderPromptModal
        isOpen={isOpen}
        onSubmit={submitGenerateFormTextPrompt}
        isSubmitLoading={useMakeTextPromptMutation.isLoading}
        onClose={() => setIsOpen(false)}
      />
      {isAcceptDenyOpen ? (
        <MagicFormBuilderAcceptDeny
          onAccept={onClickDefaults}
          onDeny={deleteRecentlyCreatedFieldIds}
        />
      ) : null}
      {renderClickable({ isActive: isOpen, onClick: () => setIsOpen(!isOpen) })}
    </>
  )
}

const MagicFormBuilderAcceptDeny = ({
  onAccept,
  onDeny,
}: {
  onAccept: () => void
  onDeny: () => void
}) => {
  return (
    <Portal>
      <BottomHugBox>
        <Flex direction="column" gap="1rem">
          <Text>Use these fields?</Text>
          <NextAndBackButtonGroup
            handleBack={onDeny}
            handleNext={onAccept}
            nextButtonLabel="Yes, keep them"
            backButtonLabel="No, delete them"
          />
        </Flex>
      </BottomHugBox>
    </Portal>
  )
}
