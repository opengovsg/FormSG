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
  conjunctive: string
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
  thenBlock: {
    labels: {
      showFields: string
      preventSubmit: string
      then: string
      show: string
    }
    placeholders: {
      selectResultType: string
      inputCustomMessage: string
    }
    errors: {
      atLeastOneFieldRequired: string
      logicTypeRequired: string
      preventSubmitMessageRequired: string
      fieldsToShowRequired: string
    }
    deletedFieldsWarning: {
      showFields: string
      fieldsRemoved: string
    }
  }
  modals: {
    delete: {
      title: string
      description: string
      confirm: string
      cancel: string
    }
  }
  aria: {
    removeBlock: string
    criteria: string
    condition: string
  }
  errors: {
    conditionRequired: string
    fieldRequired: string
    fieldInvalid: string
    disabledSubmissionMessage: string
    missingLogicCriteria: string
    missingLogicType: string
  }
}
