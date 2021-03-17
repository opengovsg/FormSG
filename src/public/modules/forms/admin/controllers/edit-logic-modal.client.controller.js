'use strict'

const { range } = require('lodash')
const { LogicType } = require('../../../../../types')
const FormLogic = require('../../services/form-logic/form-logic.client.service')

angular
  .module('forms')
  .controller('EditLogicModalController', [
    '$uibModalInstance',
    'externalScope',
    'updateLogic',
    'FormFields',
    EditLogicModalController,
  ])

function EditLogicModalController(
  $uibModalInstance,
  externalScope,
  updateLogic,
  FormFields,
) {
  const vm = this

  // Copied to prevent changes in this scope to affect the external scope
  vm.myform = angular.copy(externalScope.myform)
  vm.logic = angular.copy(externalScope.currLogic)

  /**
   * The current logic being edited in the modal
   * @typedef {Object} Logic
   * @property {Condition[]} conditions - Array of Condition objects
   * @property {String[]} show - Array of field ids
   */

  /**
   * Each logic contains one or more conditions
   * @typedef {Object} Condition
   * @property {String} field - String that holds field id
   * @property {Object} fieldInfo - Object with properties (title, required etc.) of field
   * @property {Array} ifStates - Array of possible values for the states in the If block
   * @property {String} ifValueType - Field type that is being used as an If
   * @property {String} state - State field of condition
   * @property {String} value - Value field of condition
   */
  vm.formLogics = vm.myform.form_logics

  vm.getFieldTitle = FormFields.getFieldTitle

  vm.ifFields = FormLogic.getApplicableIfFields(vm.myform.form_fields)
  vm.thenFields = vm.myform.form_fields

  vm.logicTypeSelection = {
    showFields:
      !externalScope.isNew && vm.logic.logicType === LogicType.ShowFields,
    preventSubmit:
      !externalScope.isNew && vm.logic.logicType === LogicType.PreventSubmit,
  }

  vm.selectLogicType = (isShowFieldsSelected) => {
    vm.logicTypeSelection.showFields = isShowFieldsSelected
    vm.logicTypeSelection.preventSubmit = !isShowFieldsSelected
  }

  vm.clearLogicTypeSelection = () => {
    vm.logicTypeSelection.showFields = false
    vm.logicTypeSelection.preventSubmit = false
  }

  /**
   * Returns true if any form element in the Show field is missing from the Form
   * @param {Logic} logic
   */
  vm.checkIfMissingHiddenFields = function (logic) {
    if (logic.logicType === LogicType.PreventSubmit) {
      return false
    }
    return logic.show.some((showField) => !externalScope.getField(showField))
  }

  /**
   * Returns a list of options for the Show input of the Then section that are not already used in Field inputs of the If section
   * @param {Logic} logic
   */
  vm.subsetThenFields = function (logic) {
    const fieldsWithoutConditions = vm.thenFields.filter((field) => {
      for (let i = 0; i < logic.conditions.length; i++) {
        if (logic.conditions[i].field === field._id) {
          return false
        }
      }
      return true
    })
    return fieldsWithoutConditions
  }

  /**
   * Returns a list of options for the Field input of the If section that are not already in the Show input of the Then section
   * @param {Logic} logic
   */
  vm.subsetIfFields = function (logic) {
    // Logic unit preventing submission does not restrict if fields
    if (logic.logicType === LogicType.PreventSubmit) {
      return vm.ifFields
    }
    return vm.ifFields.filter((field) => !logic.show.includes(field._id))
  }

  vm.isIfStateDisabled = function (condition) {
    return condition.field === undefined
  }

  vm.isIfValueDisabled = function (condition) {
    return condition.state === undefined || condition.fieldInfo === undefined
  }

  vm.isDeleteConditionDisabled = function () {
    return vm.logic.conditions.length <= 1
  }

  /**
   * Initialise the state and value dropdown when editing an existing condition
   * @param {Condition} condition
   */
  vm.initCondition = function (condition) {
    condition.fieldInfo = externalScope.getField(condition.field)
    if (condition.fieldInfo) {
      vm.loadState(condition, false)

      if (condition.state) {
        vm.loadValue(condition, false)
      }
    }
  }

  /**
   * Loads the supported state based on the field type; reset=true when editing a new condition
   * @param {Condition} condition
   * @param {Boolean} reset - flag to reset or not
   */
  vm.loadState = function (condition, reset) {
    if (reset) {
      condition.state = undefined
      condition.value = undefined
      condition.ifValueType = 'number'
    }
    condition.fieldInfo = externalScope.getField(condition.field)
    if (condition.fieldInfo) {
      condition.ifStates = FormLogic.getApplicableIfStates(
        condition.fieldInfo.fieldType,
      )
    }
  }

  /**
   * Loads the possible values based on the field type (e.g. yes/no) and field values (e.g. dropdown options, rating steps)
   * @param {Condition} condition
   * @param {Boolean} reset - flag to reset or not
   */
  vm.loadValue = function (condition, reset) {
    if (reset) {
      condition.value = undefined
    }
    let field = condition.fieldInfo

    if (!field || !field.fieldType) {
      return
    }

    if (field.fieldType === 'dropdown' || field.fieldType === 'radiobutton') {
      condition.ifValues = field.fieldOptions

      if (field.fieldType === 'radiobutton' && field.othersRadioButton) {
        // prevent duplicate 'Others' option when reload or the question is with an existing 'Others' option
        if (condition.ifValues.indexOf('Others') === -1) {
          // prevent changing the original field options
          condition.ifValues = condition.ifValues.slice()
          condition.ifValues.push('Others')
        }
      }

      if (condition.state === 'is equals to') {
        condition.ifValueType = 'single-select'
      } else {
        condition.ifValueType = 'multi-select'
      }
    } else if (field.fieldType === 'rating') {
      condition.ifValues = range(1, field.ratingOptions.steps + 1)
      condition.ifValueType = 'single-select'
    } else if (field.fieldType === 'yes_no') {
      condition.ifValues = ['Yes', 'No']
      condition.ifValueType = 'single-select'
    } else {
      condition.ifValueType = 'number'
    }
  }

  // Helper functions for infinite scroll
  vm.infiniteScroll = {
    numToAdd: 3,
    initalItems: 30,
    currentItems: 30,
  }
  vm.filteredOptions = []

  /**
   * Filter options to show based on searchTerm
   * @param {String} searchTerm - String in the input field, used to search through all possible values
   * @param {Array} values - Possible values for the selected field
   */
  vm.filterOptions = function (searchTerm, values) {
    vm.filteredOptions = values.filter((option) => {
      return (
        option.toString().toLowerCase().indexOf(searchTerm.toLowerCase()) > -1
      )
    })
  }

  /**
   * Add more options to show as user scrolls
   */
  vm.addMoreItems = function () {
    vm.infiniteScroll.currentItems += vm.infiniteScroll.numToAdd
  }

  /**
   * Reset current items to show
   */
  vm.onDropdownOpenClose = function () {
    vm.filteredOptions = []
    vm.infiniteScroll.currentItems = vm.infiniteScroll.initalItems
  }

  vm.addCondition = function () {
    if (!vm.logic.conditions) {
      vm.logic.conditions = []
    }

    vm.logic.conditions.unshift(externalScope.getNewCondition())
  }

  vm.deleteCondition = function (condition) {
    for (let i = 0; i < vm.logic.conditions.length; i++) {
      if (vm.logic.conditions[i]._id === condition._id) {
        vm.logic.conditions.splice(i, 1)
        break
      }
    }
  }

  vm.save = function () {
    // Clear data of unselected logic type
    if (vm.logicTypeSelection.showFields) {
      vm.logic.logicType = LogicType.ShowFields
      delete vm.logic.preventSubmitMessage
    } else {
      vm.logic.logicType = LogicType.PreventSubmit
      delete vm.logic.show
    }

    // Decide whether to add to formLogics or replace current one
    const { isNew, logicIndex } = externalScope

    if (isNew) {
      vm.formLogics.push(vm.logic)
      // Not new, and logic index is provided
    } else if (logicIndex !== -1) {
      vm.formLogics[logicIndex] = vm.logic
    }

    updateLogic({ form_logics: vm.formLogics }).then((error) => {
      if (!error) {
        $uibModalInstance.close()
      }
    })
  }

  vm.cancel = function () {
    $uibModalInstance.close()
  }
}
