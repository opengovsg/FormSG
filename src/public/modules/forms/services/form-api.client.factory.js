'use strict'
const { get } = require('lodash')
const Form = require('../viewmodels/Form.class')
const FormService = require('../../../services/FormService')
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
  const handleInput = (input) => {
    if (get(input, 'form')) {
      FormFields.removeMyInfoFromForm(input)
    }
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
  const handleResponse = (data) => {
    // The backend returns different shapes for different request types. For GET
    // requests, it returns a $resource instance with a form attribute containing
    // all the form data; for PUT requests, it returns a $resource instance with
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

  const generateService = (service, errorParams, ...inputs) => {
    return service(...inputs.map((input) => handleInput(input)))
      .then((data) => {
        return handleResponse(data)
      })
      .catch((err) => handleError(err, errorParams))
  }

  return {
    query: () =>
      generateService(FormService.queryForm, {
        redirectOnError: true,
        errorTargetState: 'listForms',
      }),
    getAdmin: (formId) =>
      generateService(
        FormService.getAdminForm,
        { redirectOnError: true, errorTargetState: 'viewForm' },
        formId,
      ),
    getPublic: (formId) =>
      generateService(
        FormService.getPublicForm,
        { redirectOnError: true },
        formId,
      ),
    update: (formId, update) =>
      generateService(
        FormService.updateForm,
        { redirectOnError: false },
        formId,
        update,
      ),
    save: (formId, formToSave) =>
      generateService(
        FormService.saveForm,
        { redirectOnError: false },
        formId,
        formToSave,
      ),
    delete: (formId) =>
      generateService(
        FormService.deleteForm,
        { redirectOnError: false },
        formId,
      ),
    create: (newForm) =>
      generateService(
        FormService.createForm,
        { redirectOnError: true, errorTargetState: 'listForms' },
        newForm,
      ),
    template: (formId) =>
      generateService(
        FormService.queryTemplate,
        { redirectOnError: true, errorTargetState: 'templateForm' },
        formId,
      ),
    preview: (formId) =>
      generateService(
        FormService.previewForm,
        { redirectOnError: true, errorTargetState: 'previewForm' },
        formId,
      ),
    useTemplate: (formId) =>
      generateService(
        FormService.useTemplate,
        { redirectOnError: true, errorTargetState: 'useTemplate' },
        formId,
      ),
    transferOwner: (formId, newOwner) =>
      generateService(
        FormService.transferOwner,
        { redirectOnError: false },
        formId,
        newOwner,
      ),
  }
}
