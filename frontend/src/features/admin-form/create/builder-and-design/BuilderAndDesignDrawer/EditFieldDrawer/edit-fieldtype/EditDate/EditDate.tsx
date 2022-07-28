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
import { isBefore, isDate, isEqual } from 'date-fns'
import { extend, get, isEmpty, pick } from 'lodash'

import {
  DateFieldBase,
  DateSelectedValidation,
  DateValidationOptions,
  InvalidDaysOptions,
} from '~shared/types/field'

import {
  transformCheckedBoxesValueToInvalidDays,
  transformDateToShortIsoString,
  transformInvalidDaysToCheckedBoxesValue,
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

type EditDateProps = EditFieldProps<DateFieldBase>

const INVALID_DAYS_OPTIONS: InvalidDaysOptions[] = [
  InvalidDaysOptions.Monday,
  InvalidDaysOptions.Tuesday,
  InvalidDaysOptions.Wednesday,
  InvalidDaysOptions.Thursday,
  InvalidDaysOptions.Friday,
  InvalidDaysOptions.Saturday,
  InvalidDaysOptions.Sunday,
  InvalidDaysOptions.SingaporePublicHolidays,
]

const EDIT_DATE_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'invalidDays',
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
  invalidDays: NonNullable<DateFieldBase['invalidDays']>
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

  const nextAddParticularDayRestriction = !!field?.invalidDays?.length

  /** Transformation is done because the invalid days array supplied from the server
   * to the checkbox group should be unchecked instead of checked. Hence instead of
   * supplying the invalid days array to the checkbox group, the valid days array
   * should be supplied to the checkbox group. Therefore transforming the invalid days
   * array into the valid days array.
   */
  const nextInvalidDayOptions = field.invalidDays
    ? transformInvalidDaysToCheckedBoxesValue(field.invalidDays)
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
        customMinDate: transformShortIsoStringToDate(
          inputs.dateValidation.customMinDate,
        ),
        customMaxDate: transformShortIsoStringToDate(
          inputs.dateValidation.customMaxDate,
        ),
      }
    }
  }

  if (inputs.addParticularDayRestriction) {
    /** Transformation is done because the checked values in the checkbox group
     * are actually the valid days instead of the invalid days values that should
     * be sent over and stored on the server. Therefore the need to transform
     * the valid days array into invalid days array.
     */
    nextInvalidDayOptions = transformCheckedBoxesValueToInvalidDays(
      inputs.invalidDays,
    )
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

  const watchAddParticularDayRestriction = useWatch({
    control: control,
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
        <FormControl>
          <Toggle
            {...register('addParticularDayRestriction')}
            label="Customize days of the week"
            description="Checking a day will disable all the same days in the calendar"
          />
        </FormControl>
        {watchAddParticularDayRestriction ? (
          <FormControl isRequired isInvalid={!!errors.invalidDays}>
            <Controller
              control={control}
              name="invalidDays"
              rules={{
                validate: (val) => {
                  return !!val.length || 'Error placeholder'
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
        isSaveEnabled={isSaveEnabled}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </DrawerContentContainer>
  )
}
