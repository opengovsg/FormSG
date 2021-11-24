import { Controller, useForm } from 'react-hook-form'
import { ButtonGroup, Divider, FormControl, Stack } from '@chakra-ui/react'
import { merge } from 'lodash'
import { useDebouncedCallback } from 'use-debounce'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import { SectionFieldSchema } from '~templates/Field/Section/SectionFieldContainer'

import { useEditFieldStore } from '../editFieldStore'
import { useMutateFormFields } from '../mutations'

export interface EditHeaderProps {
  field: SectionFieldSchema
}

interface EditHeaderInputs {
  title: string
  description: string
}

export const EditHeader = ({ field }: EditHeaderProps): JSX.Element => {
  const { updateActiveField } = useEditFieldStore()
  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting, errors },
  } = useForm<EditHeaderInputs>({
    defaultValues: {
      title: field.title,
      description: field.description,
    },
  })

  const debouncedUpdateField = useDebouncedCallback(
    updateActiveField,
    // delay in ms
    300,
  )

  const { mutateFormField } = useMutateFormFields()

  const handleUpdateField = handleSubmit((inputs) => {
    const updatedFormField: SectionFieldSchema = merge({}, field, inputs)
    return mutateFormField.mutate(updatedFormField)
  })

  return (
    <Stack spacing="2rem" divider={<Divider />}>
      <FormControl
        isRequired
        isReadOnly={isValid && isSubmitting}
        isInvalid={!!errors.title}
      >
        <FormLabel>Section header title</FormLabel>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, ...rest } }) => (
            <Input
              onChange={(e) => {
                onChange(e)
                debouncedUpdateField({
                  title: e.target.value,
                })
              }}
              {...rest}
            />
          )}
        />
        <FormErrorMessage>
          {errors.title && errors.title.message}
        </FormErrorMessage>
      </FormControl>
      <FormControl
        isRequired
        isReadOnly={isValid && isSubmitting}
        isInvalid={!!errors.title}
      >
        <FormLabel>Description</FormLabel>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, ...rest } }) => (
            <Textarea
              onChange={(e) => {
                onChange(e)
                debouncedUpdateField({
                  description: e.target.value,
                })
              }}
              {...rest}
            />
          )}
        />
        <FormErrorMessage>
          {errors.title && errors.title.message}
        </FormErrorMessage>
      </FormControl>
      <ButtonGroup justifyContent="end">
        <Button variant="outline">Cancel</Button>
        <Button minW="8rem" onClick={handleUpdateField}>
          Save
        </Button>
      </ButtonGroup>
    </Stack>
  )
}
