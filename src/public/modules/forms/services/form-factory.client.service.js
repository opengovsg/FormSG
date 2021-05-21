angular.module('forms').service('FormFactory', ['FormApi', FormFactory])

function FormFactory(FormApi) {
  this.generateForm = generateForm

  /**
   * Creates a new form from one of three options
   * @param {string} mode One of 'create', 'duplicate', 'useTemplate'
   * @param {Object} params Parameters for the form object. This can be any valid
   * parameter in the backend Form model
   * @param {string} [formId] Form ID for duplication an admin's existing form,
   * or using the template of another form
   * when responseMode is 'encrypt'
   */
  function generateForm(mode, params, formId) {
    switch (mode) {
      case 'create':
        return FormApi.create({ form: params })
      case 'duplicate':
        return FormApi.save(formId, params)
      case 'useTemplate':
        return FormApi.useTemplate(formId, params)
      default:
        throw new Error('Unsupported mode of form generation.')
    }
  }
}
