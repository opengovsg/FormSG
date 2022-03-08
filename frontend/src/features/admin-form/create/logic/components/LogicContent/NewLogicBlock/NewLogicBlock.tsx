import { useCallback, useLayoutEffect, useRef } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { Stack } from '@chakra-ui/react'

import { useAdminLogicStore } from '../../../adminLogicStore'
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
    console.log(inputs)
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
                key={field.id}
                index={index}
                // Only allow logic removal if there is more than one logic block.
                handleRemoveLogic={fields.length > 1 ? remove : undefined}
              />
            )
          })}
        </Stack>
        <AddConditionDivider handleAddCondition={() => append({})} />
        <ThenShowBlock />
        <SaveActionGroup
          handleDelete={setToInactive}
          handleSubmit={handleCreateLogic}
          handleCancel={setToInactive}
          submitButtonLabel="Add logic"
        />
      </EditConditionWrapper>
    </FormProvider>
  )
}
