import { FormFieldDto } from '~shared/types/field'

export type FormFieldWithQuestionNumber = FormFieldDto & {
  questionNumber: number
}

export enum AdminEditLogicState {
  CreatingLogic,
  EditingLogic,
}
