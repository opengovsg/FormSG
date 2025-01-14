import { LogicConditionState } from '~shared/types'

export * from './en-sg'

export interface Logic {
  title: string
  and: string
  saveChangesBtn: string
  helperText: string
  helperTextCta: string
  allowedFields: string
  addLogicBtn: string
  logic: string
  logicInstruction: string
  logicClause: {
    addConditionCta: string
    cta: string
    if: string
    is: string
    then: string
    show: string
    selectField: string
    selectResultType: string
  }
  logicCondition: {
    [LogicConditionState.Equal]: string
    [LogicConditionState.Lte]: string
    [LogicConditionState.Gte]: string
    [LogicConditionState.Either]: string
  }
  actionTypes: {
    showFields: string
    disableSubmission: string
    disabledSubmissionMessagePlaceholder: string
  }
  errors: {
    disabledSubmissionMessage: string
    missingLogicCriteria: string
    missingLogicType: string
  }
}
