import { useCallback, useEffect, useMemo } from 'react'
import {
  FieldArrayWithId,
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
import { format, parse } from 'date-fns'
import simplur from 'simplur'

import {
  ChildrenCompoundFieldInputs,
  ChildrenCompoundFieldSchema,
  DATE_DISPLAY_FORMAT,
  DATE_PARSE_FORMAT,
  MYINFO_DATE_FORMAT,
} from '~shared/constants/dates'
import { MYINFO_ATTRIBUTE_MAP } from '~shared/constants/field/myinfo'
import {
  FormColorTheme,
  MyInfoAttribute,
  MyInfoChildAttributes,
  MyInfoChildData,
  MyInfoChildVaxxStatus,
} from '~shared/types'

import { createChildrenValidationRules } from '~utils/fieldValidation'
import { Button } from '~components/Button/Button'
import { DatePicker } from '~components/DatePicker'
import { SingleSelect } from '~components/Dropdown/SingleSelect'
import { FormLabel } from '~components/FormControl/FormLabel/FormLabel'
import { IconButton } from '~components/IconButton/IconButton'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export interface ChildrenCompoundFieldProps extends BaseFieldProps {
  schema: ChildrenCompoundFieldSchema
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
  colorTheme = FormColorTheme.Blue,
  myInfoChildrenBirthRecords,
  ...fieldContainerProps
}: ChildrenCompoundFieldProps): JSX.Element => {
  const childrenInputName = useMemo(
    () => `${schema._id}` as const,
    [schema._id],
  )

  const formContext = useFormContext<ChildrenCompoundFieldInputs>()
  const { isSubmitting } = useFormState<ChildrenCompoundFieldInputs>({
    name: schema._id,
  })

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
      append([''])
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
                  fields,
                  field,
                  colorTheme,
                  remove,
                  myInfoChildrenBirthRecords,
                  isSubmitting,
                  formContext,
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
}

const ChildrenBody = ({
  currChildBodyIdx,
  schema,
  fields,
  field,
  colorTheme,
  remove,
  myInfoChildrenBirthRecords,
  isSubmitting,
  formContext,
}: ChildrenBodyProps): JSX.Element => {
  const { register, getValues, setValue, watch } = formContext

  const childNamePath = useMemo(
    () => `${schema._id}.child.${currChildBodyIdx}.0`,
    [schema._id, currChildBodyIdx],
  )

  const validationRules = useMemo(
    () => createChildrenValidationRules(schema),
    [schema],
  )

  const { onChange: selectOnChange, ...selectRest } = register(
    childNamePath,
    validationRules,
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
            <SingleSelect
              isRequired
              {...selectRest}
              placeholder={"Select your child's name"}
              colorScheme={`theme-${colorTheme}`}
              items={[childName, ...namesNotSelected()].filter((e) => e !== '')}
              value={childName}
              isDisabled={isSubmitting}
              initialIsOpen={!!myInfoChildrenBirthRecords?.childname}
              onChange={(name) => {
                // This is bad practice but we have no choice because our
                // custom Select doesn't forward the event.
                setValue(childNamePath, name)
              }}
            />
          </Box>
          <IconButton
            variant="clear"
            colorScheme="danger"
            icon={<BiTrash />}
            aria-label="Remove child"
            alignSelf="end"
            disabled={fields.length <= 1}
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
          let myInfoFormattedValue

          if (
            subField === MyInfoChildAttributes.ChildDateOfBirth &&
            myInfoValue
          ) {
            // We want to format the date by converting the value from a myinfo format to
            // a format used by our date fields
            myInfoFormattedValue = format(
              parse(myInfoValue, MYINFO_DATE_FORMAT, new Date()),
              DATE_PARSE_FORMAT,
            )
          } else {
            myInfoFormattedValue = myInfoValue
          }
          const value = watch(fieldPath) as unknown as string
          if (myInfoFormattedValue && value !== myInfoFormattedValue) {
            // We need to do this as the underlying data is not updated
            // by the field's value, but rather by onChange, which we did
            // not trigger via prefill.
            setValue(fieldPath, myInfoFormattedValue)
          }
          const isDisabled = isSubmitting || !!myInfoValue
          switch (subField) {
            case MyInfoChildAttributes.ChildBirthCertNo: {
              return (
                <FormControl key={key} isDisabled={isDisabled} isRequired>
                  <FormLabel useMarkdownForDescription gridArea="formlabel">
                    {MYINFO_ATTRIBUTE_MAP[subField].description}
                  </FormLabel>
                  <ChakraInput
                    {...register(fieldPath, validationRules)}
                    value={value}
                  />
                </FormControl>
              )
            }
            case MyInfoChildAttributes.ChildVaxxStatus:
            case MyInfoChildAttributes.ChildGender:
            case MyInfoChildAttributes.ChildRace:
            case MyInfoChildAttributes.ChildSecondaryRace: {
              return (
                <FormControl key={key} isDisabled={isDisabled} isRequired>
                  <FormLabel useMarkdownForDescription gridArea="formlabel">
                    {MYINFO_ATTRIBUTE_MAP[subField].description}
                  </FormLabel>
                  <SingleSelect
                    {...register(fieldPath, validationRules)}
                    value={value}
                    items={
                      MYINFO_ATTRIBUTE_MAP[subField].fieldOptions as string[]
                    }
                    onChange={(option) =>
                      // This is bad practice but we have no choice because our
                      // custom Select doesn't forward the event.
                      setValue(fieldPath, option)
                    }
                  />
                </FormControl>
              )
            }
            case MyInfoChildAttributes.ChildDateOfBirth: {
              const { onChange, ...rest } = register(fieldPath, validationRules)
              return (
                <FormControl key={key} isDisabled={isDisabled} isRequired>
                  <FormLabel useMarkdownForDescription gridArea="formlabel">
                    {MYINFO_ATTRIBUTE_MAP[subField].description}
                  </FormLabel>
                  <DatePicker
                    {...rest}
                    displayFormat={DATE_DISPLAY_FORMAT}
                    // dateFormat={DATE_PARSE_FORMAT}
                    // dateFormat="yyyy/MM/dd"
                    // Convert MyInfo YYYY-MM-DD to YYYY/MM/DD
                    // inputValue={value?.replaceAll('-', '/')}
                    inputValue={value}
                    onInputValueChange={(date) => {
                      setValue(fieldPath, date)
                    }}
                    colorScheme={`theme-${colorTheme}`}
                  />
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
