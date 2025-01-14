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
    const { myInfoChildrenBirthRecords, form } = usePublicFormContext()
    switch (field.fieldType) {
      case BasicField.Section:
        return <SectionField schema={field} {...rest} />
      case BasicField.Checkbox:
        return <CheckboxField schema={field} {...rest} />
      case BasicField.Radio:
        return <RadioField schema={field} {...rest} />
      case BasicField.Nric:
        return <NricField schema={field} {...rest} />
      case BasicField.Number:
        return <NumberField schema={field} {...rest} />
      case BasicField.Decimal:
        return <DecimalField schema={field} {...rest} />
      case BasicField.ShortText:
        return <ShortTextField schema={field} {...rest} />
      case BasicField.LongText:
        return <LongTextField schema={field} {...rest} />
      case BasicField.YesNo:
        return <YesNoField schema={field} {...rest} />
      case BasicField.Dropdown:
        return <DropdownField schema={field} {...rest} />
      case BasicField.CountryRegion:
        return <CountryRegionField schema={field} {...rest} />
      case BasicField.Date:
        return <DateField schema={field} {...rest} />
      case BasicField.Uen:
        return <UenField schema={field} {...rest} />
      case BasicField.Attachment: {
        const showDownload =
          form?.responseMode === FormResponseMode.Multirespondent
        return (
          <AttachmentField
            schema={field}
            {...rest}
            showDownload={showDownload}
          />
        )
      }
      case BasicField.HomeNo:
        return <HomeNoField schema={field} {...rest} />
      case BasicField.Mobile: {
        return field.isVerifiable ? (
          <VerifiableMobileField
            schema={field as VerifiableMobileFieldSchema}
            {...rest}
          />
        ) : (
          <MobileField schema={field} {...rest} />
        )
      }
      case BasicField.Statement:
        return <ParagraphField schema={field} {...rest} />
      case BasicField.Rating:
        return <RatingField schema={field} {...rest} />
      case BasicField.Email: {
        return field.isVerifiable ? (
          <VerifiableEmailField
            schema={field as VerifiableEmailFieldSchema}
            {...rest}
          />
        ) : (
          <EmailField schema={field} {...rest} />
        )
      }
      case BasicField.Image:
        return <ImageField schema={field} {...rest} />
      case BasicField.Table:
        return <TableField schema={field} {...rest} />
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
