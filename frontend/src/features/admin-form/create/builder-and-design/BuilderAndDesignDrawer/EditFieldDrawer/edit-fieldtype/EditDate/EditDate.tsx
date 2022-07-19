import { useMemo } from 'react'
import { Controller, RegisterOptions } from 'react-hook-form'
import { Box, FormControl, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { isBefore, isDate, isEqual } from 'date-fns'
import { conformsTo, extend, get, isEmpty, pick } from 'lodash'

import {
  DateFieldBase,
  DateSelectedValidation,
  DateValidationOptions,
  RestrictParticularDaysOption,
} from '~shared/types/field'

import {
  transformDateToShortIsoString,
  transformShortIsoStringToDate,
} from '~utils/date'
import { createBaseValidationRules } from '~utils/fieldValidation'
import Checkbox from '~components/Checkbox'
import DateInput from '~components/DatePicker'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { DrawerContentContainer } from '../common/DrawerContentContainer'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

export interface DaysOptionType {
  title: string
  index: number
}

const PARTICULAR_DAYS_OPTIONS_LEFT: DaysOptionType[] = [
  { title: 'Monday', index: 0 },
  { title: 'Wednesday', index: 2 },
  { title: 'Friday', index: 4 },
  { title: 'Sunday', index: 6 },
]

const PARTICULAR_DAYS_OPTIONS_RIGHT: DaysOptionType[] = [
  { title: 'Tuesday', index: 1 },
  { title: 'Thursday', index: 3 },
  { title: 'Saturday', index: 5 },
  { title: 'Singapore Public Holidays', index: 7 },
]

type EditDateProps = EditFieldProps<DateFieldBase>

const EDIT_DATE_FIELD_KEYS = ['title', 'description', 'required'] as const

type EditDateInputs = Pick<
  DateFieldBase,
  typeof EDIT_DATE_FIELD_KEYS[number]
> & {
  dateValidation: {
    selectedDateValidation: DateSelectedValidation | ''
    customMaxDate: string
    customMinDate: string
  }
  restrictParticularDays: {
    addParticularDayRestriction: boolean
    invalidDaysOfTheWeek: number[]
  }
}

const transformDateFieldToEditForm = (field: DateFieldBase): EditDateInputs => {
  const nextValidationOptions = {
    selectedDateValidation:
      field.dateValidation.selectedDateValidation ?? ('' as const),
    customMaxDate: field.dateValidation.selectedDateValidation
      ? transformDateToShortIsoString(field.dateValidation.customMaxDate) ?? ''
      : ('' as const),
    customMinDate: field.dateValidation.selectedDateValidation
      ? transformDateToShortIsoString(field.dateValidation.customMinDate) ?? ''
      : ('' as const),
  }

  const nextParticularDayRestrictionOption = {
    addParticularDayRestriction:
      field.restrictParticularDays?.addParticularDayRestriction ?? false,
    invalidDaysOfTheWeek:
      field.restrictParticularDays?.invalidDaysOfTheWeek ?? [],
  }
  return {
    ...pick(field, EDIT_DATE_FIELD_KEYS),
    dateValidation: nextValidationOptions,
    restrictParticularDays: nextParticularDayRestrictionOption,
  }
}

const transformDateEditFormToField = (
  inputs: EditDateInputs,
  originalField: DateFieldBase,
): DateFieldBase => {
  let nextValidationOptions: DateValidationOptions
  let nextParticularDayRestrictionOption: RestrictParticularDaysOption

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
        customMinDate: transformShortIsoStringToDate(
          inputs.dateValidation.customMinDate,
        ),
        customMaxDate: transformShortIsoStringToDate(
          inputs.dateValidation.customMaxDate,
        ),
      }
    }
  }

  if (inputs.restrictParticularDays.addParticularDayRestriction) {
    nextParticularDayRestrictionOption = {
      addParticularDayRestriction:
        inputs.restrictParticularDays.addParticularDayRestriction,
      invalidDaysOfTheWeek: inputs.restrictParticularDays.invalidDaysOfTheWeek,
    }
  } else {
    nextParticularDayRestrictionOption = {
      addParticularDayRestriction:
        inputs.restrictParticularDays.addParticularDayRestriction,
      invalidDaysOfTheWeek: [],
    }
  }

  return extend({}, originalField, inputs, {
    dateValidation: nextValidationOptions,
    restrictParticularDays: nextParticularDayRestrictionOption,
  })
}

