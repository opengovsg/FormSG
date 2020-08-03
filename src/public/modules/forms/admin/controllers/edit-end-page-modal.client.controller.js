'use strict'

const { getFormLogo } = require('../../helpers/logo')

angular
  .module('forms')
  .controller('EditEndPageController', [
    '$uibModalInstance',
    'myform',
    'updateField',
    EditEndPageController,
  ])

function EditEndPageController($uibModalInstance, myform, updateField) {
  const vm = this

  vm.logoUrl = getFormLogo(myform)
  // Make a copy so nothing is changed in the original.
  vm.myform = angular.copy(myform)
  const formHash = '#!/' + vm.myform._id

  // If buttonLink is empty or formHash (default for old forms), set to empty string
  if (
    !vm.myform.endPage.buttonLink ||
    vm.myform.endPage.buttonLink === formHash
  ) {
    vm.myform.endPage.buttonLink = ''
  }

  if (!vm.myform.endPage.buttonText) {
    vm.myform.endPage.buttonText = ''
  }

  vm.showButtons = false
  vm.lastButtonID = 0

  // add new Button to the endPage
  vm.addButton = function () {
    let newButton = {}
    newButton.bgColor = '#ddd'
    newButton.color = '#ffffff'
    newButton.text = 'Button'
    newButton._id = Math.floor(100000 * Math.random())

    vm.myform.endPage.buttons.push(newButton)
  }

  // delete particular Button from endPage
  vm.deleteButton = function (button) {
    let currID
    for (let i = 0; i < vm.myform.endPage.buttons.length; i++) {
      currID = vm.myform.endPage.buttons[i]._id

      if (currID === button._id) {
        vm.myform.endPage.buttons.splice(i, 1)
        break
      }
    }
  }

  vm.saveEndPage = function (isValid) {
    if (isValid) {
      // Check if http(s):// is appended, if not append it
      let inputLink = vm.myform.endPage.buttonLink.trim()

      // If form buttonLink is formHash, set to empty string
      if (inputLink === formHash) {
        inputLink = ''
      }

      if (
        !(
          inputLink.toLowerCase().startsWith('http://') ||
          inputLink.toLowerCase().startsWith('https://') ||
          inputLink === ''
        )
      ) {
        inputLink = 'http://' + inputLink
      }

      vm.myform.endPage.buttonLink = inputLink

      updateField({ endPage: vm.myform.endPage }).then((error) => {
        if (!error) {
          $uibModalInstance.close()
        }
      })
    }
  }

  vm.cancel = function () {
    $uibModalInstance.close()
  }
}
