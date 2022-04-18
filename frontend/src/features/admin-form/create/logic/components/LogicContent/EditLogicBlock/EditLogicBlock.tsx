import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Stack } from '@chakra-ui/react'
import { merge } from 'lodash'

import { LogicDto } from '~shared/types'

import { useAdminLogicStore } from '../../../adminLogicStore'
import { useAdminFormLogic } from '../../../hooks/useAdminFormLogic'
import { useLogicMutations } from '../../../mutations'
import { EditLogicInputs } from '../../../types'

import {
  AddConditionDivider,
  EditConditionBlock,
  EditConditionBlockDivider,
  EditConditionWrapper,
  SaveActionGroup,
  ThenShowBlock,
} from './EditCondition'

type UseEditLogicBlockProps = {
  /** Sets default values of inputs if this is provided */
  logic?: LogicDto
  onSubmit: (inputs: EditLogicInputs) => void
}

// Allow injection of custom hook for testing.
// Exported for testing.
export const useEditLogicBlockDefault = ({
  logic,
  onSubmit,
}: UseEditLogicBlockProps) => {
  const setToInactive = useAdminLogicStore(
    useCallback((state) => state.setToInactive, []),
  )
  const { logicableFields, mapIdToField, formFields } = useAdminFormLogic()
  const { createLogicMutation } = useLogicMutations()

  const formMethods = useForm<EditLogicInputs>({
    defaultValues: merge({ conditions: [{}] }, logic),
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

  const handleAddCondition = useCallback(() => append({}), [append])

  // Only allow logic removal if there is more than one logic block.
  const handleRemoveCondition = useMemo(
    () => (logicConditionBlocks.length > 1 ? remove : undefined),
    [logicConditionBlocks.length, remove],
  )

  const handleCreateLogic = formMethods.handleSubmit((inputs) =>
    onSubmit(inputs),
  )

  return {
    formMethods,
    logicConditionBlocks,
    handleCreateLogic,
    handleAddCondition,
    handleRemoveCondition,
    wrapperRef,
    isLoading: createLogicMutation.isLoading,
    setToInactive,
    logicableFields,
    mapIdToField,
    formFields,
  }
}

export interface EditLogicBlockProps {
  useEditLogicBlock?: typeof useEditLogicBlockDefault
  logic?: LogicDto
  onSubmit: (inputs: EditLogicInputs) => void
}

export const EditLogicBlock = ({
  useEditLogicBlock = useEditLogicBlockDefault,
  onSubmit,
  logic,
}: EditLogicBlockProps) => {
  const {
    formMethods,
    logicConditionBlocks,
    wrapperRef,
    handleCreateLogic,
    handleAddCondition,
    handleRemoveCondition,
    isLoading,
    setToInactive,
    logicableFields,
    mapIdToField,
    formFields,
  } = useEditLogicBlock({ logic, onSubmit })

  return (
    <EditConditionWrapper ref={wrapperRef}>
      <Stack
        divider={<EditConditionBlockDivider />}
        direction="column"
        py="1.5rem"
        px={{ base: '1.5rem', md: '2rem' }}
      >
        {logicConditionBlocks.map((block, index) => {
          return (
            <EditConditionBlock
              logicableFields={logicableFields}
              mapIdToField={mapIdToField}
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
        mapIdToField={mapIdToField}
        isLoading={isLoading}
      />
      <SaveActionGroup
        isLoading={isLoading}
        handleSubmit={handleCreateLogic}
        handleCancel={setToInactive}
        submitButtonLabel={logic ? 'Save changes' : 'Add logic'}
      />
    </EditConditionWrapper>
  )
}
