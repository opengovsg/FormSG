import {
  FormLogic,
  PreventSubmitLogic,
  ShowFieldLogic,
} from '~shared/types/form'

export enum AdminEditLogicState {
  CreatingLogic,
  EditingLogic,
}

export type EditLogicInputs = FormLogic & {
  preventSubmitMessage?: PreventSubmitLogic['preventSubmitMessage']
  show?: ShowFieldLogic['show']
}
