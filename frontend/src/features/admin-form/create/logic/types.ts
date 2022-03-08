import { FormFieldDto } from '~shared/types/field'
import {
  FormCondition,
  FormLogic,
  FormLogicBase,
  PreventSubmitLogic,
  ShowFieldLogic,
} from '~shared/types/form'

export type FormFieldWithQuestionNumber = FormFieldDto & {
  questionNumber: number
}

export enum AdminEditLogicState {
  CreatingLogic,
  EditingLogic,
}

export type EditLogicInputs = FormLogic & {
  preventSubmitMessage?: PreventSubmitLogic['preventSubmitMessage']
  show?: ShowFieldLogic['show']
}
