import { useMemo } from 'react'
import { Controller, RegisterOptions, useWatch } from 'react-hook-form'
import {
  Box,
  CheckboxGroup,
  FormControl,
  SimpleGrid,
  Stack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { isBefore, isEqual, isValid } from 'date-fns'
import { extend, get, isEmpty, pick } from 'lodash'

import {
  DateFieldBase,
  DateSelectedValidation,
  DateValidationOptions,
  InvalidDaysOptions,
} from '~shared/types/field'
import { hasAvailableDates } from '~shared/utils/date-validation'

import {
  fromUtcToLocalDate,
  getRemainingDaysOfTheWeek,
  isDateOutOfRange,
} from '~utils/date'
import { createBaseValidationRules } from '~utils/fieldValidation'
import Checkbox from '~components/Checkbox'
import { DatePicker } from '~components/DatePicker'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { useCreatePageSidebar } from '~features/admin-form/create/common'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

type EditDateProps = EditFieldProps<DateFieldBase>

const INVALID_DAYS_OPTIONS: InvalidDaysOptions[] = [
  InvalidDaysOptions.Monday,
  InvalidDaysOptions.Tuesday,
  InvalidDaysOptions.Wednesday,
  InvalidDaysOptions.Thursday,
  InvalidDaysOptions.Friday,
  InvalidDaysOptions.Saturday,
  InvalidDaysOptions.Sunday,
]

const EDIT_DATE_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'invalidDays',
] as const

const MIN_WIDTH_FOR_2_COL = 405

type EditDateInputs = Pick<
  DateFieldBase,
  typeof EDIT_DATE_FIELD_KEYS[number]
> & {
  dateValidation: {
    selectedDateValidation: DateSelectedValidation | ''
    customMaxDate: Date | null
    customMinDate: Date | null
  }
  addParticularDayRestriction: boolean
  invalidDays: NonNullable<DateFieldBase['invalidDays']>
}

const transformDateFieldToEditForm = (field: DateFieldBase): EditDateInputs => {
  const nextValidationOptions = {
    selectedDateValidation:
      field.dateValidation.selectedDateValidation ?? ('' as const),
    customMaxDate: field.dateValidation.selectedDateValidation
      ? field.dateValidation.customMaxDate ?? null
      : null,
    customMinDate: field.dateValidation.selectedDateValidation
      ? field.dateValidation.customMinDate ?? null
      : null,
  }

  const nextAddParticularDayRestriction = !!field?.invalidDays?.length

  /** Transformation is done because the invalid days array supplied from the server
   * to the checkbox group should be unchecked instead of checked. Hence instead of
   * supplying the invalid days array to the checkbox group, the valid days array
   * should be supplied to the checkbox group. Therefore transforming the invalid days
   * array into the valid days array.
   */
  const nextInvalidDayOptions = field.invalidDays
    ? getRemainingDaysOfTheWeek(field.invalidDays)
    : Object.values(InvalidDaysOptions)

  return {
    ...pick(field, EDIT_DATE_FIELD_KEYS),
    dateValidation: nextValidationOptions,
    addParticularDayRestriction: nextAddParticularDayRestriction,
    invalidDays: nextInvalidDayOptions,
  }
}

const transformDateEditFormToField = (
  inputs: EditDateInputs,
  originalField: DateFieldBase,
): DateFieldBase => {
  let nextValidationOptions: DateValidationOptions
  let nextInvalidDayOptions: InvalidDaysOptions[]

  switch (inputs.dateValidation.selectedDateValidation) {
    case '':
      nextValidationOptions = {
        selectedDateValidation: null,
        customMinDate: null,
        customMaxDate: null,
      }
      break
    case DateSelectedValidation.NoFuture:
    case DateSelectedValidation.NoPast:
      nextValidationOptions = {
        selectedDateValidation: inputs.dateValidation.selectedDateValidation,
        customMinDate: null,
        customMaxDate: null,
      }
      break
    case DateSelectedValidation.Custom: {
      nextValidationOptions = {
        selectedDateValidation: inputs.dateValidation.selectedDateValidation,
        customMinDate: inputs.dateValidation.customMinDate,
        customMaxDate: inputs.dateValidation.customMaxDate,
      }
    }
  }

  if (inputs.addParticularDayRestriction) {
    /** Transformation is done because the checked values in the checkbox group
     * are actually the valid days instead of the invalid days values that should
     * be sent over and stored on the server. Therefore the need to transform
     * the valid days array into invalid days array.
     */
    nextInvalidDayOptions = getRemainingDaysOfTheWeek(inputs.invalidDays)
  } else {
    nextInvalidDayOptions = []
  }

  return extend({}, originalField, inputs, {
    dateValidation: nextValidationOptions,
    invalidDays: nextInvalidDayOptions,
  })
}

