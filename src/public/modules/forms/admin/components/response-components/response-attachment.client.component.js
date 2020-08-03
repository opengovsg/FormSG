const { triggerFileDownload } = require('../../../helpers/util')
const { decode: decodeBase64 } = require('@stablelib/base64')

angular.module('forms').component('responseAttachmentComponent', {
  templateUrl:
    'modules/forms/admin/componentViews/response-views/response-attachment.client.view.html',
  bindings: {
    field: '<',
    encryptionKey: '<',
  },
  controllerAs: 'vm',
  controller: ['FormSgSdk', '$timeout', responseAttachmentComponentController],
})

function responseAttachmentComponentController(FormSgSdk, $timeout) {
  const vm = this

  vm.downloadAndDecryptAttachment = function () {
    vm.hasDownloadError = false
    fetch(vm.field.downloadUrl)
      .then((response) => response.json())
      .then((data) => {
        data.encryptedFile.binary = decodeBase64(data.encryptedFile.binary)
        return FormSgSdk.crypto.decryptFile(
          vm.encryptionKey.secretKey,
          data.encryptedFile,
        )
      })
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
