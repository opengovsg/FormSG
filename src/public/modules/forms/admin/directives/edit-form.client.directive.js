'use strict'
const { EditFieldActions } = require('shared/constants')
const { groupLogicUnitsByField } = require('shared/util/logic')
const { reorder } = require('shared/util/immutable-array-fns')
const FieldFactory = require('../../helpers/field-factory')
const { UPDATE_FORM_TYPES } = require('../constants/update-form-types')

const newFields = new Set() // Adding a fieldTypes will add a "new" label.

angular.module('forms').directive('editFormDirective', editFormDirective)

// TODO (private #110): remove this variable
const DEPRECATED_MYINFO_ATTRS = [
  'homeno',
  'billadd',
  'mailadd',
  'edulevel',
  'schoolname',
  'gradyear',
]

function editFormDirective() {
  return {
    templateUrl:
      'modules/forms/admin/directiveViews/edit-form.client.view.html',
    restrict: 'E',
    transclude: true,
    scope: {
      myform: '=',
      updateForm: '&',
      updateFormEndPage: '&',
      updateFormStartPage: '&',
    },
    controller: [
      '$scope',
      'FormFields',
      '$uibModal',
      'responseModeEnum',
      'Betas',
      '$window',
      'Attachment',
      editFormController,
    ],
  }
}

