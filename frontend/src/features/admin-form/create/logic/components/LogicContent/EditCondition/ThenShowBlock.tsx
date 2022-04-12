import { useEffect, useMemo } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { BiShow, BiX } from 'react-icons/bi'
import { FormControl, Stack } from '@chakra-ui/react'
import get from 'lodash/get'

import { FormFieldDto } from '~shared/types/field'
import { LogicType } from '~shared/types/form'

import { useWatchDependency } from '~hooks/useWatchDependency'
import { MultiSelect, SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Textarea from '~components/Textarea'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { FormFieldWithQuestionNo } from '~features/form/types'

import { EditLogicInputs } from '../../../types'

import { BlockLabelText } from './BlockLabelText'

interface ThenShowBlockProps {
  isLoading: boolean
  formMethods: UseFormReturn<EditLogicInputs>
  formFields?: FormFieldDto[]
  mapIdToField: Record<string, FormFieldWithQuestionNo> | null
}

export const ThenShowBlock = ({
  isLoading,
  formMethods,
  formFields,
  mapIdToField,
}: ThenShowBlockProps): JSX.Element => {
  const {
    watch,
    formState: { errors },
    resetField,
    control,
  } = formMethods

  const logicTypeValue = watch('logicType')
  const logicTypeItems = useMemo(() => {
    return [
      {
        label: 'Show field(s)',
        value: LogicType.ShowFields,
        icon: BiShow,
      },
      {
        label: 'Disable submission',
        value: LogicType.PreventSubmit,
        icon: BiX,
      },
    ]
  }, [])

  /**
   * Effect to reset the logic values if the logic type is changed.
   */
  useEffect(() => {
    resetField('show')
    resetField('preventSubmitMessage')
  }, [resetField, logicTypeValue])

  // Label changes depending on logic type.
  const currentShowLabel = useMemo(() => {
    // Default to `show`
    return logicTypeValue === LogicType.PreventSubmit
      ? 'preventSubmitMessage'
      : 'show'
  }, [logicTypeValue])

  return (
    <Stack
      direction="column"
      spacing="0.75rem"
      py="1.5rem"
      px={{ base: '1.5rem', md: '2rem' }}
    >
      <Stack
        direction={{ base: 'column', md: 'row' }}
        spacing={{ base: 0, md: '0.5rem' }}
      >
        <BlockLabelText id="logicType-label" htmlFor="logicType">
          Then
        </BlockLabelText>
        <FormControl
          isReadOnly={isLoading}
          id="logicType"
          isRequired
          isInvalid={!!errors.logicType}
        >
          <Controller
            name="logicType"
            control={control}
            rules={{
              required: 'Please select logic type.',
            }}
            render={({ field }) => (
              <SingleSelect
                isDisabled={isLoading}
                isClearable={false}
                placeholder="Select a type of result"
                items={logicTypeItems}
                {...field}
              />
            )}
          />
          <FormErrorMessage>{errors.logicType?.message}</FormErrorMessage>
        </FormControl>
      </Stack>

      <Stack
        direction={{ base: 'column', md: 'row' }}
        spacing={{ base: 0, md: '0.5rem' }}
      >
        <BlockLabelText
          id={`${currentShowLabel}-label`}
          htmlFor={currentShowLabel}
        >
          Show
        </BlockLabelText>
        <ThenLogicInput
          formFields={formFields}
          mapIdToField={mapIdToField}
          formMethods={formMethods}
          isLoading={isLoading}
        />
      </Stack>
    </Stack>
  )
}

const ThenLogicInput = ({
  isLoading,
  formMethods,
  formFields,
  mapIdToField,
}: ThenShowBlockProps) => {
  const {
    watch,
    control,
    register,
    getValues,
    formState: { errors },
  } = formMethods

  const logicTypeValue = watch('logicType')
  const logicConditionsWatch = useWatchDependency(watch, 'conditions')

  const thenValueItems = useMemo(() => {
    // Return every field except fields that are already used in the logic.
    if (logicTypeValue === LogicType.ShowFields) {
      const usedFieldIds = new Set(
        logicConditionsWatch.value.map((condition) => condition.field),
      )
      if (!formFields || !mapIdToField) return []
      return formFields
        .filter((f) => !usedFieldIds.has(f._id))
        .map((f) => {
          const mappedField = mapIdToField[f._id]
          return {
            value: f._id,
            label: `${mappedField.questionNumber}. ${mappedField.title}`,
            icon: BASICFIELD_TO_DRAWER_META[f.fieldType].icon,
          }
        })
    }
    return []
    // Watch entire <***>Watch variables since <***>Watch.value is a Proxy object
    // and will not update if <***>Watch.value is mutated.
  }, [formFields, logicConditionsWatch, mapIdToField, logicTypeValue])

  if (logicTypeValue === LogicType.PreventSubmit) {
    return (
      <FormControl
        id="preventSubmitMessage"
        isReadOnly={isLoading}
        isRequired
        isInvalid={!!errors.preventSubmitMessage}
      >
        <Textarea
          {...register('preventSubmitMessage', {
            required: {
              value: !!getValues('logicType'),
              message:
                'Please enter a message to display when submission is prevented',
            },
          })}
          placeholder="Custom message to be displayed when submission is prevented"
        />
        <FormErrorMessage>
          {errors.preventSubmitMessage?.message}
        </FormErrorMessage>
      </FormControl>
    )
  }

  return (
    <FormControl
      id="show"
      isReadOnly={isLoading}
      isRequired
      isInvalid={!!errors.show}
    >
      <Controller
        name="show"
        control={control}
        rules={{
          required: {
            value: !!getValues('logicType'),
            message: 'Please select fields to show if logic criteria is met.',
          },
        }}
        render={({ field: { value, ...rest } }) => (
          <MultiSelect
            isDisabled={!logicTypeValue || isLoading}
            placeholder={null}
            items={thenValueItems}
            values={value ?? []}
            {...rest}
          />
        )}
      />
      <FormErrorMessage>{get(errors, 'show.message')}</FormErrorMessage>
    </FormControl>
  )
}
