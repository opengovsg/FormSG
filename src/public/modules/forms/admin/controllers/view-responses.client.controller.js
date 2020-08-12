'use strict'

const processDecryptedContent = require('../../helpers/process-decrypted-content')

const SHOW_PROGRESS_DELAY_MS = 3000

angular
  .module('forms')
  .controller('ViewResponsesController', [
    '$scope',
    'Submissions',
    'NgTableParams',
    'responseModeEnum',
    'Toastr',
    '$uibModal',
    '$timeout',
    'moment',
    'FormSgSdk',
    ViewResponsesController,
  ])

function ViewResponsesController(
  $scope,
  Submissions,
  NgTableParams,
  responseModeEnum,
  Toastr,
  $uibModal,
  $timeout,
  moment,
  FormSgSdk,
) {
  const vm = this

  // $scope inherited from Admin Form Controller
  vm.myform = $scope.myform
  vm.loading = true
  vm.isEncryptResponseMode = vm.myform.responseMode === responseModeEnum.ENCRYPT
  vm.encryptionKey = null // will be set to an instance of EncryptionKey when form is unlocked successfully
  vm.csvDownloading = false // whether CSV export is in progress
  vm.filterBySubmissionRefId = '' // whether to filter submissions by a specific ID
  vm.filterBySubmissionRefIdTextbox = ''

  // Three views:
  // 1 - Unlock view for verifying form password
  // 2 - Unlocked view with responses table
  // 3 - Unlocked view with specific response
  vm.currentView = 1

  vm.datePicker = { date: { startDate: null, endDate: null } }

  // Datepicker for export CSV function
  vm.exportCsvDate = {
    value: '',
    isOpen: false,
    options: {
      changeYear: true,
      changeMonth: true,
      showWeeks: false,
      formatMonth: 'MMM',
    },
  }

  // Trigger for export CSV
  vm.exportCsv = function () {
    let params = {
      formId: vm.myform._id,
      formTitle: vm.myform.title,
    }

    if (vm.datePicker.date.startDate && vm.datePicker.date.endDate) {
      params.startDate = moment(new Date(vm.datePicker.date.startDate)).format(
        'YYYY-MM-DD',
      )
      params.endDate = moment(new Date(vm.datePicker.date.endDate)).format(
        'YYYY-MM-DD',
      )
    }

    vm.csvDownloading = true
    Submissions.downloadEncryptedResponses(params, vm.encryptionKey.secretKey)
      .then(function (result) {
        $timeout(function () {
          const { expectedCount, successCount, errorCount } = result
          if (expectedCount === 0) {
            Toastr.success('No responses found for decryption.')
          } else {
            Toastr.success(
              `Success. ${successCount}/${expectedCount} response(s) were decrypted. ${
                errorCount > 0 ? `${errorCount} failed.` : ''
              }`,
            )
          }
        })
      })
      .catch(function (error) {
        try {
          const { errorCount, errorMessage } = JSON.parse(error.message)
          Toastr.error(
            errorMessage ||
              `Error downloading. ${errorCount} response(s) could not be decrypted. Please try again later.`,
            { timeOut: 3000 },
          )
        } catch (error) {
          console.error('Unknown download encrypted responses error:\t', error)
        }
      })
      .finally(function () {
        $timeout(function () {
          vm.csvDownloading = false
        })
      })
  }

  vm.rowOnClick = function (i) {
    // i is the index of the response in the array of metadata (varies from 0 to (length of metadata array - 1))
    // number is the index of the response among the entire set of responses (varies from 1 to total number of response)
    let submissionId = vm.tableParams.data[i].refNo
    vm.currentResponse = {
      index: i,
      number: vm.tableParams.data[i].number,
    }
    vm.updateResponseShown(submissionId, vm.currentResponse.number)
  }

  vm.backToList = function () {
    vm.currentView = 2
  }

  vm.updateResponseShown = (submissionId, responseNum) => {
    vm.loading = true
    vm.currentView = 3

    Submissions.getEncryptedResponse({
      formId: vm.myform._id,
      submissionId,
    }).then((response) => {
      if (vm.encryptionKey !== null) {
        const { content, verified, attachmentMetadata } = response

        let displayedContent

        try {
          const decrypted = FormSgSdk.crypto.decrypt(
            vm.encryptionKey.secretKey,
            {
              encryptedContent: content,
              verifiedContent: verified,
            },
          )

          // Convert decrypted content into displayable object.
          displayedContent = processDecryptedContent(decrypted)
        } catch (err) {
          const errorMessage = 'Could not decrypt the response.'
          Toastr.error(errorMessage)
          displayedContent = [{ question: errorMessage, answer: '' }]
        }

        let questionCount = 0
        displayedContent.forEach((field) => {
          // Populate question number
          if (field.fieldType !== 'section') {
            field.questionNumber = ++questionCount
          }
          // Populate S3 presigned URL for attachments
          if (attachmentMetadata[field._id]) {
            field.downloadUrl = attachmentMetadata[field._id]
          }
        })

        vm.decryptedResponse = {
          ...response,
          content: displayedContent,
          responseNum,
        }
      }

      vm.loading = false
    })
  }

  vm.nextRespondent = function () {
    if (vm.currentResponse.number <= 1) {
      // This is the last response
    } else if (vm.currentResponse.index >= vm.tableParams.data.length - 1) {
      // Need to get next page of results
      let currentPage = vm.tableParams.page()
      vm.tableParams.page(currentPage + 1)
      vm.loading = true
      vm.tableParams.reload().then(() => {
        vm.rowOnClick(0)
      })
    } else {
      // Grab next submission id from metadata array and pull submission info from db
      vm.currentResponse.index++
      vm.currentResponse.number--
      let submissionId = vm.tableParams.data[vm.currentResponse.index].refNo
      vm.updateResponseShown(submissionId, vm.currentResponse.number)
    }
  }

  vm.previousRespondent = function () {
    if (vm.currentResponse.number >= vm.responsesCount) {
      // This is the first response
    } else if (vm.currentResponse.index <= 0) {
      // Need to get previous page of results
      let currentPage = vm.tableParams.page()
      vm.tableParams.page(currentPage - 1)
      vm.loading = true
      vm.tableParams.reload().then(() => {
        vm.rowOnClick(9)
      })
    } else {
      // Grab next submission id from metadata array and pull submission info from db
      vm.currentResponse.index--
      vm.currentResponse.number++
      let submissionId = vm.tableParams.data[vm.currentResponse.index].refNo
      vm.updateResponseShown(submissionId, vm.currentResponse.number)
    }
  }

  // When this route is initialized, call the responses count function
  $scope.$parent.$watch('vm.activeResultsTab', (newValue) => {
    if (newValue === 'responses' && vm.loading) {
      Submissions.count({
        formId: vm.myform._id,
      })
        .then((responsesCount) => {
          vm.responsesCount = responsesCount
          $timeout(() => {
            vm.loading = false
          }, 200)
        })
        .catch((error) => {
          console.error(error)
        })
    }
  })

  vm.filterBySubmissionChanged = function () {
    vm.filterBySubmissionRefId = vm.filterBySubmissionRefIdTextbox
    vm.tableParams.reload()
  }

  // Called by child directive unlockResponsesForm after key is verified to get responses
  vm.loadResponses = function () {
    vm.currentView = 2
    vm.loading = true
    vm.tableParams = new NgTableParams(
      {
        page: 1, // show first page
        count: 10, // count per page
      },
      {
        getData: (params) => {
          let { page } = params.url()
          return Submissions.getMetadata({
            formId: vm.myform._id,
            filterBySubmissionRefId: vm.filterBySubmissionRefId,
            page,
          })
            .then((data) => {
              params.total(data.count)
              vm.responsesCount = data.count
              return data.metadata
            })
            .catch((error) => {
              console.error(error)
            })
        },
        counts: [], // Remove page size options
      },
    )
    vm.loading = false
  }

  /** * UNLOCK RESPONSES ***/
  vm.unlock = function ({ encryptionKey }) {
    if (encryptionKey !== null) {
      vm.encryptionKey = encryptionKey
      vm.loadResponses()
    }
  }

  // Triggers the download progress modal after SHOW_PROGRESS_DELAY_MS has
  // passed and is still downloading after export button click.
  let timeoutPromise
  let progressModal
  $scope.$watch('csvDownloading', function (csvDownloading) {
    if (!csvDownloading) {
      if (timeoutPromise) {
        $timeout.cancel(timeoutPromise)
      }

      if (progressModal) {
        progressModal.close()
        progressModal = null
      }
    } else {
      timeoutPromise = $timeout(function () {
        progressModal = $uibModal.open({
          animation: true,
          backdrop: 'static',
          keyboard: false,
          templateUrl:
            'modules/forms/admin/views/decrypt-progress.client.modal.html',
          windowClass: 'submit-progress-modal-window',
        })
      }, SHOW_PROGRESS_DELAY_MS)
    }
  })
}
