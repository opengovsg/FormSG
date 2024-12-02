import { useMemo, useState } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { Box, Flex, FormControl, Stack } from '@chakra-ui/react'

import {
  createBlockNumberValidationRules,
  createPostalCodeValidationRules,
  createStreetNameValidationRules,
  createUnitLevelNumberValidationRules,
} from '~utils/fieldValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { BaseFieldProps } from '../FieldContainer'
import { AddressFieldInput, AddressFieldSchema } from '../types'

export interface AddressFieldProps extends BaseFieldProps {
  schema: AddressFieldSchema
  disableRequiredValidation?: boolean
}

export const AddressField = ({
  schema,
  disableRequiredValidation,
}: AddressFieldProps): JSX.Element => {
  const { isSubmitting, isValid, errors } = useFormState<AddressFieldInput>()

  const { setValue, control } = useFormContext<AddressFieldInput>()

  const postalCodeValidationRules = useMemo(
    () => createPostalCodeValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const blockNumberValidationRules = useMemo(
    () => createBlockNumberValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const streetNameValidationRules = useMemo(
    () => createStreetNameValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const unitLevelNumberValidationRules = useMemo(
    () => createUnitLevelNumberValidationRules(schema),
    [schema],
  )

  return (
    <Box>
      <FormLabel
        isRequired={schema.required}
        questionNumber={
          schema.questionNumber ? `${schema.questionNumber}.` : undefined
        }
        description={schema.description}
      >
        {schema.title}
      </FormLabel>
      <FormControl
        id={`${schema._id}-postalCode`}
        isRequired={schema.required}
        isDisabled={schema.disabled}
        isReadOnly={isValid && isSubmitting}
        isInvalid={!!errors?.postalCode}
      >
        <FormLabel>Postal Code</FormLabel>
        <Controller
          name="postalCode"
          control={control}
          defaultValue=""
          rules={postalCodeValidationRules}
          render={({ field }) => (
            <Stack direction="column" gap={0.5} marginBottom="1.5rem">
              <Flex
                direction="row"
                gap={2}
                justify="space-between"
                width="100%"
              >
                <Input
                  {...field}
                  aria-label={`${schema.questionNumber}. Postal Code`}
                  placeholder="e.g. 610161"
                />
                <Button> Find Address</Button>
              </Flex>
              <FormErrorMessage>
                {errors.postalCode
                  ? errors.postalCode.message
                  : 'Invalid postal code'}
              </FormErrorMessage>
            </Stack>
          )}
        />
      </FormControl>
      <FormControl
        id={`${schema._id}-blockNumber`}
        isRequired={schema.required}
        isDisabled={schema.disabled}
        isReadOnly={isValid && isSubmitting}
        isInvalid={!!errors?.blockNumber}
      >
        <FormLabel>House/Block Number</FormLabel>
        <Controller
          name="blockNumber"
          control={control}
          defaultValue=""
          rules={blockNumberValidationRules}
          render={({ field }) => (
            <Box marginBottom="1.5rem">
              <Input
                {...field}
                aria-label={`${schema.questionNumber}. Block Number`}
                placeholder="e.g. 161"
              />
              <FormErrorMessage>{errors.blockNumber?.message}</FormErrorMessage>
            </Box>
          )}
        />
      </FormControl>
      <FormControl
        id={`${schema._id}-streetName`}
        isRequired={schema.required}
        isDisabled={schema.disabled}
        isReadOnly={isValid && isSubmitting}
        isInvalid={!!errors?.streetName}
      >
        <FormLabel>Street Name</FormLabel>
        <Controller
          name="streetName"
          control={control}
          defaultValue=""
          rules={streetNameValidationRules}
          render={({ field }) => (
            <Box marginBottom="1.5rem">
              <Input
                {...field}
                aria-label={`${schema.questionNumber}. Street Name`}
                placeholder="e.g. Bukit Batok Street 11"
              />
              <FormErrorMessage>{errors.streetName?.message}</FormErrorMessage>
            </Box>
          )}
        />
      </FormControl>
      <FormControl
        id={`${schema._id}-buildingName`}
        isRequired={false} // buildingName will always be optional
        isDisabled={schema.disabled}
        isReadOnly={isValid && isSubmitting}
        isInvalid={!!errors?.buildingName}
      >
        <FormLabel>Building Name</FormLabel>
        <Controller
          name="buildingName"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Box marginBottom="1.5rem">
              <Input
                {...field}
                aria-label={`${schema.questionNumber}. building Name`}
              />
            </Box>
          )}
        />
      </FormControl>
      <FormControl
        id={`${schema._id}-unitNumber`}
        isRequired={false} // unitNumber will always be optional
        isDisabled={schema.disabled}
        isReadOnly={isValid && isSubmitting}
        isInvalid={!!errors?.levelNumber || !!errors?.unitNumber}
      >
        <FormLabel>Unit Number</FormLabel>
        <Flex direction="row" gap={2} width="100%">
          <Controller
            name="levelNumber"
            control={control}
            defaultValue=""
            rules={unitLevelNumberValidationRules}
            render={({ field }) => (
              <Input
                {...field}
                aria-label={`${schema.questionNumber}. Level Number`}
                placeholder="Level Number"
              />
            )}
          />
          <Controller
            name="unitNumber"
            control={control}
            defaultValue=""
            rules={unitLevelNumberValidationRules}
            render={({ field }) => (
              <Input
                {...field}
                aria-label={`${schema.questionNumber}. Unit Number`}
                placeholder="Unit Number"
              />
            )}
          />
        </Flex>
        <FormErrorMessage>
          {errors.levelNumber?.message || errors.unitNumber?.message}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}