export const EditDate = ({ field }: EditDateProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    getValues,
    isSaveEnabled,
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

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  const customMinValidationOptions: RegisterOptions<
    EditDateInputs,
    'dateValidation.customMinDate'
  > = useMemo(
    () => ({
      // customMin is required if there is selected validation.
      validate: {
        hasValidation: (val) => {
          const hasMaxValue =
            getValues('dateValidation.selectedDateValidation') ===
              DateSelectedValidation.Custom &&
            !!getValues('dateValidation.customMaxDate')
          return !!val || hasMaxValue || 'You must specify at least one date.'
        },
        validDate: (val) =>
          !val || isDate(new Date(val)) || 'Please enter a valid date',
        inRange: (val) => {
          const date = new Date(val)
          const maxDate = new Date(getValues('dateValidation.customMaxDate'))
          return (
            isEqual(date, maxDate) ||
            isBefore(date, maxDate) ||
            'Max date cannot be less than min date.'
          )
        },
      },
    }),
    [getValues],
  )

  return (
    <DrawerContentContainer>
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
              <Controller
                control={control}
                name="dateValidation.customMinDate"
                rules={customMinValidationOptions}
                render={({ field }) => <DateInput {...field} />}
              />
              <Controller
                control={control}
                rules={{
                  deps: ['dateValidation.customMinDate'],
                }}
                name="dateValidation.customMaxDate"
                render={({ field }) => <DateInput {...field} />}
              />
            </>
          ) : null}
        </SimpleGrid>
        <FormErrorMessage>
          {get(errors, 'dateValidation.customMinDate.message')}
        </FormErrorMessage>
      </FormControl>
      <Stack>
        <FormControl isReadOnly={isLoading}>
          <Toggle
            {...register('restrictParticularDays.addParticularDayRestriction')}
            label="Customize days of the week"
          />
          <Text textStyle="body-2" color="secondary.400">
            Checking a day will disable all the same days in the calendar
          </Text>
        </FormControl>
        {getValues('restrictParticularDays.addParticularDayRestriction') ? (
          <FormControl isRequired isReadOnly={isLoading}>
            <Stack direction="row" spacing="0.75rem">
              <Stack direction="column">
                {PARTICULAR_DAYS_OPTIONS_LEFT.map((option) => {
                  return (
                    <Box width="9.25rem" key={option.index}>
                      <Controller
                        name="restrictParticularDays.invalidDaysOfTheWeek"
                        control={control}
                        key={option.index}
                        render={({ field: { onChange, value, ref } }) => {
                          return (
                            <Checkbox
                              onChange={() => {
                                const idx = value.indexOf(option.index)
                                value =
                                  idx > -1
                                    ? value.filter(
                                        (dayId) => dayId !== option.index,
                                      )
                                    : [...value, option.index]
                                onChange(value)
                              }}
                              ref={ref}
                              isChecked={value.includes(option.index)}
                            >
                              {option.title}
                            </Checkbox>
                          )
                        }}
                      />
                    </Box>
                  )
                })}
              </Stack>
              <Stack direction="column">
                {PARTICULAR_DAYS_OPTIONS_RIGHT.map((option) => {
                  return (
                    <Box key={option.index}>
                      <Controller
                        name="restrictParticularDays.invalidDaysOfTheWeek"
                        control={control}
                        key={option.index}
                        render={({ field: { onChange, value, ref } }) => {
                          return (
                            <Checkbox
                              onChange={() => {
                                const idx = value.indexOf(option.index)
                                value =
                                  idx > -1
                                    ? value.filter(
                                        (dayId) => dayId !== option.index,
                                      )
                                    : [...value, option.index]
                                onChange(value)
                              }}
                              ref={ref}
                              isChecked={value.includes(option.index)}
                            >
                              {option.title}
                            </Checkbox>
                          )
                        }}
                      />
                    </Box>
                  )
                })}
              </Stack>
            </Stack>
          </FormControl>
        ) : null}
      </Stack>

      <FormFieldDrawerActions
        isLoading={isLoading}
        isSaveEnabled={isSaveEnabled}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </DrawerContentContainer>
  )
}
