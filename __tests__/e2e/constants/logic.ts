import { LogicConditionState, LogicType } from 'shared/types'

// Note: Fields are identified by index into the formFields array, i.e. question number - 1

interface E2eLogicConditionBase {
  field: number
  state: LogicConditionState
}

interface E2eLogicConditionSingle {
  state:
    | LogicConditionState.Equal
    | LogicConditionState.Lte
    | LogicConditionState.Gte
  value: string
}

interface E2eLogicConditionMulti {
  state: LogicConditionState.Either
  value: string[]
}

type E2eLogicCondition = E2eLogicConditionBase &
  (E2eLogicConditionSingle | E2eLogicConditionMulti)

type E2eLogicBase = {
  conditions: E2eLogicCondition[]
  logicType: LogicType
}

interface E2eShowFieldsLogic {
  logicType: LogicType.ShowFields
  show: number[]
}

interface E2ePreventSubmitLogic {
  logicType: LogicType.PreventSubmit
  message: string
}

export type E2eLogic = E2eLogicBase &
  (E2eShowFieldsLogic | E2ePreventSubmitLogic)

export const NO_LOGIC = []