function editFormController(
  $scope,
  FormFields,
  $uibModal,
  responseModeEnum,
  Betas,
  $window,
  Attachment,
) {
  // For use in component.
  $scope.responseModeEnum = responseModeEnum

  $scope.isBetaField = function (fieldType) {
    return Betas.isBetaField(fieldType)
  }

  $scope.isNewField = function (fieldType) {
    return newFields.has(fieldType)
  }

  $scope.adminHasAccess = function (fieldType) {
    const user = $scope.myform.admin
    return Betas.userHasAccessToFieldType(user, fieldType)
  }

  $scope.getFieldTitle = FormFields.getFieldTitle

  //    Setup UI-Sortable
  $scope.sortableOptions = {
    handle: '.current-field-drag',
    forceFallback: true,
    ghostClass: 'field-placeholder',
    animation: 0,
    onUpdate: function (evt) {
      const { model, models, newIndex, oldIndex } = evt
      // Clear selected after drop
      $scope.resetFieldMore()
      updateField({
        fieldId: model._id,
        newPosition: newIndex,
        type: UPDATE_FORM_TYPES.ReorderField,
      }).then((error) => {
        // Will be undefined if no error occurs.
        if (error) {
          // Rollback changes, reorder list.
          const oldList = reorder(models, newIndex, oldIndex)
          $scope.myform.form_fields = oldList
        }
      })
    },
  }

  let hiddenFieldSet = new Set() // To monitor which fields should be hidden because of form logic
  let conditionFieldSet = new Set() // To monitor which fields are conditions in the form logic
  // On change of form logic (scope.myform.form_logics), update our logic monitors
  $scope.$watchCollection('myform.form_logics', function (_newVal, _oldVal) {
    updateHiddenFieldSet()
    updateConditionFieldSet()
  })

  // Loop through form_logics to identify which fields should be hidden
  const updateHiddenFieldSet = function () {
    hiddenFieldSet = new Set(Object.keys(groupLogicUnitsByField($scope.myform)))
  }

  // Loop through form_logics to identify which fields are used in a logic condition
  const updateConditionFieldSet = function () {
    let updatedConditionFieldSet = new Set()
    const addConditionFieldsToSet = function (logicUnit) {
      logicUnit.conditions.forEach((c) => updatedConditionFieldSet.add(c.field))
    }
    $scope.myform.form_logics.forEach(addConditionFieldsToSet)
    conditionFieldSet = updatedConditionFieldSet
  }

  /**
   * Checks if field should be hidden because of logic
   * @param {Object} field A form field object
   * @returns {Boolean} Whether the field should be hidden because of form logic
   */
  $scope.isHidden = function (field) {
    return hiddenFieldSet.has(field._id)
  }

  /**
   * Checks if field is used in a logic condition
   * @param {Object} field A form field object
   * @returns {Boolean} Whether the field is a condition used in form logic
   */
  $scope.isCondition = function (field) {
    return conditionFieldSet.has(field._id)
  }

  /**
   * Returns the number of myInfo fields in a form
   * @param {Object} A form object
   * @returns {Integer} The number of MyInfo fields
   */
  $scope.countMyInfoFields = function (form) {
    let count = 0
    form.form_fields.forEach(function (field) {
      if (field.myInfo !== undefined) {
        count++
      }
    })
    return count
  }

  // Update myInfo counts when the form field changes
  $scope.maxMyInfoFields = 30
  $scope.numMyInfoFields = $scope.countMyInfoFields($scope.myform)
  $scope.$watch(
    (scope) => scope.myform.form_fields,
    function (_newVal, _oldVal) {
      $scope.numMyInfoFields = $scope.countMyInfoFields($scope.myform)
    },
  )

  // Default Attachments Total Size
  if ($scope.myform.responseMode === responseModeEnum.ENCRYPT) {
    Attachment.attachmentsTotal = 20
  } else {
    Attachment.attachmentsTotal = 7
  }
  Attachment.attachmentsMax = Attachment.attachmentsTotal

  // Count existing attachments size and subtract from attachmentsTotal
  $scope.myform.form_fields.forEach(function (field) {
    if (field.fieldType === 'attachment') {
      Attachment.attachmentsTotal -= field.attachmentSize
    }
  })

  /*
   ** Open Fields modal on mobile
   */
  $scope.showMobileFieldCancel = false
  $scope.openMobileFields = () => {
    $scope.showMobileFieldCancel = true
    $scope.addFieldsModal = $uibModal.open({
      animation: true,
      backdrop: 'static',
      keyboard: false,
      templateUrl:
        'modules/forms/admin/views/mobile-edit-fields.client.modal.html',
      windowClass: 'edit-modal-window full-page-modal',
      backdropClass: 'add-field-modal-backdrop',
      resolve: {
        externalScope: function () {
          return {
            addField: $scope.addField,
            addNewField: $scope.addNewField,
            addNewMyInfoField: $scope.addNewMyInfoField,
            isDisabledField: $scope.isDisabledField,
            adminHasAccess: $scope.adminHasAccess,
            myform: $scope.myform,
            isStorageForm: $scope.isStorageForm,
          }
        },
      },
      controller: 'MobileEditFieldsModalController',
      controllerAs: 'vm',
    })
  }

  $scope.closeMobileFields = () => {
    if (!$scope.addFieldsModal) {
      return
    }
    $scope.showMobileFieldCancel = false
    $scope.addFieldsModal.opened.then(() =>
      $scope.addFieldsModal.close('dismiss'),
    )
  }

  // Add event listener to close mobile modal upon screen re-size
  $window.addEventListener('resize', () => {
    if ($window.screen.width >= 768) {
      $scope.closeMobileFields()
    }
  })

  /**
   * EditModal Functions
   */
  $scope.openEditModal = function (currField, isConditionField) {
    // Clear all selected fields before opening a modal
    $scope.fieldMoreShown = []

    $scope.editFieldModal = $uibModal.open({
      animation: true,
      backdrop: 'static',
      keyboard: false,
      templateUrl: 'modules/forms/admin/views/edit-fields.client.modal.html',
      windowClass: 'edit-modal-window full-page-modal',
      resolve: {
        externalScope: function () {
          return {
            currField,
            isConditionField,
            closeMobileFields: $scope.closeMobileFields,
            myform: $scope.myform,
            attachmentsMax: Attachment.attachmentsMax,
            updateField,
          }
        },
      },
      controller: 'EditFieldsModalController',
      controllerAs: 'vm',
    })
  }

  // MyInfo field modal on add
  $scope.openMyInfoEditModal = function (currField, isConditionField) {
    // Clear all selected fields before opening a modal
    $scope.fieldMoreShown = []

    FormFields.injectMyInfoFieldInfo(currField)

    // Open modal
    $scope.editMyInfoFieldModal = $uibModal.open({
      animation: true,
      backdrop: 'static',
      keyboard: false,
      templateUrl:
        'modules/forms/admin/views/edit-myinfo-field.client.modal.html',
      windowClass: 'edit-modal-window full-page-modal modal-on-top',
      backdropClass: 'custom-modal-backdrop',
      resolve: {
        externalScope: () => ({
          currField,
          isConditionField,
          closeMobileFields: $scope.closeMobileFields,
          myform: $scope.myform,
        }),
        updateField: () => updateField,
      },
      controller: 'EditMyInfoFieldController',
      controllerAs: 'vm',
    })
  }

  /**
   * EditStartPageModal Functions
   */
  $scope.openEditStartPageModal = function () {
    // Clear all selected fields before opening a modal
    $scope.fieldMoreShown = []

    $scope.editStartPageModal = $uibModal.open({
      animation: true,
      backdrop: 'static',
      keyboard: false,
      templateUrl:
        'modules/forms/admin/views/edit-start-page.client.modal.html',
      windowClass: 'edit-modal-window full-page-modal',
      backdropClass: 'custom-modal-backdrop',
      controller: 'EditStartPageController',
      controllerAs: 'vm',
      resolve: {
        myform: () => $scope.myform,
        updateStartPage: () => $scope.updateFormStartPage,
      },
    })
  }

  /**
   * EditEndPageModal Functions
   */
  $scope.openEditEndPageModal = function () {
    // Clear all selected fields before opening a modal
    $scope.fieldMoreShown = []

    $scope.editEndPageModal = $uibModal.open({
      animation: true,
      backdrop: 'static',
      keyboard: false,
      templateUrl: 'modules/forms/admin/views/edit-end-page.client.modal.html',
      windowClass: 'edit-modal-window full-page-modal',
      backdropClass: 'custom-modal-backdrop',
      controller: 'EditEndPageController',
      controllerAs: 'vm',
      resolve: {
        myform: () => $scope.myform,
        updateEndPage: () => $scope.updateFormEndPage,
      },
    })
  }

  /*
   ** EditModal Functions
   */

  $scope.isStorageForm = $scope.myform.responseMode === responseModeEnum.ENCRYPT

  // Disable attachment fields when we have webhooks
  $scope.isDisabledField = function (fieldType) {
    return fieldType.name === 'attachment' && $scope.myform.webhook.url !== ''
  }

  /**
   * Creates a new field and opens the edit modal
   * @param fieldType {String} The field type to construct
   * */
  $scope.addNewField = function (fieldType) {
    if (!fieldType) return
    let newField = FieldFactory.createDefaultBasicField(fieldType)
    $scope.openEditModal(newField)
  }

  $scope.addNewMyInfoField = function (myInfoAttr) {
    if ($scope.numMyInfoFields >= $scope.maxMyInfoFields) return
    let newField = FormFields.createMyInfoField(myInfoAttr)
    $scope.openMyInfoEditModal(newField)
  }

  $scope.fieldMoreShown = []
  $scope.resetFieldMore = () => {
    $scope.fieldMoreShown = []
    $scope.$apply()
  }
  $scope.toggleMore = (fieldId) => {
    $scope.fieldMoreShown = []
    $scope.fieldMoreShown[fieldId] = !$scope.fieldMoreShown[fieldId]
  }
  // Clear all selected fields when background is pressed
  $(window).click(function (e) {
    if (e.target.id === 'current-fields') {
      $scope.resetFieldMore()
    }
  })

  function handleDeleteField(field) {
    if (field.fieldType === 'attachment') {
      Attachment.attachmentsTotal += parseInt(field.attachmentSize)
    }

    return updateField({
      fieldId: field._id,
      type: UPDATE_FORM_TYPES.DeleteField,
    })
  }

  // Delete particular field on button click
  $scope.deleteField = function (fieldIndex, isLogicField) {
    const field = $scope.myform.form_fields[fieldIndex]

    if (isLogicField) {
      $uibModal.open({
        animation: true,
        backdrop: 'static',
        keyboard: false,
        templateUrl:
          'modules/forms/admin/views/delete-field-warning.client.modal.html',
        windowClass: 'delete-field-modal-window',
        controller: 'DeleteFieldWarningController',
        controllerAs: 'vm',
        resolve: {
          processDelete: () => () => handleDeleteField(field),
        },
      })
    } else {
      handleDeleteField(field)
    }
  }

  $scope.tryDuplicateField = function (fieldIndex, isLogicField) {
    let fieldToDuplicate = $scope.myform.form_fields[fieldIndex]
    if (isLogicField) {
      // Warn of logic not being duplicated
      $uibModal.open({
        animation: true,
        backdrop: 'static',
        keyboard: false,
        templateUrl: 'modules/forms/admin/views/pop-up.client.modal.html',
        windowClass: 'pop-up-modal-window',
        controller: 'PopUpModalController',
        controllerAs: 'vm',
        resolve: {
          externalScope: function () {
            return {
              title: 'Duplicating field with logic',
              description:
                'Note that logic associated with this field will <b>NOT</b> be duplicated.',
              confirmButtonText: 'Proceed',
              cancelButtonText: 'Cancel',
              onConfirm: () => duplicateField(fieldToDuplicate),
            }
          },
        },
      })
    } else {
      if (fieldToDuplicate.fieldType === 'attachment') {
        let attachmentSize = parseInt(fieldToDuplicate.attachmentSize)
        if (Attachment.attachmentsTotal - attachmentSize >= 0) {
          Attachment.attachmentsTotal -= attachmentSize
        } else {
          // Attachment limit reached, prevent field duplication
          $uibModal.open({
            animation: true,
            backdrop: 'static',
            keyboard: false,
            templateUrl: 'modules/forms/admin/views/pop-up.client.modal.html',
            windowClass: 'pop-up-modal-window',
            controller: 'PopUpModalController',
            controllerAs: 'vm',
            resolve: {
              externalScope: function () {
                return {
                  title: 'Attachment size limit exceeded!',
                  confirmButtonText: 'OK',
                  description: `You are trying to duplicate an attachment field of <b>${attachmentSize}MB</b> but there is only <b>${Attachment.attachmentsTotal}MB</b> left.<br><br>Try reducing the size of your attachments.`,
                }
              },
            },
          })
          return
        }
      }
      duplicateField(fieldToDuplicate)
    }
  }

  const duplicateField = (fieldToDuplicate) => {
    if (
      fieldToDuplicate.myInfo !== undefined &&
      $scope.numMyInfoFields >= $scope.maxMyInfoFields
    )
      return
    let duplicatedField = _.cloneDeep(fieldToDuplicate)
    // Remove unique ids before saving
    delete duplicatedField.globalId
    delete duplicatedField._id
    updateField({
      editFormField: {
        action: {
          name: EditFieldActions.Duplicate,
        },
        field: duplicatedField,
      },
    })
  }

  const updateField = (update) => {
    return $scope.updateForm({ update })
  }

  // Populate AddField with all available form field types
  $scope.addField = {}
  $scope.addField.types = FormFields.basicTypes

  // TODO (private #110): remove this filtering once the deprecated fields
  // are deleted from shared/resources/myinfo
  $scope.addField.myInfoTypes = FormFields.myInfoTypes.filter(
    (type) => !DEPRECATED_MYINFO_ATTRS.includes(type.name),
  )
}