export const EditDate = ({ field }: EditDateProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    getValues,
    control,
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditDateInputs, DateFieldBase>({
    field,
    transform: {
      input: transformDateFieldToEditForm,
      output: transformDateEditFormToField,
    },
  })

  const watchAddParticularDayRestriction = useWatch({
    control,
    name: 'addParticularDayRestriction',
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  const customMinValidationOptions: RegisterOptions<
    EditDateInputs,
    'dateValidation.customMinDate'
  > = useMemo(
    () => ({
      // either customMin or customMax is required if custom date range validation is selected.
      validate: {
        hasValidation: (val) => {
          const hasMaxValue =
            getValues('dateValidation.selectedDateValidation') ===
              DateSelectedValidation.Custom &&
            !!getValues('dateValidation.customMaxDate')
          return !!val || hasMaxValue || 'You must specify at least one date.'
        },
        validDate: (val) => !val || isValid(val) || 'Please enter a valid date',
        inRange: (val) => {
          const maxDate = getValues('dateValidation.customMaxDate')

          return (
            !maxDate || // Only min date
            !val || // Only max date
            isEqual(val, maxDate) ||
            isBefore(val, maxDate) ||
            'Max date cannot be less than min date.'
          )
        },
      },
      deps: 'invalidDays',
    }),
    [getValues],
  )

  const { drawerWidth } = useCreatePageSidebar()

  return (
    <CreatePageDrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>Question</FormLabel>
        <Input autoFocus {...register('title', requiredValidationRule)} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading} isInvalid={!!errors.description}>
        <FormLabel>Description</FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle {...register('required')} label="Required" />
      </FormControl>
      <FormControl
        isReadOnly={isLoading}
        isInvalid={!isEmpty(errors.dateValidation)}
      >
        <FormLabel isRequired>Date validation</FormLabel>
        <SimpleGrid mt="0.5rem" columns={2} spacing="0.5rem">
          <Box gridColumn="1/3">
            <Controller
              name="dateValidation.selectedDateValidation"
              rules={{
                deps: [
                  'dateValidation.customMinDate',
                  'dateValidation.customMaxDate',
                ],
              }}
              control={control}
              render={({ field }) => (
                <SingleSelect
                  items={Object.values(DateSelectedValidation)}
                  {...field}
                />
              )}
            />
          </Box>
          {getValues('dateValidation.selectedDateValidation') ===
          DateSelectedValidation.Custom ? (
            <>
              <Box
                gridColumn={
                  drawerWidth < MIN_WIDTH_FOR_2_COL ? '1/3' : undefined
                }
              >
                <Controller
                  control={control}
                  name="dateValidation.customMinDate"
                  rules={customMinValidationOptions}
                  render={({ field }) => <DatePicker {...field} />}
                />
              </Box>
              <Box
                gridColumn={
                  drawerWidth < MIN_WIDTH_FOR_2_COL ? '1/3' : undefined
                }
              >
                <Controller
                  control={control}
                  rules={{
                    deps: ['dateValidation.customMinDate', 'invalidDays'],
                  }}
                  name="dateValidation.customMaxDate"
                  render={({ field }) => (
                    <DatePicker
                      isDateUnavailable={(d) =>
                        isDateOutOfRange(
                          d,
                          fromUtcToLocalDate(
                            getValues('dateValidation.customMinDate'),
                          ),
                        )
                      }
                      {...field}
                    />
                  )}
                />
              </Box>
            </>
          ) : null}
        </SimpleGrid>
        <FormErrorMessage>
          {get(errors, 'dateValidation.customMinDate.message')}
        </FormErrorMessage>
      </FormControl>
      <Stack>
        <FormControl>
          <Toggle
            {...register('addParticularDayRestriction')}
            label="Custom availability during the week"
          />
        </FormControl>
        {watchAddParticularDayRestriction ? (
          <FormControl isRequired isInvalid={!!errors.invalidDays}>
            <Controller
              control={control}
              name="invalidDays"
              rules={{
                required: 'Please select available days of the week',
                validate: (val) => {
                  const customMinDate = getValues(
                    'dateValidation.customMinDate',
                  )
                  const customMaxDate = getValues(
                    'dateValidation.customMaxDate',
                  )
                  if (
                    !(
                      getValues('dateValidation.selectedDateValidation') ===
                        DateSelectedValidation.Custom &&
                      customMinDate &&
                      customMaxDate
                    )
                  ) {
                    return true
                  }

                  return (
                    hasAvailableDates(
                      customMinDate,
                      customMaxDate,
                      getRemainingDaysOfTheWeek(val),
                    ) ||
                    'There are no available days based on your date selection'
                  )
                },
              }}
              render={({ field: { ref, ...field } }) => (
                <CheckboxGroup
                  {...field}
                  defaultValue={Object.values(InvalidDaysOptions)}
                >
                  <Wrap spacing="0.75rem">
                    {INVALID_DAYS_OPTIONS.map((invalidDayOption, index) => (
                      <WrapItem
                        key={invalidDayOption}
                        minW="9.75rem"
                        maxW="21.25rem"
                      >
                        <Checkbox
                          key={invalidDayOption}
                          value={invalidDayOption}
                          ref={index === 0 ? ref : null}
                        >
                          {invalidDayOption}
                        </Checkbox>
                      </WrapItem>
                    ))}
                  </Wrap>
                </CheckboxGroup>
              )}
            />
            <FormErrorMessage>
              {get(errors, 'invalidDays.message')}
            </FormErrorMessage>
          </FormControl>
        ) : null}
      </Stack>
      <FormFieldDrawerActions
        isLoading={isLoading}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </CreatePageDrawerContentContainer>
  )
}
