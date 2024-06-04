import { useMemo } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { UseTableCellProps } from 'react-table'
import { FormControl, VisuallyHidden } from '@chakra-ui/react'
import { get } from 'lodash'

import { FormColorTheme, Language } from '~shared/types'
import {
  BasicField,
  Column,
  ColumnDto,
  DropdownColumnBase,
  ShortTextColumnBase,
} from '~shared/types/field'

import { useIsMobile } from '~hooks/useIsMobile'
import { useIsPrint } from '~hooks/useIsPrint'
import {
  createBaseValidationRules,
  createDropdownValidationRules,
} from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { TableFieldInputs } from '../types'

export interface ColumnCellProps
  extends UseTableCellProps<TableFieldInputs, string> {
  schemaId: string
  isDisabled?: boolean
  disableRequiredValidation: boolean
  columnSchema: ColumnDto
  colorTheme: FormColorTheme
  selectedLanguage: Language
}

export interface FieldColumnCellProps<T extends Column = Column> {
  schema: ColumnDto<T>
  isDisabled?: boolean
  disableRequiredValidation: boolean
  /** Represents `{schemaId}.{rowIndex}.{columnId}` */
  inputName: `${string}.${number}.${string}`
  colorTheme: FormColorTheme
  selectedLanguage: Language
}

const ShortTextColumnCell = ({
  schema,
  isDisabled,
  disableRequiredValidation,
  inputName,
  colorTheme,
}: FieldColumnCellProps<ShortTextColumnBase>) => {
  const rules = useMemo(
    () => createBaseValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const { control } = useFormContext<TableFieldInputs>()

  return (
    <Controller
      control={control}
      name={inputName}
      rules={rules}
      render={({ field }) => (
        <Input
          isDisabled={isDisabled}
          colorScheme={`theme-${colorTheme}`}
          aria-labelledby={schema._id}
          {...field}
        />
      )}
    />
  )
}

const DropdownColumnCell = ({
  schema,
  isDisabled,
  disableRequiredValidation,
  inputName,
  colorTheme,
  selectedLanguage,
}: FieldColumnCellProps<DropdownColumnBase>) => {
  const { control } = useFormContext<TableFieldInputs>()
  const rules = useMemo(
    () => createDropdownValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  let fieldOptions = schema.fieldOptions ?? []
  const fieldOptionsTranslations = schema?.fieldOptionsTranslations ?? []
  const translationsIdx = fieldOptionsTranslations.findIndex(
    (translation) => translation.language === selectedLanguage,
  )

  if (translationsIdx !== -1) {
    fieldOptions = fieldOptionsTranslations[translationsIdx].translation
  }

  return (
    <Controller
      control={control}
      name={inputName}
      rules={rules}
      defaultValue=""
      render={({ field }) => (
        <SingleSelect
          isDisabled={isDisabled}
          colorScheme={`theme-${colorTheme}`}
          // Possibility of fieldOptions being undefined during table field creation.
          items={fieldOptions}
          {...field}
        />
      )}
    />
  )
}

/**
 * Renderer for each column cell in the table schema.
 */
export const ColumnCell = ({
  schemaId,
  isDisabled,
  disableRequiredValidation,
  row,
  column,
  columnSchema,
  colorTheme,
  selectedLanguage,
}: ColumnCellProps): JSX.Element => {
  const isMobile = useIsMobile()
  const isPrint = useIsPrint()
  const { errors } = useFormState<TableFieldInputs>({ name: schemaId })

  const inputName = useMemo(
    () => `${schemaId}.${row.index}.${column.id}` as const,
    [column.id, row.index, schemaId],
  )

  const renderedColumnCell = useMemo(() => {
    switch (columnSchema.columnType) {
      case BasicField.ShortText:
        return (
          <ShortTextColumnCell
            colorTheme={colorTheme}
            schema={columnSchema}
            isDisabled={isDisabled}
            disableRequiredValidation={disableRequiredValidation}
            inputName={inputName}
            selectedLanguage={selectedLanguage}
          />
        )
      case BasicField.Dropdown:
        return (
          <DropdownColumnCell
            colorTheme={colorTheme}
            schema={columnSchema}
            isDisabled={isDisabled}
            disableRequiredValidation={disableRequiredValidation}
            inputName={inputName}
            selectedLanguage={selectedLanguage}
          />
        )
      default:
        return null
    }
  }, [
    colorTheme,
    columnSchema,
    disableRequiredValidation,
    inputName,
    isDisabled,
    selectedLanguage,
  ])

  return (
    <FormControl
      id={inputName}
      isRequired={columnSchema.required}
      isInvalid={!!get(errors, inputName)}
    >
      <FormLabel
        // display column header in print and mobile modes
        as={isPrint || isMobile ? undefined : VisuallyHidden}
        color="secondary.700"
      >
        {columnSchema.title}
      </FormLabel>
      {renderedColumnCell}
      {
        // On desktop, errors are shown directly under the table field and should not
        // be shown in the individual column cells.
        isMobile ? (
          <FormErrorMessage>
            {get(errors, `${inputName}.message`)}
          </FormErrorMessage>
        ) : null
      }
    </FormControl>
  )
}
