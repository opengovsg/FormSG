'use strict'

const { get } = require('lodash')
const Form = require('../viewmodels/Form.class')

// Forms service used for communicating with the forms REST endpoints
angular
  .module('forms')
  .factory('FormApi', ['$resource', 'FormErrorService', 'FormFields', FormApi])

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
function FormApi($resource, FormErrorService, FormFields) {
  /**
   * Used to generate interceptors for all API calls. These interceptors have the
   * following responsibilities:
   * 1) Stripping MyInfo data when saving forms to the database.
   * 2) Injecting MyInfo data when forms are received from the database.
   * 3) Converting plain form objects to smart Form class instances before returning
   * them to controllers.
   * 4) Redirecting users using FormErrorService if redirectOnError is true.
   * @param {boolean} redirectOnError Whether to use FormErrorService to redirect
   * to errorTargetState when an error is encountered.
   * @param {string} [errorTargetState] If redirectOnError is true, this is the
   * redirect state which will be passed to FormErrorService
   */
  const getInterceptor = (redirectOnError, errorTargetState) => {
    const interceptor = {
      request: (config) => {
        if (get(config, 'data.form')) {
          FormFields.removeMyInfoFromForm(config.data.form)
        }
        return config
      },
      response: (response) => {
        // The backend returns different shapes for different request types. For GET
        // requests, it returns a $resource instance with a form attribute containing
        // all the form data; for PUT requests, it returns a $resource instance with
        // all the form data at the top level. We need to ensure that the postprocessing
        // is done in both cases.
        if (get(response, 'resource.form.form_fields')) {
          FormFields.injectMyInfoIntoForm(response.resource.form)
          // Convert plain form object to smart Form instance
          response.resource.form = new Form(response.resource.form)
        } else if (get(response, 'resource.form_fields')) {
          FormFields.injectMyInfoIntoForm(response.resource)
          response.resource = new Form(response.resource)
        }
        return response.resource
      },
    }
    if (redirectOnError) {
      interceptor.responseError = (response) => {
        return FormErrorService.redirect({
          response,
          targetState: errorTargetState,
          targetFormId: extractFormId(get(response, 'config.url')),
        })
      }
    }
    return interceptor
  }

  // accessMode is either adminForm or publicForm
  let resourceUrl = '/:formId/:accessMode'
  const V3_PUBLICFORM_URL = '/api/v3/forms/:formId'

  return $resource(
    resourceUrl,
    // default to admin for access mode, since that applies to most methods
    { accessMode: 'adminform' },
    {
      query: {
        method: 'GET',
        isArray: true,
        headers: { 'If-Modified-Since': '0' },
        interceptor: getInterceptor(true, 'listForms'),
        // disable IE ajax request caching (so new forms show on dashboard)
      },
      getAdmin: {
        method: 'GET',
        headers: { 'If-Modified-Since': '0' },
        interceptor: getInterceptor(true, 'viewForm'),
        // disable IE ajax request caching (so new fields show on build panel)
      },
      getPublic: {
        url: V3_PUBLICFORM_URL,
        method: 'GET',
        // disable IE ajax request caching (so new fields show on build panel)
        headers: { 'If-Modified-Since': '0' },
        interceptor: getInterceptor(true),
      },
      update: {
        method: 'PUT',
        interceptor: getInterceptor(false),
      },
      save: {
        method: 'POST',
        interceptor: getInterceptor(false),
      },
      // create is called without formId, so the endpoint is just /adminform
      create: {
        method: 'POST',
        interceptor: getInterceptor(true, 'listForms'),
      },
      // Used for viewing templates with use-template or examples listing. Any logged in officer is authorized.
      template: {
        url: resourceUrl + '/template',
        method: 'GET',
        interceptor: getInterceptor(true, 'templateForm'),
      },
      // Used for previewing the form from the form admin page. Must be a viewer, collaborator or admin.
      preview: {
        url: resourceUrl + '/preview',
        method: 'GET',
        interceptor: getInterceptor(true, 'previewForm'),
      },
      useTemplate: {
        url: resourceUrl + '/copy',
        method: 'POST',
        interceptor: getInterceptor(true, 'useTemplate'),
      },
      transferOwner: {
        url: resourceUrl + '/transfer-owner',
        method: 'POST',
        interceptor: getInterceptor(false),
      },
    },
  )
}
