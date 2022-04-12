// Inputs to pass to react-hook-form for better type checking
export type FieldInput<Input> = {
  [schemaId: string]: Input
}

export type AttachmentFieldInput = FieldInput<File>
export type CheckboxFieldInputs = FieldInput<CheckboxFieldValues>
export type RadioFieldInputs = FieldInput<RadioFieldValues>
export type TableFieldInputs = FieldInput<TableFieldValues>
export type YesNoFieldInput = FieldInput<YesNoFieldValue>
export type SingleAnswerFieldInput = FieldInput<SingleAnswerValue>
export type VerifiableFieldInput = FieldInput<VerifiableFieldValues>

// Input values, what each field contains
export type SingleAnswerValue = string
export type MultiAnswerValue = string[]
export type YesNoFieldValue = 'yes' | 'no'
export type VerifiableFieldValues = {
  signature?: string
  value: string
}
export type CheckboxFieldValues = {
  value: string[]
  othersInput?: string
}
export type RadioFieldValues = {
  value: string
  othersInput?: string
}
export type TableFieldValues = {
  [columnId: string]: string
}[]
