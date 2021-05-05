'use strict'

const range = require('lodash/range')

angular.module('forms').component('tableFieldComponent', {
  templateUrl: 'modules/forms/base/componentViews/field-table.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
  },
  controller: ['$scope', tableFieldComponentController],
  controllerAs: 'vm',
})

function tableFieldComponentController($scope) {
  const vm = this

  $scope.$watch(
    () => vm.field.minimumRows,
    () => {
      vm.field.render()
    },
  )

  // Add new element to all fieldValue arrays and increment counter
  vm.addTableRow = function () {
    vm.field.addRow(true)
  }

  // Delete particular element from fieldValue arrays and decrement counter
  vm.deleteTableRow = function (index) {
    vm.field.deleteRow(index)
  }

  // Generate array of table row indexes for the purpose of rendering
  vm.generateTableRowIndexes = function () {
    return range(vm.getNumRows())
  }

  // We must add padding whenever a dropdown is open in the last two rows of
  // the table, otherwise the options in those dropdowns get hidden.
  vm.handleDropdownClick = function (fieldType, index) {
    // Flip end padding state if a dropdown in the last 2 rows are clicked
    if (fieldType === 'dropdown' && index >= vm.getNumRows() - 2) {
      vm.hasEndPadding = !vm.hasEndPadding
    }
  }

  // Show error is required columns are unfilled
  vm.isTableError = function () {
    const componentIds = vm.field.getComponentIds()
    return componentIds.some((rowIds) => {
      return rowIds.some((id) => {
        return (
          vm.forms.myForm[id] &&
          vm.forms.myForm[id].$touched &&
          vm.forms.myForm[id].$invalid
        )
      })
    })
  }

  vm.isLastRow = function (index) {
    return index === vm.getNumRows() - 1
  }

  vm.getNumRows = function () {
    return vm.field.minimumRows + vm.field.additionalRowCount
  }
}
