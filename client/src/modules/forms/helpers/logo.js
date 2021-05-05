const get = require('lodash/get')

const { FormLogoState } = require('shared/types/form')

/**
 * Function used to decide how to obtain the form logo.
 * @param {Object} myform form object
 * @returns {String} Form logo URL
 */
function getFormLogo(myform) {
  const logo = get(myform, 'startPage.logo', null)
  if (logo) {
    switch (logo.state) {
      case FormLogoState.None:
        return ''
      case FormLogoState.Default:
        return myform.admin.agency.logo
      case FormLogoState.Custom:
        if (logo.fileId) {
          return `${window.logoBucketUrl}/${logo.fileId}`
        } else {
          // Occurs when custom radio button is selected, but logo is not uploaded yet
          return ''
        }
      default:
        console.error(
          `logo is in an invalid state. Only NONE, DEFAULT and CUSTOM are allowed but state is ${logo.state} for form ${myform._id}`,
        )
    }
  } else {
    return myform.admin.agency.logo
  }
}

module.exports = {
  getFormLogo,
}
