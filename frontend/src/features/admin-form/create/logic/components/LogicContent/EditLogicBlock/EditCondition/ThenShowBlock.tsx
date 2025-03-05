import { useEffect, useMemo, useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiShow, BiX } from 'react-icons/bi'
import { FormControl, Stack, Text } from '@chakra-ui/react'
import get from 'lodash/get'

import { FormFieldDto } from '~shared/types/field'
import { LogicType } from '~shared/types/form'

import { useWatchDependency } from '~hooks/useWatchDependency'
import { MultiSelect, SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import InlineMessage from '~components/InlineMessage'
import Textarea from '~components/Textarea'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { EditLogicInputs } from '~features/admin-form/create/logic/types'
import { FormFieldWithQuestionNo } from '~features/form/types'

import { getLogicFieldLabel } from '../../utils/getLogicFieldLabel'

import { BlockLabelText } from './BlockLabelText'

interface ThenShowBlockProps {
  isLoading: boolean
  formMethods: UseFormReturn<EditLogicInputs>
  formFields?: FormFieldDto[]
  idToFieldMap: Record<string, FormFieldWithQuestionNo> | null
}

export const ThenShowBlock = ({
  isLoading,
  formMethods,
  formFields,
  idToFieldMap,
}: ThenShowBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    watch,
    formState: { errors },
    setValue,
    resetField,
    setError,
    control,
    trigger,
  } = formMethods

  const logicTypeValue = watch('logicType')
  const logicTypeItems = [
    {
      label: t('features.adminForm.sidebar.logic.thenBlock.labels.showFields'),
      value: LogicType.ShowFields,
      icon: BiShow,
    },
    {
      label: t(
        'features.adminForm.sidebar.logic.thenBlock.labels.preventSubmit',
      ),
      value: LogicType.PreventSubmit,
      icon: BiX,
    },
  ]

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

  const [deletedFieldsCount, setDeletedFieldsCount] = useState(0)

  /**
   * Compute whether any/all fields in the show fields are deleted, then run
   * effect to delete fields on render and show appropriate error/infobox.
   * useWatch here to avoid infinite re-render (since if there are deleted
   * fields, we always reset the value of the show).
   */
  const showValueWatch = useWatchDependency(watch, 'show')

  useEffect(() => {
    if (
      logicTypeValue !== LogicType.ShowFields ||
      !showValueWatch.value?.length ||
      !idToFieldMap
    )
      return
    const filteredShowFields = showValueWatch.value.filter(
      (field) => field in idToFieldMap,
    )
    const deletedFieldsCount =
      showValueWatch.value.length - filteredShowFields.length
    if (deletedFieldsCount === 0) {
      trigger('show')
      return
    }
    setValue('show', filteredShowFields)
    if (filteredShowFields.length === 0)
      setError('show', {
        type: 'manual',
        message: t(
          'features.adminForm.sidebar.logic.thenBlock.errors.atLeastOneFieldRequired',
        ),
      })
    else setDeletedFieldsCount(deletedFieldsCount)
  }, [
    logicTypeValue,
    idToFieldMap,
    resetField,
    setError,
    setValue,
    showValueWatch.value,
    trigger,
    t,
  ])

  return (
    <Stack
      direction="column"
      spacing="0.75rem"
      py="1.5rem"
      px={{ base: '1.5rem', md: '2rem' }}
    >
      {deletedFieldsCount ? (
        <InlineMessage variant="info" p={0}>
          <Text>
            <strong>
              {t(
                'features.adminForm.sidebar.logic.thenBlock.deletedFieldsWarning.showFields',
                { deletedFieldsCount },
              )}
            </strong>{' '}
            {t(
              'features.adminForm.sidebar.logic.thenBlock.deletedFieldsWarning.fieldsRemoved',
              { deletedFieldsCount },
            )}
          </Text>
        </InlineMessage>
      ) : null}

      <Stack
        direction={{ base: 'column', md: 'row' }}
        spacing={{ base: 0, md: '0.5rem' }}
      >
        <BlockLabelText id="logicType-label" htmlFor="logicType">
          {t('features.adminForm.sidebar.logic.thenBlock.labels.then')}
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
              required: t(
                'features.adminForm.sidebar.logic.thenBlock.errors.logicTypeRequired',
              ),
            }}
            render={({ field }) => (
              <SingleSelect
                isDisabled={isLoading}
                isClearable={false}
                placeholder={t(
                  'features.adminForm.sidebar.logic.thenBlock.placeholders.selectResultType',
                )}
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
          {t('features.adminForm.sidebar.logic.thenBlock.labels.show')}
        </BlockLabelText>
        <ThenLogicInput
          formFields={formFields}
          idToFieldMap={idToFieldMap}
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
  idToFieldMap,
}: ThenShowBlockProps) => {
  const { t } = useTranslation()
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
      if (!formFields || !idToFieldMap) return []
      const usedFieldIds = new Set(
        logicConditionsWatch.value.map((condition) => condition.field),
      )
      return formFields
        .filter((f) => !usedFieldIds.has(f._id))
        .map((f) => ({
          value: f._id,
          label: getLogicFieldLabel(idToFieldMap[f._id]),
          icon: BASICFIELD_TO_DRAWER_META[f.fieldType].icon,
        }))
    }
    return []
    // Watch entire <***>Watch variables since <***>Watch.value is a Proxy object
    // and will not update if <***>Watch.value is mutated.
  }, [formFields, logicConditionsWatch, idToFieldMap, logicTypeValue])

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
              message: t(
                'features.adminForm.sidebar.logic.thenBlock.errors.preventSubmitMessageRequired',
              ),
            },
          })}
          placeholder={t(
            'features.adminForm.sidebar.logic.thenBlock.placeholders.inputCustomMessage',
          )}
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
      minW={0}
    >
      <Controller
        name="show"
        control={control}
        rules={{
          required: {
            value: !!getValues('logicType'),
            message: t(
              'features.adminForm.sidebar.logic.thenBlock.errors.fieldsToShowRequired',
            ),
          },
        }}
        render={({ field: { value, ...rest } }) => (
          <MultiSelect
            isDisabled={!logicTypeValue || isLoading}
            placeholder={null}
            items={thenValueItems}
            values={value ?? []}
            isSelectedItemFullWidth
            {...rest}
          />
        )}
      />
      <FormErrorMessage>{get(errors, 'show.message')}</FormErrorMessage>
    </FormControl>
  )
}
