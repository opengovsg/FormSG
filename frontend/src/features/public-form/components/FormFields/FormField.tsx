import { BasicField, FormFieldDto } from '~shared/types/field'
import { FormColorTheme } from '~shared/types/form'

import {
  AttachmentField,
  CheckboxField,
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
  TableFieldSchema,
  UenField,
  YesNoField,
} from '~templates/Field'

interface FormFieldProps {
  field: FormFieldDto
  colorTheme?: FormColorTheme
}

export const FormField = ({ field, colorTheme }: FormFieldProps) => {
  switch (field.fieldType) {
    case BasicField.Date:
      return (
        <DateField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Section:
      return (
        <SectionField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Checkbox:
      return (
        <CheckboxField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Radio:
      return (
        <RadioField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Nric:
      return (
        <NricField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Number:
      return (
        <NumberField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Decimal:
      return (
        <DecimalField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.ShortText:
      return (
        <ShortTextField
          key={field._id}
          schema={field}
          colorTheme={colorTheme}
        />
      )
    case BasicField.LongText:
      return (
        <LongTextField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.YesNo:
      return (
        <YesNoField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Uen:
      return <UenField key={field._id} schema={field} colorTheme={colorTheme} />
    case BasicField.Attachment:
      return (
        <AttachmentField
          key={field._id}
          schema={field}
          colorTheme={colorTheme}
        />
      )
    case BasicField.HomeNo:
      return (
        <HomeNoField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Mobile:
      return (
        <MobileField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Statement:
      return (
        <ParagraphField
          key={field._id}
          schema={field}
          colorTheme={colorTheme}
        />
      )
    case BasicField.Rating:
      return (
        <RatingField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Email:
      return (
        <EmailField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Image:
      return (
        <ImageField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Dropdown:
      return (
        <DropdownField key={field._id} schema={field} colorTheme={colorTheme} />
      )
    case BasicField.Table:
      return <TableField key={field._id} schema={field as TableFieldSchema} />
  }
}
