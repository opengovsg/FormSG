const get = require('lodash/get')

const { FormLogoState } = require('../../../../types')

/**
 * Function used to decide how to obtain the form logo.
 * TODO: Delete this once we have migrated off customLogo on Feb 14, 2020.
 * @param {Object} myform form object
 * @returns {String} Form logo URL
 */
function getFormLogo(myform) {
  // Always check for existence of logo key before checking old keys
  // hasheader is an older key than customLogo and hence takes precedence
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
        } else if (logo.oldCustomLogo) {
          // Account for case where custom radio button is pre-filled based on customLogo, but logo not uploaded yet
          // logo.oldCustomLogo will not be saved to db, so submit/preview form pages will not be affected
          return logo.oldCustomLogo
        } else {
          // Occurs when custom radio button is selected, but logo is not uploaded yet
          return ''
        }
      default:
        console.error(
          `logo is in an invalid state. Only NONE, DEFAULT and CUSTOM are allowed but state is ${logo.state} for form ${myform._id}`,
        )
    }
  } else if (myform.hasheader === false) {
    return ''
  } else if (myform.customLogo !== undefined) {
    // case A: ''
    // case B: non-empty url
    return myform.customLogo
  } else {
    return myform.admin.agency.logo
  }
}

module.exports = {
  getFormLogo,
}
