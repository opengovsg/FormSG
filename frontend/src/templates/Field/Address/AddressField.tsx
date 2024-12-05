import { useMemo, useState } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { Box, Flex, FormControl, Stack } from '@chakra-ui/react'

import {
  VALID_POSTAL_CODE_NO_ADDRESS_ERROR,
  validatePostalCode,
} from '~shared/utils/address-validation'

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

import { verifyAddress } from '../../../../../src/app/services/address/address.service'
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

  const { getValues, setValue, control, trigger, setError } =
    useFormContext<AddressFieldInput>()

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

  const [isButtonDisabled, setIsButtonDisabled] = useState(false)

  const handleVerifyAddress = async () => {
    setIsButtonDisabled(true)

    const postalCode = getValues('postalCode')

    if (validatePostalCode(postalCode) !== true) {
      await trigger(['postalCode'])
    } else {
      // Call the service to verify the address
      const result = await verifyAddress(postalCode)
      if (result.success && result.data) {
        setValue('blockNumber', result.data?.blockNumber)
        setValue('streetName', result.data?.streetName)
        await trigger(['blockNumber', 'streetName']) // clear errors if first verification failed
      } else {
        if (!result.success) {
          setError('blockNumber', {
            type: 'manual',
            message: VALID_POSTAL_CODE_NO_ADDRESS_ERROR,
          })
          setError('streetName', {
            type: 'manual',
            message: VALID_POSTAL_CODE_NO_ADDRESS_ERROR,
          })
          setValue('blockNumber', '') // reset values if verification failure
          setValue('streetName', '')
          await trigger(['postalCode']) // show postalCode error upon verification failure
        }
      }
    }

    // disable verify address button to handle throttling
    setTimeout(() => {
      setIsButtonDisabled(false)
    }, 2000)
  }

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
        <FormLabel isRequired>Postal code</FormLabel>
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
                  placeholder="e.g. 650161"
                />
                <Button
                  onClick={handleVerifyAddress}
                  isLoading={isSubmitting}
                  isDisabled={isButtonDisabled}
                >
                  Verify address
                </Button>
              </Flex>
              <FormErrorMessage>{errors.postalCode?.message}</FormErrorMessage>
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
        <FormLabel isRequired>House/Block number</FormLabel>
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
        <FormLabel isRequired>Street name</FormLabel>
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
        <FormLabel>Building name</FormLabel>
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
        <FormLabel>Unit number</FormLabel>
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
                placeholder="Level number"
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
                placeholder="Unit number"
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
