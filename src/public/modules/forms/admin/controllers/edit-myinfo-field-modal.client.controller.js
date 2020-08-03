'use strict'

const { EditFieldActions } = require('shared/constants')

angular
  .module('forms')
  .controller('EditMyInfoFieldController', [
    '$uibModalInstance',
    'externalScope',
    'updateField',
    EditMyInfoFieldController,
  ])

function EditMyInfoFieldController(
  $uibModalInstance,
  externalScope,
  updateField,
) {
  const vm = this
  vm.field = externalScope.currField
  vm.myform = externalScope.myform

  // Whether field is being used for logic fields
  vm.isConditionField = externalScope.isConditionField

  // Whether field is verified for Singaporeans/PR/Foreigners
  vm.verifiedForSG = externalScope.currField.myInfo.verified.includes('SG')
  vm.verifiedForPR = externalScope.currField.myInfo.verified.includes('PR')
  vm.verifiedForF = externalScope.currField.myInfo.verified.includes('F')

  vm.saveMyInfoField = function () {
    // TODO: Separate code flow for create and update, ideally calling PUT and PATCH endpoints
    const editFormField =
      externalScope.currField.globalId === undefined
        ? // Create a new field
          {
            action: {
              name: EditFieldActions.Create,
            },
            field: externalScope.currField,
          }
        : // Edit existing field
          {
            action: {
              name: EditFieldActions.Update,
            },
            field: externalScope.currField,
          }

    updateField({ editFormField }).then((error) => {
      if (!error) {
        $uibModalInstance.close()
        externalScope.closeMobileFields()
      }
    })
  }

  vm.cancelMyInfoField = function () {
    $uibModalInstance.close()
  }
}
