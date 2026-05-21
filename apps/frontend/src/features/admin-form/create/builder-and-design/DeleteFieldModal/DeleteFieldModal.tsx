import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ButtonGroup,
  Icon,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  UnorderedList,
} from '@chakra-ui/react'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { BASICFIELD_TO_DRAWER_META } from '../../constants'
import { useAdminFormLogic } from '../../logic/hooks/useAdminFormLogic'
import {
  respondentsSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflow-v2/workflowBuilderStore'
import { useBuilderAndDesignContext } from '../BuilderAndDesignContext'
import { useDeleteFormField } from '../mutations/useDeleteFormField'
import {
  FieldBuilderState,
  stateDataSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'

export const DeleteFieldModal = (): JSX.Element => {
  const { t } = useTranslation()
  const stateData = useFieldBuilderStore(stateDataSelector)
  const {
    deleteFieldModalDisclosure: { onClose },
  } = useBuilderAndDesignContext()
  const { idToFieldMap, logicedFieldIdsSet } = useAdminFormLogic()

  const { fieldIsInLogic, fieldIcon, fieldLabel } = useMemo(() => {
    if (stateData.state !== FieldBuilderState.EditingField) return {}
    const questionNumber = idToFieldMap?.[stateData.field._id].questionNumber
    const fieldTitle = stateData.field.title
    return {
      fieldIsInLogic: logicedFieldIdsSet?.has(stateData.field._id),
      fieldIcon: BASICFIELD_TO_DRAWER_META[stateData.field.fieldType].icon,
      fieldLabel: questionNumber
        ? `${questionNumber}. ${fieldTitle}`
        : fieldTitle,
    }
  }, [idToFieldMap, stateData, logicedFieldIdsSet])

  // Workflow checks
  const steps = useWorkflowBuilderStore(stepsSelector)
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const unassignField = useWorkflowBuilderStore((s) => s.unassignField)
  const unassignApprovalField = useWorkflowBuilderStore(
    (s) => s.unassignApprovalField,
  )

  const workflowWarning = useMemo(() => {
    if (stateData.state !== FieldBuilderState.EditingField) return null
    const fid = stateData.field._id

    // Check if field is used for routing (linked to a respondent)
    const linkedRespondent = respondents.find((r) => r.linkedFieldId === fid)
    if (linkedRespondent) {
      const linkedSteps = steps.filter((s) =>
        s.respondentIds.includes(linkedRespondent.id),
      )
      const stepName = linkedSteps[0]?.name ?? 'a step'
      return {
        title: 'This field is used for workflow routing',
        body: `Removing this field will remove the workflow routing for ${stepName}`,
      }
    }

    // Check if field is assigned to any step
    const assignedSteps = steps.filter(
      (s) => s.fieldIds.includes(fid) || s.approvalFieldIds.includes(fid),
    )
    if (assignedSteps.length > 0) {
      const stepName = assignedSteps[0].name
      return {
        title: 'This field is currently assigned to a step',
        body: `Removing this field will also remove it from ${stepName}`,
      }
    }

    return null
  }, [stateData, steps, respondents])

  const { deleteFieldMutation } = useDeleteFormField()

  const handleDeleteConfirmation = useCallback(() => {
    if (stateData.state === FieldBuilderState.EditingField) {
      const fid = stateData.field._id

      // Clean up workflow assignments on delete
      steps.forEach((s) => {
        if (s.fieldIds.includes(fid)) unassignField(s.id, fid)
        if (s.approvalFieldIds.includes(fid)) unassignApprovalField(s.id, fid)
      })

      deleteFieldMutation.mutate(fid, {
        onSuccess: onClose,
      })
    }
  }, [
    deleteFieldMutation,
    onClose,
    stateData,
    steps,
    unassignField,
    unassignApprovalField,
  ])

  const {
    title,
    description: { field, logic },
    confirmButtonText,
  } = t('features.adminForm.modals.deleteField', { returnObjects: true })

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>{workflowWarning?.title ?? title}</ModalHeader>
        <ModalBody>
          <Text color="secondary.500">
            {workflowWarning?.body ?? (fieldIsInLogic ? logic : field)}
          </Text>
          <UnorderedList
            spacing="0.5rem"
            listStyleType="none"
            ml="1.75rem"
            mt="1rem"
          >
            <ListItem
              display="flex"
              alignItems="flex-start"
              wordBreak="break-word"
            >
              <Icon
                as={fieldIcon}
                fontSize="1.25rem"
                h="1.5rem"
                ml="-1.75rem"
                mr="0.5rem"
              />
              {fieldLabel}
            </ListItem>
          </UnorderedList>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              {t('features.common.cancel')}
            </Button>
            <Button
              colorScheme="danger"
              onClick={handleDeleteConfirmation}
              isLoading={deleteFieldMutation.isLoading}
            >
              {confirmButtonText}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
