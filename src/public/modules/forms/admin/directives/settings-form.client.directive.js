'use strict'
const dedent = require('dedent-js')
const { get, set, isEqual } = require('lodash')
const AdminSubmissionsService = require('../../../../services/AdminSubmissionsService')

const UserService = require('../../../../services/UserService')

const SETTINGS_PATH = [
  'title',
  'emails',
  'status',
  'hasCaptcha',
  'authType',
  'esrvcId',
  'responseMode',
  'inactiveMessage',
  'submissionLimit',
  'webhook.url',
  'webhook.isRetryEnabled',
]

const createTempSettings = (myform) => {
  let tempForm = {}
  SETTINGS_PATH.forEach((path) => set(tempForm, path, get(myform, path)))
  tempForm.mode = 'edit'
  if (Array.isArray(tempForm.emails)) {
    tempForm.emails = tempForm.emails.join(', ')
  }
  return tempForm
}

angular
  .module('forms')
  .directive('settingsFormDirective', [
    '$q',
    'Toastr',
    '$timeout',
    'responseModeEnum',
    '$uibModal',
    settingsFormDirective,
  ])

function settingsFormDirective(
  $q,
  Toastr,
  $timeout,
  responseModeEnum,
  $uibModal,
) {
  return {
    templateUrl:
      'modules/forms/admin/directiveViews/settings-form.client.view.html',
    restrict: 'E',
    scope: {
      myform: '=',
      updateFormSettings: '&',
    },
    controller: [
      '$scope',
      function ($scope) {
        $scope.user = UserService.getUserFromLocalStorage()

        $scope.responseModeEnum = responseModeEnum
        $scope.tempForm = createTempSettings($scope.myform)
        $scope.submissionLimitToggle = $scope.tempForm.submissionLimit !== null
        $scope.submissionLimitUnlimited = null

        $scope.currentResponsesCount = 0
        $q.when(
          AdminSubmissionsService.countFormSubmissions({
            formId: $scope.myform._id,
          }),
        )
          .then((responsesCount) => {
            $scope.currentResponsesCount = responsesCount
          })
          .catch((error) => {
            Toastr.error(
              `There was an error in displaying the number of responses. Please refresh and try again.`,
            )
            console.log(error)
          })

        const getCurrentSettings = () => {
          // Detect difference between the new form (tempForm) and the old form (myform),
          // and puts it in updatedSettings
          let tempForm = $scope.tempForm
          let myform = $scope.myform
          let updatedSettings = {}

          SETTINGS_PATH.forEach((name) => {
            if (!isEqual(get(tempForm, name), get(myform, name))) {
              set(updatedSettings, name, get(tempForm, name))
            }
          })

          // Special case for email: myform.email is single-element array with string,
          // while tempform.email originally follows myform.email format but transforms
          // into just a string when the field is edited. This makes isEqual incorrectly falsy.
          const emailsFieldIncorrectlyAdded =
            updatedSettings.emails &&
            !Array.isArray(tempForm.emails) &&
            // Remove all whitespace from tempForm email string so spaces do not affect equality.
            myform.emails.join(',') === tempForm.emails.replace(/\s+/g, '')
          if (emailsFieldIncorrectlyAdded) delete updatedSettings.emails

          return updatedSettings
        }

        // Generic update form function with custom callback on success
        const updateSettings = (callback) => {
          return $scope
            .updateFormSettings({ settingsToUpdate: getCurrentSettings() })
            .then((error) => {
              if (error) {
                revertField()
              } else {
                callback()
              }
            })
        }

        $scope.isFormPublic = () => {
          return $scope.myform.status === 'PUBLIC'
        }

        $scope.isFormPrivate = () => {
          return $scope.myform.status === 'PRIVATE'
        }

        $scope.isFormEncrypt = () => {
          return $scope.myform.responseMode === responseModeEnum.ENCRYPT
        }

        $scope.isFormMyInfo = () => {
          return $scope.tempForm.authType === 'MyInfo'
        }

        // Warning message when turning off SP with MyInfo fields
        $scope.myInfoSPWarning = () => {
          return (
            $scope.myform.form_fields.filter((field) => field.myInfo).length > 0
          )
        }

        $scope.isDisableAuthType = () => {
          return (
            $scope.isFormPublic() ||
            ($scope.isFormPrivate() && $scope.myInfoSPWarning())
          )
        }

        $scope.isPublicWithoutEsrvcId = () => {
          return (
            $scope.myform.status === 'PUBLIC' &&
            ['SP', 'CP', 'MyInfo'].includes($scope.myform.authType) &&
            !$scope.myform.esrvcId
          )
        }

        $scope.isPrivateWithoutEsrvcId = () => {
          return (
            $scope.myform.status === 'PRIVATE' &&
            ['SP', 'CP', 'MyInfo'].includes($scope.myform.authType) &&
            !$scope.myform.esrvcId
          )
        }

        $scope.authTypes = [
          {
            val: 'NIL',
            name: 'None',
            isEnabledInStorageMode: true,
          },
          {
            val: 'SP',
            name: 'Singpass',
            isEnabledInStorageMode: true,
          },
          {
            val: 'SGID',
            name: 'Singpass App-only Login (Free)',
            isEnabledInStorageMode: true,
          },
          {
            val: 'MyInfo',
            name: 'Singpass with MyInfo',
            isEnabledInStorageMode: false,
          },
          {
            val: 'CP',
            name: 'Singpass Corporate',
            isEnabledInStorageMode: true,
          },
        ]

        // Lazily access fields to prevent race-conditions
        $scope.inputFields = {
          emails: () => $scope.settingsForm.emailList,
          title: () => $scope.settingsForm.title,
          esrvcId: () => $scope.settingsForm.esrvcId,
          inactiveMessage: () => $scope.settingsForm.inactiveMessage,
          submissionLimit: () => $scope.settingsForm.submissionLimit,
          webhook: () => $scope.settingsForm.webhookUrl,
        }

        const dirtyInputFieldsAreInvalid = (fields) => {
          let hasInvalidFields = false
          fields.forEach((k) => {
            if ($scope.inputFields[k] && !$scope.inputFields[k]().$valid) {
              hasInvalidFields = true
            }
          })
          return hasInvalidFields
        }

        const getDirtyInputFields = () => {
          // We cannot use settingsForm.field.$dirty, because it is true as long as the field
          // has been interacted with. But a click without an edit is by definition clean
          // for field-updating purposes
          return Object.keys(getCurrentSettings())
        }

        const revertField = () => {
          $scope.tempForm = createTempSettings($scope.myform)
        }

        $scope.toggleFormSubmissionLimit = () => {
          if ($scope.submissionLimitToggle) {
            $scope.tempForm.submissionLimit = 1000
          } else {
            $scope.tempForm.submissionLimit = null
          }
          $scope.updateSettingsByPath(
            'submissionLimit',
            $scope.tempForm.submissionLimit,
          )
        }

        $scope.saveForm = () => {
          const dirtyFields = getDirtyInputFields()
          if (dirtyInputFieldsAreInvalid(dirtyFields)) {
            revertField()
            return
          }

          if (dirtyFields.length === 0) {
            return
          }

          updateSettings(() => {
            Toastr.success('Form updated', {
              preventDuplicates: false,
              newestOnTop: false,
            })
          })
        }

        $scope.updateSettingsByPath = (path, value) => {
          if (
            (path && value !== null && value !== undefined) ||
            path === 'submissionLimit'
          ) {
            set($scope.tempForm, path, value)
          }
          // Update form
          updateSettings(() => {
            Toastr.success('Form updated', {
              preventDuplicates: false,
              newestOnTop: false,
            })
          })
        }

        // Three possible button states
        // 1 - unpressed,
        // 2 - pressed; loading,
        // 3 - pressed; saved
        $scope.btnLiveState = 1

        $scope.isGoLiveButton = () => {
          return (
            ($scope.tempForm.status === 'PRIVATE' &&
              $scope.btnLiveState === 1) ||
            ($scope.tempForm.status === 'PUBLIC' && $scope.btnLiveState > 1)
          )
        }

        // Toggle form status between PUBLIC and PRIVATE
        const updateFormStatusAndSave = (toastText, toastOptions = {}) => {
          $scope.tempForm.status =
            $scope.tempForm.status === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE'
          $scope.btnLiveState = 2 // pressed; loading
          return updateSettings(() => {
            $timeout(() => {
              $scope.btnLiveState = 3 // pressed; saved
              $timeout(() => {
                $scope.btnLiveState = 1 // unpressed
              }, 1000)
              Toastr.success(toastText || 'Form updated', toastOptions)
            }, 1000)
          })
        }

        const openActivateFormModal = function (checks) {
          $scope.activateFormModal = $uibModal.open({
            animation: true,
            templateUrl:
              'modules/forms/admin/views/activate-form.client.modal.html',
            windowClass: 'full-screen-modal-window',
            controller: 'ActivateFormController',
            controllerAs: 'vm',
            resolve: {
              externalScope: () => ({
                updateFormStatusAndSave,
                checks,
                formParams: {
                  _id: $scope.myform._id,
                  title: $scope.myform.title,
                },
              }),
            },
          })
        }

        $scope.validateThenSave = () => {
          const checkPassword = $scope.isFormEncrypt()
          const checkESrvcId = !['NIL', 'SGID'].includes(
            // No need to validate eSrvcId for SGID
            $scope.tempForm.authType,
          )
          // Not possible for both to be true simultaneously as we have disabled spcp for encrypt forms
          // But the validation will handle both cases
          if ($scope.isFormPrivate() && (checkPassword || checkESrvcId)) {
            let checks = {}
            if (checkESrvcId) {
              checks.eSrvcIdParams = {
                target: $scope.myform._id,
                authType: $scope.tempForm.authType,
                esrvcId: $scope.tempForm.esrvcId,
              }
            }
            if (checkPassword) {
              checks.passwordParams = {
                publicKey: $scope.myform.publicKey,
              }
            }
            openActivateFormModal(checks)
          } else {
            // Email form
            // Next state will be public, show better toast message.
            if ($scope.tempForm.status === 'PRIVATE') {
              const toastMessage = dedent`
                Congrats! Your form is now live.<br/>For high-traffic forms,
                <a href="https://go.gov.sg/form-prevent-bounce" target="_blank">
                  AutoArchive your mailbox</a> to prevent lost responses.
              `
              updateFormStatusAndSave(toastMessage, {
                timeOut: 10000,
                extendedTimeOut: 10000,
                skipLinky: true,
              })
            } else {
              updateFormStatusAndSave('Form deactivated!')
            }
          }
        }

        $scope.isWebhookRetryToggleDisabled = () => {
          // disable if there is no valid saved webhook URL
          return !get($scope.myform, 'webhook.url')
        }

        $scope.saveWebhookUrl = () => {
          if (!get($scope, 'tempForm.webhook.url')) {
            set($scope, 'tempForm.webhook.isRetryEnabled', false)
          }
          return $scope.saveForm()
        }
      },
    ],
  }
}
