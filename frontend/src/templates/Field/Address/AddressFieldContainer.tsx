import { useMemo } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { Box, Flex, FormControl, Stack } from '@chakra-ui/react'
import { get } from 'lodash'

import {
  createAddressValidationRules,
  createBaseValidationRules,
} from '~utils/fieldValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { AddressFieldInput, AddressFieldSchema } from '../types'

export type AddressFieldContainerProps = {
  schema: AddressFieldSchema
  disableRequiredValidation?: boolean
}

export const AddressFieldContainer = ({
  schema,
  disableRequiredValidation,
}: AddressFieldContainerProps): JSX.Element => {
  const validationRules = useMemo(
    () => createAddressValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const { isSubmitting, isValid } = useFormState()

  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<AddressFieldInput>()

  return (
    <Box>
      <FormControl
        id={schema._id}
        isRequired={schema.required}
        isDisabled={schema.disabled}
        isReadOnly={isValid && isSubmitting}
        isInvalid={!!errors?.postalCode}
      >
        <FormLabel
          questionNumber={
            schema.questionNumber ? `${schema.questionNumber}.` : undefined
          }
          description={schema.description}
        >
          {schema.title}
        </FormLabel>
        <FormLabel>Postal Code</FormLabel>
        <Controller
          name="postalCode"
          control={control}
          rules={validationRules}
          render={({ field }) => (
            <Stack direction="column" gap={0.5} marginBottom="1.5rem">
              <Flex
                direction="row"
                gap={2}
                justify="space-between"
                width="100%"
              >
                <Input
                  aria-label={`${schema.questionNumber}. Postal Code`}
                  placeholder={
                    field.value ? `Enter Postal Code` : `e.g. 610161`
                  }
                />
                <Button> Find Address</Button>
              </Flex>
            </Stack>
          )}
        />
      </FormControl>
      <FormControl>
        <FormLabel>House/Block Number</FormLabel>
        <Input
          aria-label={`${schema.questionNumber}. Block Number`}
          defaultValue=""
          placeholder="e.g. 161"
          marginBottom="1.5rem"
          {...register('blockNumber')}
        />
      </FormControl>
    </Box>

    //   <FormLabel>Street Name</FormLabel>
    //   <Input
    //     aria-label={`${schema.questionNumber}. Street Name`}
    //     defaultValue=""
    //     placeholder="e.g. Bukit Batok Street"
    //     marginBottom="1.5rem"
    //     {...register('streetName')}
    //   />
    //   <Stack direction="row">
    //     <FormLabel isRequired={false}>Building Name</FormLabel>
    //   </Stack>
    //   <Input
    //     aria-label={`${schema.questionNumber}. Building`}
    //     defaultValue=""
    //     marginBottom="1.5rem"
    //     {...register('building')}
    //   />
    //   <FormLabel isRequired={false}>Unit Number</FormLabel>
    //   <Stack direction="row">
    //     <Input
    //       aria-label={`${schema.questionNumber}. Unit Number`}
    //       defaultValue=""
    //       marginBottom="1.5rem"
    //       {...register('unitNumber')}
    //     />
    //     <Input
    //       aria-label={`${schema.questionNumber}. Unit Number`}
    //       defaultValue=""
    //       {...register('unitNumber')}
    //     />
    //   </Stack>
    // </FormControl>
  )
}
