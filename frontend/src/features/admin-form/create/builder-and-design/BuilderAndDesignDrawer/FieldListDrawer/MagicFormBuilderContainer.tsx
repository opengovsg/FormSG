import { forwardRef, useState } from 'react'
import { BiSolidMagicWand } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import { Button, Flex, Icon, Portal, Text, Tooltip } from '@chakra-ui/react'

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

export const MagicFormBuilderContainer = () => {
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
      <MagicFormBuilderButton
        isActive={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />
    </>
  )
}

const MagicFormBuilderButton = forwardRef(
  (
    {
      isActive,
      onClick,
      ...styleProps
    }: { isActive: boolean; onClick: () => void } & React.ComponentProps<
      typeof Button
    >,
    ref,
  ) => {
    return (
      <Tooltip openDelay={500} hasArrow label="Create fields with AI">
        <Button
          ref={ref} // Rationale: forward ref allows the popover placement to work.
          variant="outline"
          onClick={onClick}
          padding="0"
          borderColor="primary.200"
          backgroundColor={isActive ? 'primary.200' : undefined}
          _hover={{
            backgroundColor: 'primary.200',
          }}
          borderWidth="1px"
          {...styleProps}
        >
          <Icon as={BiSolidMagicWand} color="primary.500" fontSize="1.5rem" />
        </Button>
      </Tooltip>
    )
  },
)

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
