'use strict'

const HttpStatus = require('http-status-codes')

angular
  .module('forms')
  .controller('CollaboratorModalController', [
    '$scope',
    '$timeout',
    '$uibModalInstance',
    'externalScope',
    'Toastr',
    'FormApi',
    CollaboratorModalController,
  ])

/**
 * @typedef {string} Role
 */
/**
 * @enum {Role}
 */
const ROLES = {
  ADMIN: 'Owner',
  EDITOR: 'Editor',
  VIEWER: 'Read only',
}

function CollaboratorModalController(
  $scope,
  $timeout,
  $uibModalInstance,
  externalScope,
  Toastr,
  FormApi,
) {
  $scope.ROLES = ROLES
  $scope.myform = externalScope.form
  $scope.user = externalScope.user
  $scope.userCanEdit = externalScope.userCanEdit
  $scope.collab = {}

  // Three possible button states
  // 1 - unpressed,
  // 2 - pressed; loading,
  // 3 - pressed; saved
  ;($scope.btnStatus = 1),
    // Stores the open/close state of every collaborator dropdown - this is an array of booleans, where each index
    // is bound to the is-open attribute of the corresponding edit collaborator dropdown menu.
    ($scope.collaboratorDropdownsOpen = []),
    // This is used to prevent scrolling when an edit collaborator dropdown is opened, because the dropdown is appended
    // to the html body, and will not follow the dropdown button if the user scrolls the page while open.
    ($scope.lockCollaboratorScroll = false),
    ($scope.isDisplayTransferOwnerModal = false)
  $scope.isDisplayTransferSuccessMessage = false
  $scope.isDisplayTransferFailedMessage = false
  $scope.hasEmailError = false
  $scope.isAlreadyCollabError = false

  $scope.transferOwnerEmail = undefined
  $scope.transferErrorMessage = undefined

  $scope.transferOwner = () => {
    $scope.resetMessages()
    FormApi.transferOwner(
      { formId: $scope.myform._id },
      { email: $scope.transferOwnerEmail },
    )
      .$promise.then((res) => {
        $scope.myform = res.form
        $scope.isDisplayTransferSuccessMessage = true
      })
      .catch((err) => {
        $scope.transferErrorMessage = err.data.message
        $scope.isDisplayTransferFailedMessage = true
      })
      .finally(() => {
        $scope.isDisplayTransferOwnerModal = false
      })
  }

  /**
   * Calls the update form api
   * formId is the id of the form to update
   * updatedForm is a subset of fields from scope.myform which have been edited
   *
   * @param {Object} {formId: String, updatedForm: Object}
   * @returns Promise
   */
  $scope.updateForm = (update) => {
    return FormApi.update({ formId: $scope.myform._id }, { form: update })
      .$promise.then((savedForm) => {
        // Updating this form updates lastModified
        // and also updates myform if a formToUse is passed in
        $scope.myform = savedForm
      })
      .catch((error) => {
        if (error) {
          let errorMessage
          switch (error.status) {
            case HttpStatus.BAD_REQUEST:
              errorMessage =
                'This page seems outdated, and your changes could not be saved. Please refresh.'
              break
            case HttpStatus.UNAUTHORIZED:
              errorMessage =
                'Your changes could not be saved as your account lacks the requisite privileges.'
              break
            case HttpStatus.UNPROCESSABLE_ENTITY:
              // Validation can fail for many reasons, so return more specific message
              errorMessage = _.get(
                error,
                'data.message',
                'Your changes contain invalid input.',
              )
              break
            case HttpStatus.REQUEST_TOO_LONG: // HTTP Payload Too Large
              errorMessage = `
                  Your form is too large. Reduce the number of fields, or submit a
                  <a href="${$scope.supportFormLink}" target="_blank" rel="noopener"><u>Support Form</u></a>.
                `
              break
            default:
              errorMessage = 'An error occurred while saving your changes.'
          }
          Toastr.error(errorMessage)
        }
        return error
      })
  }

  /**
   * Update the role of an existing user in the permissionList. Called via an edit collaborator dropdown menu.
   * @param {Number} index - The index of the user object in the permissionList (the ng-repeat index)
   * @param {Role} newRole - The selected role
   */
  $scope.updateRole = function (index, newRole) {
    if (
      $scope.myform.permissionList &&
      index > -1 &&
      index < $scope.myform.permissionList.length
    ) {
      let { write } = $scope.roleToPermissions(newRole)
      let permissionList = _.cloneDeep($scope.myform.permissionList)
      permissionList[index].write = write
      $scope.updateForm({ permissionList })
    }
  }

  /**
   * Remove the user object that has the email provided from the permissionList.
   * @param {String} email - The email of the user to remove.
   */
  $scope.deleteCollabEmail = (email) => {
    let permissionList = _.cloneDeep(
      $scope.myform.permissionList.filter(
        (user) => user.email.toLowerCase() !== email.toLowerCase(),
      ),
    )
    $scope.updateForm({ permissionList })
  }

  /**
   * Set the collab form's role. Called via the dropdown menu.
   * @param {Role} role - The selected role
   */
  $scope.selectRole = function (role) {
    $scope.collab.form.role = role
  }

  /**
   * Determine role of user based on permission level. This is used to display the role of the user on
   * the collaborators list. Admins will not be rendered using this function, they are hardcoded into the view
   * instead of determined by this function.
   * @param {Object} userObj - The user object to check
   * @param {Boolean} userObj.write - The write permissions of the user object
   */
  $scope.permissionsToRole = (userObj) => {
    if (userObj.write) {
      return ROLES.EDITOR
    } else {
      return ROLES.VIEWER
    }
  }

  /**
   * Determine permission level of a user based on role. This is used to create new user objects to be
   * added into the permission list.
   * @param {Role} role - The role to determine permissions for
   */
  $scope.roleToPermissions = (role) => {
    switch (role) {
      case ROLES.ADMIN:
      case ROLES.EDITOR:
        return { write: true }
      case ROLES.VIEWER:
        return { write: false }
      default:
        throw new Error('Invalid role!')
    }
  }

  /**
   * Update the form by adding the email that was filled in the input, with the permissions according to
   * the selected role (edit rights by default), into the permissionList.
   * Admins, the user themselves, and users already in the permissionList cannot be added to the form.
   */
  $scope.saveCollabEmail = () => {
    console.info($scope.collab.form)
    let email = $scope.collab.form.email.toLowerCase()
    let permissions = $scope.roleToPermissions($scope.collab.form.role)

    // Not allowed to add oneself or existing collaborator/admin as collaborator
    if (
      email === $scope.user.email.toLowerCase() ||
      $scope.myform.permissionList.find(
        (user) => user.email.toLowerCase() === email,
      ) ||
      email === $scope.myform.admin.email
    ) {
      $scope.isAlreadyCollabError = true
      $timeout(() => {
        $scope.isAlreadyCollabError = false
      }, 3000)
    } else {
      // Allowed to add collaborator

      // Deep copy form to use
      let permissionList = [
        {
          email,
          ...permissions,
        },
      ].concat(_.cloneDeep($scope.myform.permissionList))

      $scope.btnStatus = 2 // pressed; loading
      $scope.hasEmailError = false
      $scope.isAlreadyCollabError = false
      $timeout(() => {
        $scope.updateForm({ permissionList }).then((err) => {
          if (err) {
            // If error, second timeout to make error disappear
            $scope.hasEmailError = true

            // Make the alert message correspond to the error code
            if (err.status === HttpStatus.BAD_REQUEST) {
              $scope.alertMessage = 'Outdated admin page, please refresh'
            } else if (err.status === HttpStatus.UNPROCESSABLE_ENTITY) {
              $scope.alertMessage = `${email} is not part of a whitelisted agency`
            } else {
              $scope.alertMessage = 'Error adding collaborator'
            }

            resetCollabForm()
            $timeout(() => {
              $scope.hasEmailError = false
              $scope.alertMessage = ''
            }, 3000)
          } else {
            // If no error, clear email input
            $scope.btnStatus = 3 // pressed; saved
            $scope.hasEmailError = false
            $scope.closeEditCollaboratorDropdowns()
            $timeout(() => {
              resetCollabForm()
            }, 1000)
          }
        })
      }, 1000)
    }
    /**
     * Clear the input, set the button to its unpressed state, and set the to-be-added collaborator's role to editor.
     */
    function resetCollabForm() {
      $scope.btnStatus = 1 // unpressed
      $scope.collab.form.email = ''
      $scope.collab.form.role = ROLES.EDITOR
    }
  }

  /**
   *  Handle modal close click
   */
  $scope.closeModal = () => {
    angular.element('body').removeClass('mobile-scroll-lock')
    $uibModalInstance.close('cancel')
  }

  $scope.toggleTransferOwnershipModal = () => {
    $scope.isOwnershipTransferModalShown = !$scope.isOwnershipTransferModalShown
  }

  /* State management for the edit collaborator dropdowns */

  // collaboratorDropdownsOpen, toggleScrollLock and closeEditCollaboratorDropdowns is used due to a bug with uib-dropdown's toggle-open with
  // multiple dropdowns: https://github.com/angular-ui/bootstrap/issues/6316 . If our dropdown library
  // was not buggy, the following code would not be necessary.

  /**
   * Activates scroll-lock when there is any dropdown open. The function is used as a dropdown event listener;
   * when an edit collaborator dropdown is opened, it calls this function with isOpen === true, and when one is closed,
   * it is called with isOpen === false.
   * @param {Boolean} isOpen - True if the dropdown is being opened, false if it is being closed
   * @param {Number} index - The index of the dropdown being opened/closed
   */
  $scope.toggleScrollLock = (isOpen, index) => {
    // First, handle the dropdown event by updating the state accordingly.
    $scope.collaboratorDropdownsOpen = $scope.collaboratorDropdownsOpen.map(
      (state, idx) => {
        // When opening a dropdown, close everything else
        if (isOpen) {
          return index === idx
          // When closing a dropdown, close only the dropdown that is actually being closed, the rest should be left as they are.
          // This is because if you click a new dropdown while a previous dropdown is opened, you will call the "onOpen" of the new one,
          // and immediately call the "onClose" of the previous dropdown, and we don't want to automatically close the new one.
        } else {
          return index === idx ? false : state
        }
      },
    )
    // Lock the scroll if any of the edit collaborator dropdowns are open
    $scope.lockCollaboratorScroll = $scope.collaboratorDropdownsOpen.find(
      (state) => state === true,
    )
  }

  /**
   * Sets the state of all collaborator dropdowns to closed, and unlocks the collaborator modal scroll locks.
   */
  $scope.closeEditCollaboratorDropdowns = () => {
    $scope.collaboratorDropdownsOpen = $scope.collaboratorDropdownsOpen.map(
      (_state) => false,
    )
    $scope.lockCollaboratorScroll = false
  }

  $scope.resetMessages = () => {
    $scope.isDisplayTransferSuccessMessage = false
    $scope.isDisplayTransferFailedMessage = false
    $scope.transferErrorMessage = undefined
  }

  $scope.handleTransferOwnerButtonClick = () => {
    const email = $scope.collab.form.email.toLowerCase()
    $scope.transferOwnerEmail = email
    $scope.toggleTransferOwnerModal()
  }

  $scope.handleUpdateRoleToOwner = (index) => {
    const email = $scope.myform.permissionList[index].email
    $scope.transferOwnerEmail = email
    $scope.toggleTransferOwnerModal()
    $scope.collaboratorDropdownsOpen[index] = false
  }

  $scope.toggleTransferOwnerModal = () => {
    $scope.isDisplayTransferOwnerModal = !$scope.isDisplayTransferOwnerModal
  }
}
