import { memo } from 'react'
import { Text } from '@chakra-ui/react'

import { BasicField, FormFieldDto } from '~shared/types/field'
import { FormColorTheme } from '~shared/types/form'

import {
  AttachmentField,
  CheckboxField,
  DecimalField,
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

import {
  VerifiableMobileField,
  VerifiableMobileFieldSchema,
} from '~features/verifiable-fields/Mobile'

interface FieldFactoryProps {
  field: FormFieldDto
  colorTheme?: FormColorTheme
}

export const FieldFactory = memo(
  ({ field, colorTheme }: FieldFactoryProps) => {
    switch (field.fieldType) {
      case BasicField.Section:
        return <SectionField schema={field} colorTheme={colorTheme} />
      case BasicField.Checkbox:
        return <CheckboxField schema={field} colorTheme={colorTheme} />
      case BasicField.Radio:
        return <RadioField schema={field} colorTheme={colorTheme} />
      case BasicField.Nric:
        return <NricField schema={field} colorTheme={colorTheme} />
      case BasicField.Number:
        return <NumberField schema={field} colorTheme={colorTheme} />
      case BasicField.Decimal:
        return <DecimalField schema={field} colorTheme={colorTheme} />
      case BasicField.ShortText:
        return <ShortTextField schema={field} colorTheme={colorTheme} />
      case BasicField.LongText:
        return <LongTextField schema={field} colorTheme={colorTheme} />
      case BasicField.YesNo:
        return <YesNoField schema={field} colorTheme={colorTheme} />
      case BasicField.Uen:
        return <UenField schema={field} colorTheme={colorTheme} />
      case BasicField.Attachment:
        return <AttachmentField schema={field} colorTheme={colorTheme} />
      case BasicField.HomeNo:
        return <HomeNoField schema={field} colorTheme={colorTheme} />
      case BasicField.Mobile: {
        return field.isVerifiable ? (
          <VerifiableMobileField
            schema={field as VerifiableMobileFieldSchema}
            colorTheme={colorTheme}
          />
        ) : (
          <MobileField schema={field} colorTheme={colorTheme} />
        )
      }
      case BasicField.Statement:
        return <ParagraphField schema={field} colorTheme={colorTheme} />
      case BasicField.Rating:
        return <RatingField schema={field} colorTheme={colorTheme} />
      case BasicField.Email:
        return <EmailField schema={field} colorTheme={colorTheme} />
      case BasicField.Image:
        return <ImageField schema={field} colorTheme={colorTheme} />
      case BasicField.Table:
        return <TableField schema={field as TableFieldSchema} />
      default:
        return <Text w="100%">{JSON.stringify(field)}</Text>
    }
  },
  (prevProps, nextProps) => prevProps.field._id === nextProps.field._id,
)
