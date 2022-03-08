import { useCallback, useLayoutEffect, useRef } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { Stack } from '@chakra-ui/react'

import { useAdminLogicStore } from '../../../adminLogicStore'
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

export const NewLogicBlock = () => {
  const setToInactive = useAdminLogicStore(
    useCallback((state) => state.setToInactive, []),
  )
  const { createLogicMutation } = useLogicMutations()

  const formMethods = useForm<EditLogicInputs>({
    defaultValues: {
      conditions: [{}],
    },
  })
  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'conditions',
  })

  const ref = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  const handleCreateLogic = formMethods.handleSubmit((inputs) => {
    return createLogicMutation.mutate(inputs, {
      onSuccess: () => setToInactive(),
    })
  })

  return (
    <FormProvider {...formMethods}>
      <EditConditionWrapper ref={ref}>
        <Stack
          divider={<EditConditionBlockDivider />}
          direction="column"
          py="1.5rem"
          px={{ base: '1.5rem', md: '2rem' }}
        >
          {fields.map((field, index) => {
            return (
              <EditConditionBlock
                isLoading={createLogicMutation.isLoading}
                key={field.id}
                index={index}
                // Only allow logic removal if there is more than one logic block.
                handleRemoveLogic={fields.length > 1 ? remove : undefined}
              />
            )
          })}
        </Stack>
        <AddConditionDivider
          isDisabled={createLogicMutation.isLoading}
          handleAddCondition={() => append({})}
        />
        <ThenShowBlock isLoading={createLogicMutation.isLoading} />
        <SaveActionGroup
          isLoading={createLogicMutation.isLoading}
          handleDelete={setToInactive}
          handleSubmit={handleCreateLogic}
          handleCancel={setToInactive}
          submitButtonLabel="Add logic"
        />
      </EditConditionWrapper>
    </FormProvider>
  )
}
