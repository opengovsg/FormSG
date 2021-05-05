'use strict'
let dedent = require('dedent-js')

angular.module('forms').component('shareFormComponent', {
  templateUrl: 'modules/forms/admin/componentViews/share-form.client.view.html',
  bindings: {
    formId: '<',
    isLogicError: '<',
    status: '<',
    userCanEdit: '<',
  },
  controller: ['$state', '$translate', 'Auth', shareFormController],
  controllerAs: 'vm',
})

function shareFormController($state, $translate, Auth) {
  const vm = this

  vm.$onInit = () => {
    $translate(['LINKS.APP.ROOT', 'APP_NAME'])
      .then(function (translations) {
        vm.appUrl = translations['LINKS.APP.ROOT']
        vm.appName = translations.APP_NAME
      })
      .then(() => {
        // Link for form sharing - server contains redirect endpoint
        vm.sharedFormUrl = $state
          .href('submitForm', { formId: vm.formId }, { absolute: true })
          .replace('/#!', '')

        vm.sharedFormUseTemplateUrl = $state
          .href('useTemplate', { formId: vm.formId }, { absolute: true })
          .replace('/#!', '')

        // Formulate embedded HTML here
        vm.embeddedHTML = dedent(`
        <div style="font-family:Sans-Serif;font-size:15px;color:#000;opacity:0.9;padding-top:5px;padding-bottom:8px">If the form below is not loaded, you can also fill it in at <a href="${vm.sharedFormUrl}">here</a>.</div>
        
        <!-- Change the width and height values to suit you best -->
        <iframe id="iframe" src="${vm.sharedFormUrl}" style="width:100%;height:500px"></iframe>
        
        <div style="font-family:Sans-Serif;font-size:12px;color:#999;opacity:0.5;padding-top:5px">Powered by <a href="${vm.appUrl}" style="color: #999">${vm.appName}</a></div>
`)
      })
  }

  // Copied tooltip for both link and embed
  vm.isCopied = [false, false]
  vm.onSuccess = (index) => {
    vm.isCopied[index] = true
    setTimeout(() => {
      vm.isCopied[index] = false
    }, 1000)
  }

  // Show different pro tip for user depending on their email
  const { email } = Auth.getUser()
  vm.isGovOfficer = String(email).endsWith('.gov.sg')
}
