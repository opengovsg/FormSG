import { LogicConditionState } from '~shared/types'

import { Logic } from '.'

export const enSG: Logic = {
  title: 'Start creating logic for your form',
  and: 'and',
  saveChangesBtn: 'Save changes',
  helperText:
    'Show or hide fields depending on user input, or disable form submission for invalid answers.',
  helperTextCta: 'Learn to work with logic',
  allowedFields: 'Allowed fields',
  addLogicBtn: 'Add logic',
  logic: 'Logic',
  logicInstruction:
    'Please test your form thoroughly to ensure the logic works as expected.',
  logicClause: {
    addConditionCta: 'Add condition',
    cta: 'Add logic',
    if: 'if',
    is: 'is',
    then: 'then',
    show: 'show',
    selectField: 'Select a field',
    selectResultType: 'Select a type of result',
  },
  logicCondition: {
    [LogicConditionState.Equal]: LogicConditionState.Equal,
    [LogicConditionState.Lte]: LogicConditionState.Lte,
    [LogicConditionState.Gte]: LogicConditionState.Gte,
    [LogicConditionState.Either]: LogicConditionState.Either,
  },
  actionTypes: {
    showFields: 'Show field(s)',
    disableSubmission: 'Disable submission',
    disabledSubmissionMessagePlaceholder:
      'Custom message to be displayed when submission is prevented',
  },
  errors: {
    disabledSubmissionMessage:
      'Please enter a message to display when submission is prevented',
    missingLogicCriteria: 'Please enter logic criteria.',
    missingLogicType: 'Please select logic type',
  },
}
