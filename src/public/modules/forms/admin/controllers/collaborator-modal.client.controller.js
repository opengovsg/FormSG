'use strict'

const { get } = require('lodash')
const { StatusCodes } = require('http-status-codes')
const UpdateFormService = require('../../../../services/UpdateFormService')

angular
  .module('forms')
  .controller('CollaboratorModalController', [
    '$q',
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
  $q,
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
  $scope.btnStatus = 1

  // Stores the open/close state of every collaborator dropdown - this is an array of booleans,
  // where each index is bound to the is-open attribute of the corresponding edit collaborator
  // dropdown menu.
  $scope.collaboratorDropdownsOpen = []

  // This is used to prevent scrolling when an edit collaborator dropdown is opened, because
  // the dropdown is appended to the html body, and will not follow the dropdown button if
  // the user scrolls the page while open.
  $scope.lockCollaboratorScroll = false

  $scope.isDisplayTransferOwnerModal = false
  $scope.transferOwnerEmail = undefined

  /**
   * Transfers ownership of the form to the selected user, reset UI messages
   */
  $scope.transferOwner = () => {
    if ($scope.transferOwnerEmail === $scope.myform.admin.email) {
      Toastr.error('You are already the owner of this form')
      $scope.isDisplayTransferOwnerModal = false
      return
    }

    $q.when(FormApi.transferOwner($scope.myform._id, $scope.transferOwnerEmail))
      .then((res) => {
        $scope.myform = res.form
        externalScope.refreshFormDataFromCollab($scope.myform)
        Toastr.success('Form ownership transferred. You are now an Editor.')
      })
      .catch((err) => {
        Toastr.error(err.response.data.message)
        return
      })
      .finally(() => {
        $scope.isDisplayTransferOwnerModal = false
      })
  }

  /**
   * Calls AdminFormService to update the permission list (collaborators) of a form
   * @param {Array} permissionList - New permission list for the form
   */
  $scope.updatePermissionList = (permissionList) => {
    return $q
      .when(
        UpdateFormService.updateCollaborators(
          $scope.myform._id,
          permissionList,
        ),
      )
      .then((updatedCollaborators) => {
        $scope.myform.permissionList = updatedCollaborators
        externalScope.refreshFormDataFromCollab($scope.myform)
      })
  }

  /**
   * Update the role of an existing user in the permissionList.
   * Called via an edit collaborator dropdown menu.
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
      $scope.updatePermissionList(permissionList).catch((err) => {
        // NOTE: Refer to https://axios-http.com/docs/handling_errors
        // Axios errors are wrapped in 2 layers of indirection, which means the actual message on the error has to be extracted manually
        Toastr.error(
          get(
            err,
            'response.data.message',
            'Sorry, an error occurred. Please refresh the page and try again later.',
          ),
        )
        return err
      })
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
    $scope.updatePermissionList(permissionList).catch((err) => {
      // NOTE: Refer to https://axios-http.com/docs/handling_errors
      // Axios errors are wrapped in 2 layers of indirection, which means the actual message on the error has to be extracted manually
      Toastr.error(
        get(
          err,
          'response.data.message',
          'Sorry, an error occurred. Please refresh the page and try again later.',
        ),
      )
      return err
    })
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
   * the collaborators list. Admins will not be rendered using this function,
   * they are hardcoded into the view instead of determined by this function.
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
      Toastr.error('This user is an existing collaborator. Edit role below.')
      return
    }

    /**
     * Clear the input, set the button to its unpressed state,
     * and set the to-be-added collaborator's role to editor.
     */
    function resetCollabForm() {
      $scope.btnStatus = 1 // unpressed
      $scope.collab.form.email = ''
      $scope.collab.form.role = ROLES.EDITOR
    }
    // Allowed to add collaborator
    // Deep copy form to use
    let permissionList = [{ email, ...permissions }].concat(
      _.cloneDeep($scope.myform.permissionList),
    )

    $scope.btnStatus = 2 // pressed; loading
    $scope
      .updatePermissionList(permissionList)
      .then(() => {
        // If no error, clear email input
        $scope.btnStatus = 3 // pressed; saved
        $scope.closeEditCollaboratorDropdowns()

        $timeout(() => {
          resetCollabForm()
        }, 1000)
      })
      .catch((err) => {
        // Make the alert message correspond to the error code
        if (err.response.status === StatusCodes.BAD_REQUEST) {
          Toastr.error(
            'Please ensure that the email entered is a valid government email. If the error still persists, refresh and try again later.',
          )
        } else if (err.response.status === StatusCodes.UNPROCESSABLE_ENTITY) {
          Toastr.error(`${email} is not part of a whitelisted agency.`)
        } else {
          Toastr.error('Error adding collaborator.')
        }
        resetCollabForm()
      })
  }

  /**
   *  Handle modal close
   */
  $scope.closeModal = () => {
    angular.element('body').removeClass('mobile-scroll-lock')
    $uibModalInstance.close('cancel')
  }

  /**
   *  Toggle transfer ownership confirmation view
   */
  $scope.toggleTransferOwnerModal = () => {
    $scope.isDisplayTransferOwnerModal = !$scope.isDisplayTransferOwnerModal
  }

  /**
   * Sets the state of all collaborator dropdowns to closed,
   * and unlocks the collaborator modal scroll locks.
   */
  $scope.closeEditCollaboratorDropdowns = () => {
    $scope.collaboratorDropdownsOpen = $scope.collaboratorDropdownsOpen.map(
      (_state) => false,
    )
    $scope.lockCollaboratorScroll = false
  }

  /**
   *  Display transfer ownership verification view
   */
  $scope.handleTransferOwnerButtonClick = () => {
    const email = $scope.collab.form.email.toLowerCase()
    $scope.transferOwnerEmail = email
    $scope.toggleTransferOwnerModal()
  }

  /**
   *  Display transfer ownership verification view
   */
  $scope.handleUpdateRoleToOwner = (index) => {
    const email = $scope.myform.permissionList[index].email
    $scope.transferOwnerEmail = email
    $scope.toggleTransferOwnerModal()
    $scope.collaboratorDropdownsOpen[index] = false
  }

  /* State management for the edit collaborator dropdowns */

  // collaboratorDropdownsOpen, toggleScrollLock and closeEditCollaboratorDropdowns are used due
  // to a bug with uib-dropdown's toggle-open with multiple dropdowns:
  // https://github.com/angular-ui/bootstrap/issues/6316 .

  /**
   * Activates scroll-lock when there is any dropdown open. The function is used as a dropdown
   * event listener; when an edit collaborator dropdown is opened, it calls this function with
   * isOpen === true, and when one is closed, it is called with isOpen === false.
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
          // When closing a dropdown, close only the dropdown that is actually being closed,
          // the rest should be left as they are. This is because if you click a new dropdown
          // while a previous dropdown is opened, you will call the "onOpen" of the new one,
          // and immediately call the "onClose" of the previous dropdown, and we don't want
          // to automatically close the new one.
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
}
