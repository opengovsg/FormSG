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
  conjunctive: 'AND',
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
  thenBlock: {
    labels: {
      showFields: 'Show field(s)',
      preventSubmit: 'Disable submission',
      then: 'Then',
      show: 'Show',
    },
    placeholders: {
      selectResultType: 'Select a type of result',
      inputCustomMessage:
        'Custom message to be displayed when submission is prevented',
    },
    errors: {
      atLeastOneFieldRequired:
        'All fields were deleted, please select at least one field',
      logicTypeRequired: 'Please select logic type.',
      preventSubmitMessageRequired:
        'Please enter a message to display when submission is prevented',
      fieldsToShowRequired:
        'Please select fields to show if logic criteria is met.',
    },
    deletedFieldsWarning: {
      showFields:
        '{deletedFieldsCount, plural, =1 {# Show field} other {# Show fields}}',
      fieldsRemoved:
        '{deletedFieldsCount, plural, =1 {# was deleted, and has} other {# were deleted, and have}} been removed from your logic',
    },
  },
  modals: {
    delete: {
      title: 'Delete logic',
      description:
        'Are you sure you want to delete this logic? This action cannot be undone.',
      confirm: 'Yes, delete logic',
      cancel: "No, don't delete",
    },
  },
  aria: {
    removeBlock: 'Remove logic condition block',
    criteria: 'Logic criteria',
    condition: 'Logic condition',
  },
  errors: {
    conditionRequired: 'Please select a condition',
    fieldRequired: 'Please select a field.',
    fieldInvalid: 'Field is invalid or unable to accept logic.',
    disabledSubmissionMessage:
      'Please enter a message to display when submission is prevented',
    missingLogicCriteria: 'Please enter logic criteria.',
    missingLogicType: 'Please select logic type',
  },
}
