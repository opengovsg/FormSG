import { useMemo } from 'react'
import { Controller, RegisterOptions } from 'react-hook-form'
import {
  Box,
  CheckboxGroup,
  FormControl,
  SimpleGrid,
  Stack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { isBefore, isDate, isEqual } from 'date-fns'
import { extend, get, isEmpty, pick } from 'lodash'

import {
  DateFieldBase,
  DateSelectedValidation,
  DateValidationOptions,
  DaysOfTheWeek,
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

export interface InvalidDaysCheckboxOptions {
  label: string
  value: string
}

const INVALID_DAYS_CHECKBOX_VALUES: InvalidDaysCheckboxOptions[] = [
  { label: 'Monday', value: DaysOfTheWeek.Monday },
  { label: 'Tuesday', value: DaysOfTheWeek.Tuesday },
  { label: 'Wednesday', value: DaysOfTheWeek.Wednesday },
  { label: 'Thursday', value: DaysOfTheWeek.Thursday },
  { label: 'Friday', value: DaysOfTheWeek.Friday },
  { label: 'Saturday', value: DaysOfTheWeek.Saturday },
  { label: 'Sunday', value: DaysOfTheWeek.Sunday },
]

type EditDateProps = EditFieldProps<DateFieldBase>

const EDIT_DATE_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'invalidDaysOfTheWeek',
] as const

type EditDateInputs = Pick<
  DateFieldBase,
  typeof EDIT_DATE_FIELD_KEYS[number]
> & {
  dateValidation: {
    selectedDateValidation: DateSelectedValidation | ''
    customMaxDate: string
    customMinDate: string
  }
  addParticularDayRestriction: boolean
  invalidDaysOfTheWeek: NonNullable<DateFieldBase['invalidDaysOfTheWeek']>
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

  const nextAddParticularDayRestriction = field.invalidDaysOfTheWeek
    ? field.invalidDaysOfTheWeek.length > 0
    : false

  const nextInvalidDayOptions = field.invalidDaysOfTheWeek ?? []

  return {
    ...pick(field, EDIT_DATE_FIELD_KEYS),
    dateValidation: nextValidationOptions,
    addParticularDayRestriction: nextAddParticularDayRestriction,
    invalidDaysOfTheWeek: nextInvalidDayOptions,
  }
}

const transformDateEditFormToField = (
  inputs: EditDateInputs,
  originalField: DateFieldBase,
): DateFieldBase => {
  let nextValidationOptions: DateValidationOptions

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

  return extend({}, originalField, inputs, {
    dateValidation: nextValidationOptions,
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
  const invalidDaysOfTheWeek = getValues('invalidDaysOfTheWeek') ?? []
  console.log(invalidDaysOfTheWeek)

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
            {...register('addParticularDayRestriction')}
            label="Customize days of the week"
            description="Checking a day will disable all the same days in the calendar"
          />
        </FormControl>
        {getValues('addParticularDayRestriction') ? (
          <FormControl isRequired isReadOnly={isLoading}>
            <input
              type="checkbox"
              hidden
              value=""
              {...register('invalidDaysOfTheWeek')}
            />
            <Wrap>
              <Controller
                control={control}
                name="invalidDaysOfTheWeek"
                render={({ field: { ref, ...field } }) => {
                  return (
                    <CheckboxGroup {...field}>
                      {INVALID_DAYS_CHECKBOX_VALUES.map((invalidDayOption) => {
                        console.log(field.value)
                        return (
                          <Checkbox
                            key={invalidDayOption.value}
                            value={invalidDayOption.value}
                          >
                            {invalidDayOption.label}
                          </Checkbox>
                        )
                      })}
                    </CheckboxGroup>
                  )
                }}
              />
              {/* {INVALID_DAYS_CHECKBOX_VALUES.map((invalidDayOption) => {
                let width = '9.25rem'

                if (invalidDayOption.value % 2 === 0) {
                  width = '20rem'
                }

                return (
                  <WrapItem key={invalidDayOption.value} width={width}>
                    <Controller
                      control={control}
                      name="invalidDaysOfTheWeek"
                      render={({ field: { onChange, value, ref } }) => {
                        console.log(value)
                        return (
                          <Checkbox onChange={onChange}>
                            {invalidDayOption.label}
                          </Checkbox>
                        )
                      }}
                    />
                  </WrapItem>
                )
              })} */}
            </Wrap>
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
