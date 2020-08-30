const { triggerFileDownload } = require('../../../helpers/util')

angular.module('forms').component('responseAttachmentComponent', {
  templateUrl:
    'modules/forms/admin/componentViews/response-views/response-attachment.client.view.html',
  bindings: {
    field: '<',
    encryptionKey: '<',
  },
  controllerAs: 'vm',
  controller: [
    'Submissions',
    '$timeout',
    responseAttachmentComponentController,
  ],
})

function responseAttachmentComponentController(Submissions, $timeout) {
  const vm = this

  vm.downloadAndDecryptAttachment = function () {
    vm.hasDownloadError = false
    Submissions.downloadAndDecryptAttachment(
      vm.field.downloadUrl,
      vm.encryptionKey.secretKey,
    )
      .then((bytesArray) => {
        // Construct a downloadable link and click on it to download the file
        let blob = new Blob([bytesArray])
        // field.answer is the filename
        triggerFileDownload(blob, vm.field.answer)
      })
      .catch(() => {
        // Use timeout to trigger digest cycle
        $timeout(() => {
          vm.hasDownloadError = true
        })
      })
  }
}
