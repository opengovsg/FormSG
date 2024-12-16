import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  FieldArrayWithId,
  FieldError,
  useFieldArray,
  UseFieldArrayRemove,
  useFormContext,
  UseFormReturn,
  useFormState,
} from 'react-hook-form'
import { BiPlus, BiTrash } from 'react-icons/bi'
import {
  Box,
  Divider,
  Flex,
  FormControl,
  HStack,
  Input as ChakraInput,
  Spacer,
  Text,
  VisuallyHidden,
  VStack,
} from '@chakra-ui/react'
import { get } from 'lodash'
import simplur from 'simplur'

import { DATE_DISPLAY_FORMAT } from '~shared/constants/dates'
import { MYINFO_ATTRIBUTE_MAP } from '~shared/constants/field/myinfo'
import {
  FormColorTheme,
  MyInfoAttribute,
  MyInfoChildAttributes,
  MyInfoChildData,
  MyInfoChildVaxxStatus,
} from '~shared/types'
import { formatMyinfoDate } from '~shared/utils/dates'

import { REQUIRED_ERROR } from '~constants/validation'
import { createChildrenValidationRules } from '~utils/fieldValidation'
import { Button } from '~components/Button/Button'
import { DatePicker } from '~components/DatePicker'
import { SingleSelect } from '~components/Dropdown/SingleSelect'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import { FormLabel } from '~components/FormControl/FormLabel/FormLabel'
import { IconButton } from '~components/IconButton/IconButton'

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

