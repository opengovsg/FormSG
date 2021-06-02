'use strict'
const { get } = require('lodash')
const Form = require('../viewmodels/Form.class')
const CreateFormService = require('../../../services/CreateFormService')
const UpdateFormService = require('../../../services/UpdateFormService')
const ExamplesService = require('../../../services/ExamplesService')
const AdminViewFormService = require('../../../services/AdminViewFormService')
const PublicFormService = require('../../../services/PublicFormService')

// Forms service used for communicating with the forms REST endpoints
angular
  .module('forms')
  .factory('FormApi', ['FormErrorService', 'FormFields', FormApi])

// Helper function for getting formID from path starting with /:formId/.
// If form ID is not found, returns an empty string.
const extractFormId = (path) => {
  if (!path) {
    return ''
  }
  const formId = path.substring(1, 25)
  if (formId.length !== 24) {
    return ''
  }
  return formId
}

/**
 * Service for making API calls to /:formId/:accessMode endpoint, which is used
 * for all CRUD operations for forms.
 */
function FormApi(FormErrorService, FormFields) {
  /**
   * Handles data passed into API calls. In charge of stripping of
   * MyInfo data when saving forms to the database.
   * @param {*} input API service data input
   * @returns Transformed input
   */
  const stripMyInfo = (input) => {
    FormFields.removeMyInfoFromForm(input)
    return input
  }

  /**
   * Handles data returned from API calls. Responsibilities include:
   * 1) Injecting MyInfo data when forms are received from the database.
   * 2) Converting plain form objects to smart Form class instances before returning
   * them to controllers.
   * @param {*} data Data returned from API call
   * @returns Transformed data
   */
  const injectMyInfo = (data) => {
    // The backend returns different shapes for different request types. For GET
    // requests, it returns an object with a form attribute containing
    // all the form data; for PUT requests, it returns an object with
    // all the form data at the top level. We need to ensure that the postprocessing
    // is done in both cases.
    if (get(data, 'form.form_fields')) {
      FormFields.injectMyInfoIntoForm(data.form)
      // Convert plain form object to smart Form instance
      data.form = new Form(data.form)
    } else if (get(data, 'form_fields')) {
      FormFields.injectMyInfoIntoForm(data)
      data = new Form(data)
    }
    return data
  }

  /**
   * Handles error returned from API calls. In charge of redirecting users using FormErrorService
   * if redirectOnError is true.
   * @param {Error} err Error returned from API calls
   * @param {{redirectOnError: boolean, errorTargetState: string }} errorParams redirectOnError specifies
   * whether to use FormErrorService to redirect to errorTargetState when an error is encountered.
   * If redirectOnError is true, this is the redirect state which will be passed to FormErrorService
   */
  const handleError = (err, errorParams) => {
    const { redirectOnError, errorTargetState } = errorParams
    if (redirectOnError) {
      FormErrorService.redirect({
        response: err.response,
        targetState: errorTargetState,
        targetFormId: extractFormId(get(err.response, 'config.url')),
      })
    } else {
      throw err // just pass error on
    }
  }

  const generateService = (
    service,
    handleInput,
    handleResponse,
    errorParams,
    ...inputs
  ) => {
    const input = handleInput
      ? inputs.map((input) => handleInput(input))
      : inputs
    return service(...input)
      .then((data) => {
        return handleResponse ? handleResponse(data) : data
      })
      .catch((err) => handleError(err, errorParams))
  }

  return {
    getDashboardView: () =>
      generateService(AdminViewFormService.getDashboardView, null, null, {
        redirectOnError: true,
        errorTargetState: 'listForms',
      }),
    getAdminForm: (formId) =>
      generateService(
        AdminViewFormService.getAdminFormView,
        null,
        injectMyInfo,
        { redirectOnError: true, errorTargetState: 'viewForm' },
        formId,
      ),
    getPublicForm: (formId) =>
      generateService(
        PublicFormService.getPublicFormView,
        null,
        injectMyInfo,
        { redirectOnError: true },
        formId,
      ),
    updateForm: (formId, update) =>
      generateService(
        UpdateFormService.updateForm,
        stripMyInfo,
        injectMyInfo,
        { redirectOnError: false },
        formId,
        update,
      ),
    duplicateForm: (formId, duplicateFormBody) =>
      generateService(
        CreateFormService.duplicateForm,
        null,
        injectMyInfo,
        { redirectOnError: false },
        formId,
        duplicateFormBody,
      ),
    deleteForm: (formId) =>
      generateService(
        UpdateFormService.deleteForm,
        null,
        null,
        { redirectOnError: false },
        formId,
      ),
    createForm: (newForm) =>
      generateService(
        CreateFormService.createForm,
        stripMyInfo,
        injectMyInfo,
        { redirectOnError: true, errorTargetState: 'listForms' },
        newForm,
      ),
    queryTemplate: (formId) =>
      generateService(
        ExamplesService.queryTemplate,
        null,
        injectMyInfo,
        { redirectOnError: true, errorTargetState: 'templateForm' },
        formId,
      ),
    previewForm: (formId) =>
      generateService(
        AdminViewFormService.previewForm,
        null,
        injectMyInfo,
        { redirectOnError: true, errorTargetState: 'previewForm' },
        formId,
      ),
    useTemplate: (formId, overrideParams) =>
      generateService(
        ExamplesService.useTemplate,
        null,
        null,
        { redirectOnError: true, errorTargetState: 'useTemplate' },
        formId,
        overrideParams,
      ),
    transferOwner: (formId, newOwner) =>
      generateService(
        UpdateFormService.transferOwner,
        null,
        injectMyInfo,
        { redirectOnError: false },
        formId,
        newOwner,
      ),
  }
}
