import { useEffect, useState } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, Flex, FormControl, Stack } from '@chakra-ui/react'

import { validatePostalCode } from '~shared/utils/address-validation'

import {
  useBlockNumberValidationRules,
  useLevelNumberValidationRules,
  usePostalCodeValidationRules,
  useStreetNameValidationRules,
  useUnitNumberValidationRules,
} from '~utils/fieldValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { verifyAddress } from '../../../services/OneMapService'
import { BaseFieldProps } from '../FieldContainer'
import { AddressCompoundFieldInput, AddressCompoundFieldSchema } from '../types'

export interface AddressCompoundFieldProps extends BaseFieldProps {
  schema: AddressCompoundFieldSchema
  disableRequiredValidation?: boolean
}

export const AddressCompoundField = ({
  schema,
  disableRequiredValidation,
  isHighContrast,
}: AddressCompoundFieldProps): JSX.Element => {
  const formContext = useFormContext<AddressCompoundFieldInput>()
  const { getValues, setValue, trigger, setError, watch } = formContext
  const { isSubmitting, isValid, errors } =
    useFormState<AddressCompoundFieldInput>({
      name: schema._id,
    })
  const addressSubFieldErrors = errors?.[schema._id]?.addressSubFields

  const postalCodeValidationRules = usePostalCodeValidationRules(
    schema,
    disableRequiredValidation,
  )

  const blockNumberValidationRules = useBlockNumberValidationRules(
    schema,
    disableRequiredValidation,
  )

  const streetNameValidationRules = useStreetNameValidationRules(
    schema,
    disableRequiredValidation,
  )

  const { t } = useTranslation('translation', {
    keyPrefix: 'utils.fieldValidation',
  })

  const unitNumber = watch(`${schema._id}.addressSubFields.unitNumber`)
  const levelNumber = watch(`${schema._id}.addressSubFields.levelNumber`)

  const levelNumberValidationRules = useLevelNumberValidationRules(
    schema,
    getValues,
  )

  const unitNumberValidationRules = useUnitNumberValidationRules(
    schema,
    getValues,
  )

  useEffect(() => {
    if (unitNumber && levelNumber) {
      trigger(`${schema._id}.addressSubFields.levelNumber`)
      trigger(`${schema._id}.addressSubFields.unitNumber`)
    }
    if (!unitNumber && !levelNumber) {
      trigger(`${schema._id}.addressSubFields.levelNumber`)
      trigger(`${schema._id}.addressSubFields.unitNumber`)
    }
  }, [unitNumber, levelNumber, trigger, schema])

  const [isButtonDisabled, setIsButtonDisabled] = useState(schema.disabled)

  const handleVerifyAddress = async () => {
    setIsButtonDisabled(true)

    const postalCode = getValues(`${schema._id}.addressSubFields.postalCode`)

    if (validatePostalCode(postalCode) !== true) {
      await trigger(['postalCode'])
    } else {
      // Call the service to verify the address
      const result = await verifyAddress(postalCode)

      if (result.success && result.data) {
        setValue(
          `${schema._id}.addressSubFields.blockNumber`,
          result.data?.blockNumber,
        )
        setValue(
          `${schema._id}.addressSubFields.streetName`,
          result.data?.streetName,
        )
        await trigger([
          `${schema._id}.addressSubFields.blockNumber`,
          `${schema._id}.addressSubFields.streetName`,
        ]) // clear errors if first verification failed
      } else {
        if (!result.success) {
          setError(`${schema._id}.addressSubFields.blockNumber`, {
            type: 'manual',
            message: t('validPostalCodeNoAddress'),
          })
          setError(`${schema._id}.addressSubFields.streetName`, {
            type: 'manual',
            message: t('validPostalCodeNoAddress'),
          })
          setValue(`${schema._id}.addressSubFields.blockNumber`, '') // reset values if verification failure
          setValue(`${schema._id}.addressSubFields.streetName`, '')
          await trigger([`${schema._id}.addressSubFields.postalCode`]) // show postalCode error upon verification failure
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
        isHighContrast={isHighContrast}
      >
        {schema.title}
      </FormLabel>
      {/** Postal Code */}
      <FormControl
        isRequired={schema.required}
        isDisabled={schema.disabled}
        isReadOnly={isValid && isSubmitting}
        id={`${schema._id}-postalCode`}
        isInvalid={!!addressSubFieldErrors?.postalCode}
      >
        <FormLabel isRequired isHighContrast={isHighContrast}>
          Postal code
        </FormLabel>
        <Controller
          name={`${schema._id}.addressSubFields.postalCode`}
          control={formContext.control}
          defaultValue=""
          rules={postalCodeValidationRules}
          render={({ field }) => {
            return (
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
                    placeholder={schema.disabled ? undefined : "e.g. 650161"}
                    isHighContrast={isHighContrast}
                  />
                  <Button
                    onClick={handleVerifyAddress}
                    isLoading={isSubmitting}
                    isDisabled={isButtonDisabled}
                  >
                    Find address
                  </Button>
                </Flex>
                <FormErrorMessage>
                  {addressSubFieldErrors?.postalCode?.message}
                </FormErrorMessage>
              </Stack>
            )
          }}
        />
      </FormControl>
      {/** Block Number */}
      <FormControl
        isRequired={schema.required}
        isDisabled={schema.disabled}
        isReadOnly={isValid && isSubmitting}
        id={`${schema._id}-blockNumber`}
        isInvalid={!!addressSubFieldErrors?.blockNumber}
      >
        <FormLabel isRequired isHighContrast>
          Block number
        </FormLabel>
        <Controller
          name={`${schema._id}.addressSubFields.blockNumber`}
          control={formContext.control}
          defaultValue=""
          rules={blockNumberValidationRules}
          render={({ field }) => (
            <Stack direction="column" gap={0.5} marginBottom="1.5rem">
              <Input
                {...field}
                aria-label={`${schema.questionNumber}. Block Number`}
                placeholder={schema.disabled ? undefined : "e.g. 161"}
                isHighContrast={isHighContrast}
              />
              <FormErrorMessage>
                {addressSubFieldErrors?.blockNumber?.message}
              </FormErrorMessage>
            </Stack>
          )}
        />
      </FormControl>
      {/** Street Name */}
      <FormControl
        id={`${schema._id}-streetName`}
        isRequired={schema.required}
        isDisabled={schema.disabled}
        isReadOnly={isValid && isSubmitting}
        isInvalid={!!addressSubFieldErrors?.streetName}
      >
        <FormLabel isRequired isHighContrast={isHighContrast}>
          Street name
        </FormLabel>
        <Controller
          name={`${schema._id}.addressSubFields.streetName`}
          control={formContext.control}
          defaultValue=""
          rules={streetNameValidationRules}
          render={({ field }) => (
            <Box marginBottom="1.5rem">
              <Input
                {...field}
                aria-label={`${schema.questionNumber}. Street name`}
                placeholder={schema.disabled ? undefined : "e.g. Bukit Batok Street 11"}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  const value = e.currentTarget.value
                  e.currentTarget.value = value.replace(/,/g, '') // Prevent commas
                }}
                isHighContrast={isHighContrast}
              />
              <FormErrorMessage>
                {addressSubFieldErrors?.streetName?.message}
              </FormErrorMessage>
            </Box>
          )}
        />
      </FormControl>
      {/** Building name */}
      <FormControl
        id={`${schema._id}-buildingName`}
        isRequired={false} // buildingName will always be optional
        isDisabled={schema.disabled}
        isReadOnly={isValid && isSubmitting}
        isInvalid={!!addressSubFieldErrors?.buildingName}
      >
        <FormLabel isHighContrast={isHighContrast}>Building name</FormLabel>
        <Controller
          name={`${schema._id}.addressSubFields.buildingName`}
          control={formContext.control}
          defaultValue=""
          render={({ field }) => (
            <Box marginBottom="1.5rem">
              <Input
                {...field}
                aria-label={`${schema.questionNumber}. Building name`}
                isHighContrast={isHighContrast}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  const value = e.currentTarget.value
                  e.currentTarget.value = value.replace(/,/g, '') // Prevent commas in field input
                }}
              />
            </Box>
          )}
        />
      </FormControl>
      {/** Unit Number & Level Number */}
      <FormLabel isHighContrast={isHighContrast}>Unit number</FormLabel>
      <Flex direction="row" gap={2} width="100%">
        <FormControl
          id={`${schema._id}-levelNumber`}
          isRequired={false} // levelNumber will always be optional
          isDisabled={schema.disabled}
          isReadOnly={isValid && isSubmitting}
          isInvalid={!!addressSubFieldErrors?.levelNumber}
        >
          <Controller
            name={`${schema._id}.addressSubFields.levelNumber`}
            control={formContext.control}
            defaultValue=""
            rules={levelNumberValidationRules}
            render={({ field }) => (
              <Stack direction="column" gap={0.5}>
                <Input
                  {...field}
                  aria-label={`${schema.questionNumber}. Level number`}
                  placeholder={schema.disabled ? undefined : "Level number"}
                  isHighContrast={isHighContrast}
                />
                <FormErrorMessage>
                  {addressSubFieldErrors?.levelNumber?.message}
                </FormErrorMessage>
              </Stack>
            )}
          />
        </FormControl>
        <FormControl
          id={`${schema._id}-unitNumber`}
          isRequired={false} // unitNumber will always be optional
          isDisabled={schema.disabled}
          isReadOnly={isValid && isSubmitting}
          isInvalid={!!addressSubFieldErrors?.unitNumber}
        >
          <Controller
            name={`${schema._id}.addressSubFields.unitNumber`}
            control={formContext.control}
            defaultValue=""
            rules={unitNumberValidationRules}
            render={({ field }) => (
              <Stack direction="column" gap={0.5}>
                <Input
                  {...field}
                  aria-label={`${schema.questionNumber}. Unit Number`}
                  placeholder={schema.disabled ? undefined : "Unit number"}
                  isHighContrast={isHighContrast}
                />
                <FormErrorMessage>
                  {addressSubFieldErrors?.unitNumber?.message}
                </FormErrorMessage>
              </Stack>
            )}
          />
        </FormControl>
      </Flex>
    </Box>
  )
}
