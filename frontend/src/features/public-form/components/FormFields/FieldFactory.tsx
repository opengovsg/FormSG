import { memo } from 'react'

import { BasicField } from '~shared/types/field'
import { FormColorTheme, FormResponseMode } from '~shared/types/form'

import {
  AttachmentField,
  CheckboxField,
  ChildrenCompoundField,
  CountryRegionField,
  DateField,
  DecimalField,
  DropdownField,
  EmailField,
  HomeNoField,
  ImageField,
  LongTextField,
  MobileField,
  NricField,
  NumberField,
  ParagraphField,
  RadioField,
  RatingField,
  SectionField,
  ShortTextField,
  TableField,
  UenField,
  YesNoField,
} from '~templates/Field'

import { FormFieldWithQuestionNo } from '~features/form/types'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'
import {
  VerifiableEmailField,
  VerifiableEmailFieldSchema,
} from '~features/verifiable-fields/Email'
import {
  VerifiableMobileField,
  VerifiableMobileFieldSchema,
} from '~features/verifiable-fields/Mobile'

import { PrefillMap } from './FormFields'

interface FieldFactoryProps {
  field: FormFieldWithQuestionNo
  disableRequiredValidation?: boolean
  prefill?: PrefillMap[string]
  colorTheme?: FormColorTheme
}

export const FieldFactory = memo(
  ({ field, ...rest }: FieldFactoryProps) => {
    const { myInfoChildrenBirthRecords, form, selectedPublicFormLanguage } =
      usePublicFormContext()
    switch (field.fieldType) {
      case BasicField.Section:
        return (
          <SectionField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Checkbox:
        return (
          <CheckboxField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Radio:
        return (
          <RadioField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Nric:
        return (
          <NricField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Number:
        return (
          <NumberField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Decimal:
        return (
          <DecimalField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.ShortText:
        return (
          <ShortTextField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.LongText:
        return (
          <LongTextField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.YesNo:
        return (
          <YesNoField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Dropdown:
        return (
          <DropdownField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.CountryRegion:
        return (
          <CountryRegionField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Date:
        return (
          <DateField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Uen:
        return (
          <UenField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Attachment: {
        const showDownload =
          form?.responseMode === FormResponseMode.Multirespondent
        return (
          <AttachmentField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
            showDownload={showDownload}
          />
        )
      }
      case BasicField.HomeNo:
        return (
          <HomeNoField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Mobile: {
        return field.isVerifiable ? (
          <VerifiableMobileField
            schema={field as VerifiableMobileFieldSchema}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        ) : (
          <MobileField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      }
      case BasicField.Statement:
        return (
          <ParagraphField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Rating:
        return (
          <RatingField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Email: {
        return field.isVerifiable ? (
          <VerifiableEmailField
            schema={field as VerifiableEmailFieldSchema}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        ) : (
          <EmailField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      }
      case BasicField.Image:
        return (
          <ImageField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Table:
        return (
          <TableField
            schema={field}
            selectedLanguage={selectedPublicFormLanguage}
            {...rest}
          />
        )
      case BasicField.Children:
        return (
          <ChildrenCompoundField
            schema={field}
            myInfoChildrenBirthRecords={myInfoChildrenBirthRecords}
            {...rest}
          />
        )
    }
  },
  (prevProps, nextProps) =>
    prevProps.field._id === nextProps.field._id &&
    prevProps.field.questionNumber === nextProps.field.questionNumber,
)
