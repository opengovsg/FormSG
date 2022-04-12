import { FormField, FormFieldDto } from '~shared/types/field'

/**
 * Partial question number, depends on field type. Some field types do not
 * require a question number
 */
export type FormFieldWithQuestionNo<T extends FormField = FormField> =
  FormFieldDto<T> & {
    questionNumber?: number
  }
