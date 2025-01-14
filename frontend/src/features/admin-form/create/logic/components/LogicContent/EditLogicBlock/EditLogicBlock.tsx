import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Stack } from '@chakra-ui/react'
import { merge } from 'lodash'

import {
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
      }),
    [append],
  )

  // Only allow logic removal if there is more than one logic block.
  const handleRemoveCondition = useMemo(
    () => (logicConditionBlocks.length > 1 ? remove : undefined),
    [logicConditionBlocks.length, remove],
  )

  const handleSubmit = formMethods.handleSubmit((inputs) => onSubmit(inputs))

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
        ariaLabelName="logic"
      />
    </EditConditionWrapper>
  )
}
