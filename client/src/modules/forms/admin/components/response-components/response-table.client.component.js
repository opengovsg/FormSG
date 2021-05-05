const { TableField } = require('../../../viewmodels/Fields')
const get = require('lodash/get')

angular.module('forms').component('responseTableComponent', {
  templateUrl:
    'modules/forms/admin/componentViews/response-views/response-table.client.view.html',
  bindings: {
    field: '<',
  },
  controllerAs: 'vm',
  controller: ['$timeout', responseTableComponentController],
})

function responseTableComponentController($timeout) {
  const vm = this

  vm.$onInit = () => {
    vm.tableField = getDisplayedTable(vm.field)
  }

  // Construct a locked TableField full of textfields so we can reuse the
  // table component to render the results
  const getDisplayedTable = (field) => {
    const numCols = get(field, 'answerArray[0].length')
    const columns = []
    for (let i = 0; i < numCols; i++) {
      columns.push({
        columnType: 'textfield',
        _id: `columnId${i}`,
        required: true,
      })
    }
    const tableData = {
      fieldType: 'table',
      columns,
      minimumRows: field.answerArray.length,
    }
    const tableField = new TableField(tableData)
    // Use $timeout to trigger digest cycle
    $timeout(() => {
      tableField.lock()
      // Manually modify TableField state to reflect field values
      field.answerArray.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          tableField.components[rowIndex][colIndex].fieldValue = value
        })
      })
    })
    return tableField
  }
}
