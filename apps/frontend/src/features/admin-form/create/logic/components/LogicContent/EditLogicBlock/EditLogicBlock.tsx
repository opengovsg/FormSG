import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Stack } from '@chakra-ui/react'
import { merge } from 'lodash'

import { LogicConditionState } from 'formsg-shared/types'

import {
  cancelPendingSwitchSelector,
  completeSaveSelector,
  isCreatingStateSelector,
  pendingSwitchToSelector,
  setToInactiveSelector,
  useAdminLogicStore,
} from '../../../adminLogicStore'
import { useAdminFormLogic } from '../../../hooks/useAdminFormLogic'
import { EditLogicInputs } from '../../../types'

import {
  AddConditionDivider,
  EditConditionBlock,
  EditConditionBlockDivider,
  EditConditionWrapper,
  SaveActionGroup,
  ThenShowBlock,
} from './EditCondition'

export interface UseEditLogicBlockProps {
  /** Sets default values of inputs if this is provided */
  defaultValues?: Partial<EditLogicInputs>
  onSubmit: (inputs: EditLogicInputs) => void
}

export const useEditLogicBlock = ({
  defaultValues,
  onSubmit,
}: UseEditLogicBlockProps) => {
  const setToInactive = useAdminLogicStore(setToInactiveSelector)
  const cancelPendingSwitch = useAdminLogicStore(cancelPendingSwitchSelector)
  const { logicableFields, idToFieldMap, formFields } = useAdminFormLogic()

  const formMethods = useForm<EditLogicInputs>({
    defaultValues: merge({ conditions: [{}] }, defaultValues),
    shouldUnregister: true,
  })
  const {
    fields: logicConditionBlocks,
    append,
    remove,
  } = useFieldArray({
    control: formMethods.control,
    name: 'conditions',
  })

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: 'smooth',
        // Block required so parent (with overflow:hidden) will not be scrolled
        // and causing unscrollable white space.
        // See https://stackoverflow.com/questions/48634459/scrollintoview-block-vs-inline/48635751#48635751
        block: 'nearest',
      })
    }
  }, [])

  const handleAddCondition = useCallback(
    () =>
      append({
        // Cannot be undefined or the default value will be used.
        // This may cause old values to be shown when appending.
        field: '',
        state: LogicConditionState.Empty,
        value: '',
      }),
    [append],
  )

  // Only allow logic removal if there is more than one logic block.
  const handleRemoveCondition = useMemo(
    () => (logicConditionBlocks.length > 1 ? remove : undefined),
    [logicConditionBlocks.length, remove],
  )

  // An invalid submit cancels any pending switch so the card stays open; the
  // Save-button path never has a pending switch, so that cancel is a no-op there.
  const handleSubmit = formMethods.handleSubmit(
    (inputs) => onSubmit(inputs),
    cancelPendingSwitch,
  )

  return {
    formMethods,
    logicConditionBlocks,
    handleSubmit,
    handleAddCondition,
    handleRemoveCondition,
    wrapperRef,
    setToInactive,
    logicableFields,
    idToFieldMap,
    formFields,
  }
}

export interface EditLogicBlockProps extends UseEditLogicBlockProps {
  submitButtonLabel: string
  handleOpenDeleteModal?: () => void
  isLoading: boolean
}

export const EditLogicBlock = ({
  onSubmit,
  defaultValues,
  isLoading,
  submitButtonLabel,
  handleOpenDeleteModal,
}: EditLogicBlockProps) => {
  const { t } = useTranslation()
  const {
    formMethods,
    logicConditionBlocks,
    wrapperRef,
    handleSubmit,
    handleAddCondition,
    handleRemoveCondition,
    setToInactive,
    logicableFields,
    idToFieldMap,
    formFields,
  } = useEditLogicBlock({ defaultValues, onSubmit })

  const pendingSwitchTo = useAdminLogicStore(pendingSwitchToSelector)
  const completeSave = useAdminLogicStore(completeSaveSelector)
  const isCreatingState = useAdminLogicStore(isCreatingStateSelector)

  // RATIONALE: Returned formState is wrapped with a Proxy to improve
  // render performance, we must ead it before a render in order to enable
  // the state update.
  const { isDirty } = formMethods.formState

  // Guards the auto-save effect against re-entry: the mutation's isLoading
  // only flips true on the render after mutate() is called, and handleSubmit's
  // validation is promise-based, so a second card click landing in that window
  // would pass the isLoading check and submit again (double-saving an existing
  // block, or creating a new block twice). Set synchronously before submitting;
  // cleared when the pending switch resolves (pendingSwitchTo returns to null
  // on cancel, or this card unmounts on success).
  const hasSubmittedForPendingSwitch = useRef(false)

  // Auto-save when another logic block is clicked while this one is open.
  // InactiveLogicBlock sets pendingSwitchTo; this effect is dormant until it
  // does. Shared by both the edit (ActiveLogicBlock) and create (NewLogicBlock)
  // paths.
  useEffect(() => {
    if (pendingSwitchTo === null) {
      hasSubmittedForPendingSwitch.current = false
      return
    }

    // A save is already in flight; its onSuccess completes the switch.
    // Submitting again would double-save and collapse the target.
    if (isLoading || hasSubmittedForPendingSwitch.current) return

    // A new block has nothing persisted yet, so it must always run validation
    // (like the Add logic button): an incomplete new block blocks the switch.
    // An existing block that wasn't touched can switch directly without a
    // redundant save.
    if (!isCreatingState && !isDirty) {
      completeSave()
      return
    }

    hasSubmittedForPendingSwitch.current = true
    handleSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSwitchTo])

  return (
    <EditConditionWrapper ref={wrapperRef}>
      <Stack
        divider={<EditConditionBlockDivider />}
        direction="column"
        pb="1.5rem"
        px={{ base: '1.5rem', md: '2rem' }}
      >
        {logicConditionBlocks.map((block, index) => {
          return (
            <EditConditionBlock
              logicableFields={logicableFields}
              idToFieldMap={idToFieldMap}
              formMethods={formMethods}
              isLoading={isLoading}
              key={block.id}
              index={index}
              handleRemoveCondition={handleRemoveCondition}
            />
          )
        })}
      </Stack>
      <AddConditionDivider
        isDisabled={isLoading}
        handleAddCondition={handleAddCondition}
      />
      <ThenShowBlock
        formFields={formFields}
        formMethods={formMethods}
        idToFieldMap={idToFieldMap}
        isLoading={isLoading}
      />
      <SaveActionGroup
        isLoading={isLoading}
        handleSubmit={handleSubmit}
        handleDelete={handleOpenDeleteModal}
        handleCancel={setToInactive}
        submitButtonLabel={submitButtonLabel}
        ariaLabelName={t('features.adminForm.sidebar.logic.aria.logicName')}
      />
    </EditConditionWrapper>
  )
}
