import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  FieldArrayWithId,
  FieldError,
  useFieldArray,
  useFormContext,
  UseFormReturn,
  useFormState,
} from 'react-hook-form'
import {
  Box,
  Flex,
  FormControl,
  Input as ChakraInput,
  Spacer,
  VisuallyHidden,
  VStack,
} from '@chakra-ui/react'
import { get } from 'lodash'

import { DATE_DISPLAY_FORMAT } from 'formsg-shared/constants/dates'
import { MYINFO_ATTRIBUTE_MAP } from 'formsg-shared/constants/field/myinfo'
import {
  FormColorTheme,
  MyInfoChildAttributes,
  MyInfoChildData,
  MyInfoChildrenScope,
  MyInfoChildVaxxStatus,
} from 'formsg-shared/types'
import { formatMyinfoDate } from 'formsg-shared/utils/dates'

import { REQUIRED_ERROR } from '~constants/validation'
import { createChildrenValidationRules } from '~utils/fieldValidation'
import { DatePicker } from '~components/DatePicker'
import { SingleSelect } from '~components/Dropdown/SingleSelect'
import { ComboboxItem } from '~components/Dropdown/types'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import { FormLabel } from '~components/FormControl/FormLabel/FormLabel'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import {
  ChildrenCompoundFieldInputs,
  ChildrenCompoundFieldSchema,
} from '../types'

export interface ChildrenCompoundFieldProps extends BaseFieldProps {
  schema: ChildrenCompoundFieldSchema
  disableRequiredValidation?: boolean
  myInfoChildrenBirthRecords?: MyInfoChildData
}

const ARIA_CHILDREN_DESCRIPTION =
  `This is a children field. There is 1 child. ` +
  `Each child has multiple fields to fill. ` +
  `You can fill the child by selecting the child's name from the child name dropdown.`

