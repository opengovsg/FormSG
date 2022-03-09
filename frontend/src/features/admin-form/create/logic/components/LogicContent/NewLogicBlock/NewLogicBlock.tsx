import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Stack } from '@chakra-ui/react'

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
} from '../EditCondition'

const useNewLogicBlock = () => {
  const setToInactive = useAdminLogicStore(
    useCallback((state) => state.setToInactive, []),
  )
  const { logicableFields, mapIdToField, formFields } = useAdminFormLogic()
  const { createLogicMutation } = useLogicMutations()

  const formMethods = useForm<EditLogicInputs>({
    defaultValues: {
      conditions: [{}],
    },
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
  const handleRemoveLogic = useMemo(
    () => (logicConditionBlocks.length > 0 ? remove : undefined),
    [logicConditionBlocks.length, remove],
  )

  const handleCreateLogic = formMethods.handleSubmit((inputs) => {
    return createLogicMutation.mutate(inputs, {
      onSuccess: () => setToInactive(),
    })
  })

  return {
    formMethods,
    logicConditionBlocks,
    handleCreateLogic,
    handleAddCondition,
    handleRemoveLogic,
    wrapperRef,
    isLoading: createLogicMutation.isLoading,
    setToInactive,
    logicableFields,
    mapIdToField,
    formFields,
  }
}

export const NewLogicBlock = () => {
  const {
    formMethods,
    logicConditionBlocks,
    wrapperRef,
    handleRemoveLogic,
    handleCreateLogic,
    handleAddCondition,
    isLoading,
    setToInactive,
    logicableFields,
    mapIdToField,
    formFields,
  } = useNewLogicBlock()

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
              handleRemoveLogic={handleRemoveLogic}
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
        handleDelete={setToInactive}
        handleSubmit={handleCreateLogic}
        handleCancel={setToInactive}
        submitButtonLabel="Add logic"
      />
    </EditConditionWrapper>
  )
}