/**
 * Compound field for child information.
 * This is "compound" because it can contain multiple subfields.
 * The internal data representation is an array of arrays, where each
 * subarray contains strings that represent the subfield array inputs.
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
  const error: FieldError[][] | undefined = get(errors, schema._id)?.child
  const childError: FieldError[] | undefined = error ? error[0] : undefined

  const { fields, append, remove } = useFieldArray<ChildrenCompoundFieldInputs>(
    {
      control: formContext.control,
      name: `${schema._id}.child`,
    },
  )

  useEffect(() => {
    if (schema.childrenSubFields) {
      formContext.setValue(
        `${schema._id}.childFields`,
        schema.childrenSubFields,
      )
    }
  }, [schema.childrenSubFields, formContext, schema._id])

  // Initialize with a single child section
  useEffect(() => {
    if (!fields || !fields.length) {
      append([''], { shouldFocus: false })
    }
  }, [fields, append])

  const ariaChildrenDescription = useMemo(() => {
    let description = simplur`This is a children field. There [is|are] ${fields.length} child[|ren].`
    description += `Each child has multiple fields to fill.`
    description += `You can fill the child by selecting the child's name from the child name dropdown.`
    if (schema.allowMultiple) {
      description += ` You can add another child if you'd like by clicking the "Add another child" button below`
    }

    return description
  }, [fields.length, schema.allowMultiple])

  const numChild = fields.length ?? 0

  return (
    <FieldContainer
      schema={schema}
      {...fieldContainerProps}
      errorKey={childrenInputName}
    >
      <VisuallyHidden id={`children-desc-${schema._id}`}>
        {ariaChildrenDescription}
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
                  fields,
                  field,
                  colorTheme,
                  remove,
                  myInfoChildrenBirthRecords,
                  isSubmitting,
                  formContext,
                  error: childError,
                }}
              />
            ))}
          </VStack>
        </>
        {schema.allowMultiple ? (
          <HStack>
            <Button
              isDisabled={isSubmitting}
              alignSelf="start"
              leftIcon={<BiPlus />}
              aria-label="Add another child"
              onClick={() => {
                append([''])
              }}
            >
              Add another child
            </Button>
            <Spacer />
            <Text
              textStyle="body-2"
              color="secondary.400"
            >{simplur`${numChild} child[|ren] added`}</Text>
          </HStack>
        ) : null}
      </VStack>
    </FieldContainer>
  )
}

interface ChildrenBodyProps {
  currChildBodyIdx: number
  schema: ChildrenCompoundFieldSchema
  disableRequiredValidation?: boolean
  fields: FieldArrayWithId<
    ChildrenCompoundFieldInputs,
    `${string}.child`,
    'id'
  >[]
  field: FieldArrayWithId<ChildrenCompoundFieldInputs, `${string}.child`, 'id'>
  colorTheme: FormColorTheme
  remove: UseFieldArrayRemove
  myInfoChildrenBirthRecords?: MyInfoChildData
  isSubmitting: boolean

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formContext: UseFormReturn<ChildrenCompoundFieldInputs, any>
  error: FieldError[] | undefined
}

const CHILD_NAME_INDEX = 0

const ChildrenBody = ({
  currChildBodyIdx,
  schema,
  disableRequiredValidation,
  fields,
  field,
  colorTheme,
  remove,
  myInfoChildrenBirthRecords,
  isSubmitting,
  formContext,
  error,
}: ChildrenBodyProps): JSX.Element => {
  const { register, getValues, setValue, watch, control } = formContext

  const childNamePath = useMemo(
    () => `${schema._id}.child.${currChildBodyIdx}.0`,
    [schema._id, currChildBodyIdx],
  )

  const childrenValidationRules = useMemo(
    () => createChildrenValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const childName = watch(childNamePath) as unknown as string

  const allChildren = useMemo<string[]>(() => {
    if (myInfoChildrenBirthRecords === undefined) {
      return []
    }
    return myInfoChildrenBirthRecords[MyInfoAttribute.ChildName] ?? []
  }, [myInfoChildrenBirthRecords])

  // useCallback to re-compute names because for some reason watch doesn't
  // work on this nested field in react-hook-form.
  const allSelectedNames = useCallback((): string[] => {
    // Really important to note that sometimes react-hook-form stores our "array"
    // as a object with key=index and values=array entry.
    return Object.values(getValues(`${schema._id}.child`)).map((arr) => arr[0])
  }, [getValues, schema._id])

  // useCallback to re-compute names, again because of buggy allSelectedNames
  const namesNotSelected = useCallback((): string[] => {
    if (myInfoChildrenBirthRecords === undefined) {
      return []
    }
    const temp = new Set(allSelectedNames())
    // We want all child names that haven't already been selected.
    // O(n^2) but n is small so it should be okay.
    return allChildren.filter((name) => !temp.has(name))
  }, [myInfoChildrenBirthRecords, allChildren, allSelectedNames])

  const childNameValues = useMemo(() => {
    return [childName, ...namesNotSelected()].filter((name) => {
      if (name === '' || name === undefined) {
        return false
      } else return true
    })
  }, [childName, namesNotSelected])

  const indexOfChild: number = useMemo(() => {
    return (
      myInfoChildrenBirthRecords?.[MyInfoChildAttributes.ChildName]?.indexOf(
        childName,
      ) ?? -1
    )
  }, [myInfoChildrenBirthRecords, childName])

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
              isInvalid={!!error?.[CHILD_NAME_INDEX]}
            >
              <Controller
                control={control}
                name={childNamePath}
                rules={{
                  required: REQUIRED_ERROR,
                }}
                render={({
                  field: { value, onChange, onBlur, ref, ...rest },
                }) => (
                  <SingleSelect
                    {...rest}
                    placeholder={"Select your child's name"}
                    colorScheme={`theme-${colorTheme}`}
                    items={childNameValues}
                    value={value as unknown as string}
                    isDisabled={isSubmitting}
                    onChange={onChange}
                  />
                )}
              />
              <FormErrorMessage>
                {error?.[CHILD_NAME_INDEX]?.message}
              </FormErrorMessage>
            </FormControl>
          </Box>
          <IconButton
            variant="clear"
            colorScheme="danger"
            icon={<BiTrash />}
            aria-label="Remove child"
            alignSelf="end"
            isDisabled={fields.length <= 1}
            onClick={() => {
              if (fields.length > 1) {
                remove(fields.length - 1)
              }
            }}
          />
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
          const isDisabled = isSubmitting || !!myInfoValue
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
            case MyInfoChildAttributes.ChildSecondaryRace: {
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
      {/* No divider on last child */}
      {currChildBodyIdx < fields.length - 1 ? (
        <>
          <Spacer h="36px" />
          <Divider />
          <Spacer h="36px" />
        </>
      ) : null}
    </VStack>
  )
}
