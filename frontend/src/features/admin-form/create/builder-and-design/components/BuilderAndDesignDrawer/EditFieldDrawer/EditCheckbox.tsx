import { useEffect, useMemo, useState } from 'react'
import { Controller, RegisterOptions, useForm } from 'react-hook-form'
import { useDebounce } from 'react-use'
import {
  Box,
  Divider,
  FormControl,
  Stack,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { extend, isEmpty } from 'lodash'

import { CheckboxFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import NumberInput from '~components/NumberInput'
import { Tab } from '~components/Tabs'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'
import { CheckboxFieldSchema } from '~templates/Field/Checkbox/CheckboxField'

import { useEditFieldStore } from '../../../editFieldStore'
import { useMutateFormFields } from '../../../mutations'
import { isPendingFormField } from '../../../utils'

import { DrawerContentContainer } from './DrawerContentContainer'
import { FormFieldDrawerActions } from './FormFieldDrawerActions'

export interface EditCheckboxProps {
  field: CheckboxFieldSchema
}

interface EditCheckboxInputs
  extends Pick<
    CheckboxFieldBase,
    | 'title'
    | 'description'
    | 'required'
    | 'othersRadioButton'
    | 'validateByValue'
  > {
  fieldOptions: string
  ValidationOptions: {
    customMin?: number
    customMax?: number
  }
}

const transformCheckboxOpts = {
  toArray: (input?: string) =>
    input
      ?.split('\n')
      .map((opt) => opt.trim())
      .filter(Boolean) ?? [],
  toString: (output?: string[]) => output?.filter(Boolean).join('\n'),
}

const transformToFormField = ({
  fieldOptions,
  ValidationOptions,
  ...rest
}: EditCheckboxInputs): Partial<CheckboxFieldSchema> => {
  const nextValidationOptions = rest.validateByValue
    ? {
        customMin: ValidationOptions.customMin || null,
        customMax: ValidationOptions.customMax || null,
      }
    : { customMin: null, customMax: null }
  return {
    ...rest,
    ValidationOptions: nextValidationOptions,
    fieldOptions: transformCheckboxOpts.toArray(fieldOptions),
  }
}

const requiredValidationRule = createBaseValidationRules({ required: true })

const fieldOptionsValidationRule = {
  ...requiredValidationRule,
  validate: {
    duplicate: (opts: string) => {
      const optsArray = transformCheckboxOpts.toArray(opts)
      return (
        new Set(optsArray).size === optsArray.length ||
        'Please remove duplicate options.'
      )
    },
  },
}

export const EditCheckbox = ({ field }: EditCheckboxProps): JSX.Element => {
  const { updateActiveField, clearActiveField } = useEditFieldStore()

  const {
    handleSubmit,
    reset,
    register,
    control,
    getValues,
    watch,
    clearErrors,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EditCheckboxInputs>({
    defaultValues: {
      title: field.title,
      description: field.description,
      fieldOptions: transformCheckboxOpts.toString(field.fieldOptions),
      required: field.required,
      othersRadioButton: field.othersRadioButton,
      validateByValue: field.validateByValue,
      ValidationOptions: {
        customMin: field.ValidationOptions.customMin || undefined,
        customMax: field.ValidationOptions.customMax || undefined,
      },
    },
  })

  const watchedInputs = watch()

  useDebounce(
    () => {
      if (!watchedInputs) return
      return updateActiveField(transformToFormField(watchedInputs))
    },
    300,
    [
      transformCheckboxOpts,
      // Required destructure to prevent debounce firing infinitely.
      watchedInputs.description,
      watchedInputs.fieldOptions,
      watchedInputs.required,
      watchedInputs.title,
      watchedInputs.othersRadioButton,
      watchedInputs.validateByValue,
      watchedInputs.ValidationOptions.customMax,
      watchedInputs.ValidationOptions.customMin,
    ],
  )

  const { mutateFormField } = useMutateFormFields()

  const saveButtonText = useMemo(
    () => (isPendingFormField(field) ? 'Create' : 'Save'),
    [field],
  )

  const isSaveDisabled = useMemo(
    () => isDirty || isPendingFormField(field),
    [field, isDirty],
  )

  const handleUpdateField = handleSubmit((inputs) => {
    const updatedField = extend({}, field, transformToFormField(inputs))
    return mutateFormField.mutate(updatedField, {
      onSuccess: () => {
        reset(inputs)
      },
    })
  })

  const customMinValidationOptions: RegisterOptions = useMemo(
    () => ({
      required: {
        value:
          getValues('validateByValue') &&
          !getValues('ValidationOptions.customMax'),
        message: 'Please enter selection limits',
      },
      min: {
        value: 1,
        message: 'Cannot be less than 1',
      },
      validate: {
        minLargerThanMax: (val) => {
          return (
            !val ||
            !getValues('validateByValue') ||
            Number(val) <= Number(getValues('ValidationOptions.customMax')) ||
            'Minimum cannot be larger than maximum'
          )
        },
        max: (val) => {
          let numOptions = transformCheckboxOpts.toArray(
            getValues('fieldOptions'),
          ).length
          if (getValues('othersRadioButton')) {
            numOptions += 1
          }
          return (
            !val || val <= numOptions || 'Cannot be more than number of options'
          )
        },
      },
    }),
    [getValues],
  )

  const customMaxValidationOptions: RegisterOptions = useMemo(
    () => ({
      required: {
        value:
          getValues('validateByValue') &&
          !getValues('ValidationOptions.customMin'),
        message: 'Please enter selection limits',
      },
      min: {
        value: 1,
        message: 'Cannot be less than 1',
      },
      validate: {
        maxLargerThanMin: (val) => {
          return (
            !val ||
            !getValues('validateByValue') ||
            Number(val) >= Number(getValues('ValidationOptions.customMin')) ||
            'Maximum cannot be less than minimum'
          )
        },
        max: (val) => {
          if (!getValues('validateByValue')) return true
          let numOptions = transformCheckboxOpts.toArray(
            getValues('fieldOptions'),
          ).length
          if (getValues('othersRadioButton')) {
            numOptions += 1
          }
          return (
            !val || val <= numOptions || 'Cannot be more than number of options'
          )
        },
      },
    }),
    [getValues],
  )

  const [tabIndex, setTabIndex] = useState(0)

  // Effect to move to second tab to show error message.
  useEffect(() => {
    if (isSubmitting && tabIndex === 0 && !isEmpty(errors.ValidationOptions)) {
      setTabIndex(1)
    }
  }, [errors.ValidationOptions, isSubmitting, tabIndex])

  // Effect to clear validation option errors when selection limit is toggled off.
  useEffect(() => {
    if (!watchedInputs.validateByValue) {
      clearErrors('ValidationOptions')
    }
  }, [clearErrors, watchedInputs.validateByValue])

  return (
    <Tabs
      variant="line-light"
      display="flex"
      flexDir="column"
      flex={1}
      overflow="hidden"
      index={tabIndex}
      onChange={setTabIndex}
    >
      <Box
        px="1rem"
        pt="1.5rem"
        borderBottom="1px solid"
        borderBottomColor="neutral.300"
      >
        <TabList
          overflowX="initial"
          display="inline-flex"
          w="max-content"
          mb="-1px"
        >
          <Tab>General</Tab>
          <Tab>Options</Tab>
        </TabList>
      </Box>
      <DrawerContentContainer>
        <TabPanels mb="2rem">
          <TabPanel>
            <Stack spacing="2rem" divider={<Divider />}>
              <FormControl
                isRequired
                isReadOnly={mutateFormField.isLoading}
                isInvalid={!!errors.title}
              >
                <FormLabel>Question</FormLabel>
                <Input
                  autoFocus
                  {...register('title', requiredValidationRule)}
                />
                <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
              </FormControl>
              <FormControl
                isRequired
                isReadOnly={mutateFormField.isLoading}
                isInvalid={!!errors.description}
              >
                <FormLabel>Description</FormLabel>
                <Textarea {...register('description')} />
                <FormErrorMessage>
                  {errors?.description?.message}
                </FormErrorMessage>
              </FormControl>
              <FormControl
                isRequired
                isReadOnly={mutateFormField.isLoading}
                isInvalid={!!errors.fieldOptions}
              >
                <FormLabel>Options</FormLabel>
                <Textarea
                  {...register('fieldOptions', fieldOptionsValidationRule)}
                />
                <FormErrorMessage>
                  {errors?.fieldOptions?.message}
                </FormErrorMessage>
              </FormControl>
              <Toggle
                isLoading={mutateFormField.isLoading}
                label="Required"
                {...register('required')}
              />
            </Stack>
          </TabPanel>
          <TabPanel>
            <Stack spacing="2rem" divider={<Divider />}>
              <Toggle
                isLoading={mutateFormField.isLoading}
                label="Others"
                {...register('othersRadioButton')}
              />
              <Box>
                <Toggle
                  isLoading={mutateFormField.isLoading}
                  label="Selection limits"
                  {...register('validateByValue')}
                />
                <Text textStyle="body-2" color="secondary.400">
                  Customise the number of options that users are allowed to
                  select
                </Text>
                <FormControl
                  isDisabled={!watchedInputs.validateByValue}
                  isReadOnly={mutateFormField.isLoading}
                  isInvalid={!isEmpty(errors.ValidationOptions)}
                >
                  <Stack mt="0.5rem" direction="row" spacing="0.5rem">
                    <Controller
                      name="ValidationOptions.customMin"
                      control={control}
                      rules={customMinValidationOptions}
                      render={({ field }) => (
                        <NumberInput
                          flex={1}
                          showSteppers={false}
                          {...field}
                          placeholder="Minimum"
                        />
                      )}
                    />
                    <Controller
                      name="ValidationOptions.customMax"
                      control={control}
                      rules={customMaxValidationOptions}
                      render={({ field }) => (
                        <NumberInput
                          flex={1}
                          showSteppers={false}
                          {...field}
                          placeholder="Maximum"
                        />
                      )}
                    />
                  </Stack>
                  <FormErrorMessage>
                    {errors?.ValidationOptions?.customMin?.message ??
                      errors?.ValidationOptions?.customMax?.message}
                  </FormErrorMessage>
                </FormControl>
              </Box>
            </Stack>
          </TabPanel>
        </TabPanels>

        <FormFieldDrawerActions
          isLoading={mutateFormField.isLoading}
          isDirty={isSaveDisabled}
          buttonText={saveButtonText}
          handleClick={handleUpdateField}
          handleCancel={clearActiveField}
        />
      </DrawerContentContainer>
    </Tabs>
  )
}