/**
 * Compound field for child information.
 * This is "compound" because it can contain multiple subfields.
 * The internal data representation is an array of arrays, where each
 * subarray contains strings that represent the subfield array inputs. The outer
 * array holds one child, but stays an array so stored multi-child responses keep
 * their shape.
 *
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const ChildrenCompoundField = ({
  schema,
  disableRequiredValidation,
  colorTheme = FormColorTheme.Blue,
  myInfoChildrenBirthRecords,
  ...fieldContainerProps
}: ChildrenCompoundFieldProps): JSX.Element => {
  const childrenInputName = useMemo(
    () => `${schema._id}` as const,
    [schema._id],
  )

  const formContext = useFormContext<ChildrenCompoundFieldInputs>()
  const { isSubmitting, errors } = useFormState<ChildrenCompoundFieldInputs>({
    name: schema._id,
  })
  const error: FieldError[][] | undefined = get(errors, schema._id)?.child as
    | FieldError[][]
    | undefined
  const childError: FieldError[] | undefined = error ? error[0] : undefined

  const { fields, append } = useFieldArray<ChildrenCompoundFieldInputs>({
    control: formContext.control,
    name: `${schema._id}.child`,
  })

  useEffect(() => {
    if (schema.childrenSubFields) {
      formContext.setValue(
        `${schema._id}.childFields`,
        schema.childrenSubFields,
      )
    }
  }, [schema.childrenSubFields, formContext, schema._id])

  // Initialize with a single child section, even when disabled: on an MRF,
  // disabled just means "not editable in this step", and a field owned by a
  // later step must still render its (disabled, empty) subfields under the
  // title like every other field type does.
  useEffect(() => {
    if (!fields || !fields.length) {
      append([''], { shouldFocus: false })
    }
  }, [fields, append])

  return (
    <FieldContainer
      schema={schema}
      {...fieldContainerProps}
      errorKey={childrenInputName}
    >
      <VisuallyHidden id={`children-desc-${schema._id}`}>
        {ARIA_CHILDREN_DESCRIPTION}
      </VisuallyHidden>
      <VStack
        spacing={6}
        align="stretch"
        aria-describedby={`children-desc-${schema._id}`}
        aria-labelledby={`${schema._id}-label`}
      >
        <>
          <Spacer h="8px" />
          <VStack align="stretch" role="list">
            {fields.map((field, currChildBodyIdx) => (
              <ChildrenBody
                key={`body-${currChildBodyIdx}`}
                {...{
                  currChildBodyIdx,
                  schema,
                  disableRequiredValidation,
                  field,
                  colorTheme,
                  myInfoChildrenBirthRecords,
                  isSubmitting,
                  formContext,
                  error: childError,
                }}
              />
            ))}
          </VStack>
        </>
      </VStack>
    </FieldContainer>
  )
}

interface ChildrenBodyProps {
  currChildBodyIdx: number
  schema: ChildrenCompoundFieldSchema
  disableRequiredValidation?: boolean
  field: FieldArrayWithId<ChildrenCompoundFieldInputs, `${string}.child`, 'id'>
  colorTheme: FormColorTheme
  myInfoChildrenBirthRecords?: MyInfoChildData
  isSubmitting: boolean

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formContext: UseFormReturn<ChildrenCompoundFieldInputs, any>
  error: FieldError[] | undefined
}

const CHILD_NAME_INDEX = 0

// Dropdown values for MyInfo records carry a prefix so that they can never be
// mistaken for a child's name.
const RECORD_VALUE_PREFIX = 'record:'
const toRecordValue = (recordIdx: number) =>
  `${RECORD_VALUE_PREFIX}${recordIdx}`
const fromRecordValue = (value: string): number =>
  value.startsWith(RECORD_VALUE_PREFIX)
    ? Number(value.slice(RECORD_VALUE_PREFIX.length))
    : -1

const ChildrenBody = ({
  currChildBodyIdx,
  schema,
  disableRequiredValidation,
  field,
  colorTheme,
  myInfoChildrenBirthRecords,
  isSubmitting,
  formContext,
  error,
}: ChildrenBodyProps): JSX.Element => {
  const { register, setValue, watch, control } = formContext

  const childNamePath = useMemo(
    () => `${schema._id}.child.${currChildBodyIdx}.0`,
    [schema._id, currChildBodyIdx],
  )

  const childrenValidationRules = useMemo(
    () => createChildrenValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const recordIndexPath =
    `${schema._id}.childRecordIndices.${currChildBodyIdx}` as const
  const childTypePath = `${schema._id}.childTypes.${currChildBodyIdx}` as const

  const childName = watch(childNamePath) as unknown as string
  const pickedRecordIndex = watch(recordIndexPath) as unknown as
    | number
    | undefined

  const recordNames = useMemo<string[]>(
    () => myInfoChildrenBirthRecords?.[MyInfoChildAttributes.ChildName] ?? [],
    [myInfoChildrenBirthRecords],
  )

  // Scope a record was retrieved under, defaulting to local.
  const getRecordScope = useCallback(
    (recordIdx: number): MyInfoChildrenScope =>
      myInfoChildrenBirthRecords?.scopes?.[recordIdx] ??
      MyInfoChildrenScope.Local,
    [myInfoChildrenBirthRecords],
  )

  // The MyInfo record the selected child came from. Names are not unique, so
  // the record is identified by the position picked in the dropdown.
  const indexOfChild =
    pickedRecordIndex !== undefined &&
    recordNames[pickedRecordIndex] === childName
      ? pickedRecordIndex
      : -1

  // One item per record, so that same-named records stay distinct. Records
  // without a name are children above 21.
  const childNameItems = useMemo<ComboboxItem[]>(() => {
    const items: ComboboxItem[] = recordNames.flatMap((name, idx) =>
      name ? [{ value: toRecordValue(idx), label: name }] : [],
    )
    // A name with no record to point at (e.g. carried forward to a later MRF
    // step, which has no MyInfo data) is still shown as the selection.
    if (childName && indexOfChild < 0) items.push(childName)
    return items
  }, [recordNames, childName, indexOfChild])

  const onChildRecordChange = useCallback(
    (value: string, onChange: (name: string) => void) => {
      const recordIdx = fromRecordValue(value)
      const name = recordNames[recordIdx]
      if (name === undefined) {
        // Cleared, or re-selected a name that has no record.
        onChange(value)
        setValue(recordIndexPath, undefined)
        setValue(childTypePath, undefined)
        return
      }
      onChange(name)
      setValue(recordIndexPath, recordIdx)
      setValue(childTypePath, getRecordScope(recordIdx))
    },
    [recordNames, setValue, recordIndexPath, childTypePath, getRecordScope],
  )

  const getChildAttr = useCallback(
    (attr: MyInfoChildAttributes): string => {
      if (myInfoChildrenBirthRecords === undefined) {
        return ''
      }

      if (indexOfChild === undefined || indexOfChild < 0) {
        return ''
      }

      // We use the childname to check if the parent has a child above 21.
      // If the childname is an empty string, it represents a child above 21.
      // As our definition of child in FormSG means child below 21, we want to
      // return empty strings for other child attributes even if their value is populated by myinfo
      // if there is no childname.
      if (myInfoChildrenBirthRecords.childname?.[indexOfChild] === '') {
        return ''
      }

      const result = myInfoChildrenBirthRecords?.[attr]?.[indexOfChild]
      // Unknown basically means no result
      if (
        attr === MyInfoChildAttributes.ChildVaxxStatus &&
        result === MyInfoChildVaxxStatus.Unknown
      ) {
        return ''
      }
      return result ?? ''
    },
    [indexOfChild, myInfoChildrenBirthRecords],
  )
  return (
    <VStack
      aria-label={`${schema.questionNumber}-${schema.title}-child${currChildBodyIdx}`}
      role="list"
      spacing={4}
      align="stretch"
      key={field.id}
    >
      <VStack spacing={0} align="stretch">
        <FormLabel gridArea="formlabel">Child</FormLabel>
        <Flex align="stretch" alignItems="stretch" justify="space-between">
          <Box flexGrow={10}>
            <FormControl
              key={field.id}
              isRequired
              isDisabled={schema.disabled}
              isInvalid={!!error?.[CHILD_NAME_INDEX]}
            >
              <Controller
                control={control}
                name={childNamePath}
                rules={{
                  required: schema.disabled ? false : REQUIRED_ERROR,
                }}
                render={({
                  field: { value, onChange, onBlur, ref, ...rest },
                }) => (
                  <SingleSelect
                    {...rest}
                    placeholder={
                      schema.disabled ? undefined : "Select your child's name"
                    }
                    colorScheme={`theme-${colorTheme}`}
                    items={childNameItems}
                    value={
                      indexOfChild >= 0
                        ? toRecordValue(indexOfChild)
                        : ((value as unknown as string) ?? '')
                    }
                    isDisabled={isSubmitting || schema.disabled}
                    onChange={(selected) =>
                      onChildRecordChange(selected, onChange)
                    }
                  />
                )}
              />
              <FormErrorMessage>
                {error?.[CHILD_NAME_INDEX]?.message}
              </FormErrorMessage>
            </FormControl>
          </Box>
        </Flex>
      </VStack>
      {schema.childrenSubFields
        ?.filter((subField) => subField !== MyInfoChildAttributes.ChildName)
        .map((subField, index) => {
          // First index taken by name.
          index += 1
          const key = `${field.id}+${index}`
          const fieldPath = `${schema._id}.child.${currChildBodyIdx}.${index}`
          const myInfoValue = getChildAttr(subField)
          const childrenSubFieldError = error ? error[index] : undefined

          // We want to format the date by converting the value from a myinfo format to
          // a format used by our date fields
          const myInfoFormattedValue =
            subField === MyInfoChildAttributes.ChildDateOfBirth && myInfoValue
              ? formatMyinfoDate(myInfoValue)
              : myInfoValue

          const value = watch(fieldPath) as unknown as string
          if (myInfoFormattedValue && value !== myInfoFormattedValue) {
            // We need to do this as the underlying data is not updated
            // by the field's value, but rather by onChange, which we did
            // not trigger via prefill.
            // FIXME: Fix types
            // @ts-expect-error type inference issue
            setValue(fieldPath, myInfoFormattedValue, { shouldValidate: true })
          }
          // schema.disabled: whole-field read-only (MRF carry-forward on
          // steps 2+, where there is no MyInfo session to prefill from).
          // myInfoValue: individual subfield locked by MyInfo prefill.
          const isDisabled = isSubmitting || !!myInfoValue || schema.disabled
          switch (subField) {
            case MyInfoChildAttributes.ChildBirthCertNo: {
              return (
                <FormControl
                  key={key}
                  isDisabled={isDisabled}
                  isRequired
                  isInvalid={!!childrenSubFieldError}
                >
                  <FormLabel useMarkdownForDescription gridArea="formlabel">
                    {MYINFO_ATTRIBUTE_MAP[subField].description}
                  </FormLabel>
                  <ChakraInput
                    {...register(fieldPath, childrenValidationRules)}
                    value={value}
                  />
                  <FormErrorMessage>
                    {childrenSubFieldError?.message}
                  </FormErrorMessage>
                </FormControl>
              )
            }
            case MyInfoChildAttributes.ChildVaxxStatus:
            case MyInfoChildAttributes.ChildGender:
            case MyInfoChildAttributes.ChildRace:
            case MyInfoChildAttributes.ChildSecondaryRace:
            case MyInfoChildAttributes.ChildType: {
              return (
                <FormControl
                  key={key}
                  isDisabled={isDisabled}
                  isRequired
                  isInvalid={!!childrenSubFieldError}
                >
                  <FormLabel useMarkdownForDescription gridArea="formlabel">
                    {MYINFO_ATTRIBUTE_MAP[subField].description}
                  </FormLabel>
                  <Controller
                    control={control}
                    name={fieldPath}
                    rules={childrenValidationRules}
                    render={({
                      field: { value, onChange, onBlur, ...rest },
                    }) => (
                      <SingleSelect
                        {...rest}
                        value={value as unknown as string}
                        items={
                          MYINFO_ATTRIBUTE_MAP[subField]
                            .fieldOptions as string[]
                        }
                        onChange={onChange}
                      />
                    )}
                  />
                  <FormErrorMessage>
                    {childrenSubFieldError?.message}
                  </FormErrorMessage>
                </FormControl>
              )
            }
            case MyInfoChildAttributes.ChildDateOfBirth: {
              return (
                <FormControl
                  key={key}
                  isDisabled={isDisabled}
                  isRequired
                  isInvalid={!!childrenSubFieldError}
                >
                  <FormLabel useMarkdownForDescription gridArea="formlabel">
                    {MYINFO_ATTRIBUTE_MAP[subField].description}
                  </FormLabel>
                  <Controller
                    control={control}
                    name={fieldPath}
                    rules={childrenValidationRules}
                    render={({ field: { value, onChange, ...rest } }) => (
                      <DatePicker
                        {...rest}
                        displayFormat={DATE_DISPLAY_FORMAT}
                        inputValue={value as unknown as string}
                        onInputValueChange={onChange}
                        colorScheme={`theme-${colorTheme}`}
                      />
                    )}
                  />
                  <FormErrorMessage>
                    {childrenSubFieldError?.message}
                  </FormErrorMessage>
                </FormControl>
              )
            }
            default:
              return <div>Unsupported child subfield</div>
          }
        })}
    </VStack>
  )
}
