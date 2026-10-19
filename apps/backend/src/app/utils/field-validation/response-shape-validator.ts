import { BasicField } from 'formsg-shared/types'
import { left, right } from 'fp-ts/lib/Either'
import { z } from 'zod'

import { ParsedClearFormFieldResponseV4 } from '../../../types/api/submission'
import { ResponseValidator } from '../../../types/field/utils/validation'

const stringAnswer = z.object({ value: z.string() })
const verifiableAnswer = stringAnswer.extend({
  signature: z.string().optional(),
})

// Validate structure only. Empty answers and field-specific constraints are
// handled by visibility, required-field, and individual field validators.
const answerSchemas = {
  [BasicField.Section]: stringAnswer,
  [BasicField.Number]: stringAnswer,
  [BasicField.Decimal]: stringAnswer,
  [BasicField.ShortText]: stringAnswer,
  [BasicField.LongText]: stringAnswer,
  [BasicField.HomeNo]: stringAnswer,
  [BasicField.Dropdown]: stringAnswer,
  [BasicField.Rating]: stringAnswer,
  [BasicField.Nric]: stringAnswer,
  [BasicField.Uen]: stringAnswer,
  [BasicField.Date]: stringAnswer,
  [BasicField.CountryRegion]: stringAnswer,
  [BasicField.YesNo]: stringAnswer,
  [BasicField.Email]: verifiableAnswer,
  [BasicField.Mobile]: verifiableAnswer,
  [BasicField.Radio]: stringAnswer.extend({ isOthersInput: z.boolean() }),
  [BasicField.Checkbox]: z.object({
    value: z.array(z.string()),
    othersInput: z.string().optional(),
  }),
  [BasicField.Attachment]: stringAnswer.extend({
    hasBeenScanned: z.boolean(),
    md5Hash: z.string().optional(),
    filename: z.string().optional(),
    content: z.instanceof(Buffer).optional(),
  }),
  [BasicField.Table]: z.record(
    z.object({
      rowNum: z.number(),
      value: z.record(z.union([z.string(), z.number()])),
    }),
  ),
  [BasicField.Children]: z.record(
    z.object({
      value: z.record(
        stringAnswer.extend({
          myInfo: z.object({ attr: z.string() }).optional(),
        }),
      ),
      type: z.string().optional(),
    }),
  ),
  [BasicField.Address]: z
    .object({
      postalCode: stringAnswer,
      blockNumber: stringAnswer,
      streetName: stringAnswer,
      buildingName: stringAnswer,
      levelNumber: stringAnswer,
      unitNumber: stringAnswer,
    })
    .catchall(stringAnswer),
  [BasicField.Signature]: z.object({
    value: z.array(z.array(z.tuple([z.number(), z.number(), z.number()]))),
    type: z.literal('draw'),
  }),
  [BasicField.Image]: z.never(),
  [BasicField.Statement]: z.never(),
} satisfies Record<BasicField, z.ZodType<unknown>>

export const validateResponseShapeV4: ResponseValidator<
  ParsedClearFormFieldResponseV4
> = (response) => {
  const result = answerSchemas[response.fieldType].safeParse(response.answer)
  return result.success
    ? right(response)
    : left(`Invalid answer shape for field type ${response.fieldType}`)
}
