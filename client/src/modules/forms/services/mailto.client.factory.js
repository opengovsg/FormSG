const dedent = require('dedent-js')

angular.module('forms').factory('MailTo', ['$window', '$translate', MailTo])

function MailTo($window, $translate) {
  /**
   * Generates a mailto URI which opens the client's default email application
   * with an email to share their secret key. This requires the form title and
   * secret key at minimum, and optionally the form ID.
   * @param {string} title
   * @param {string} secretKey
   * @param {string} [formId]
   * @return {Promise<string>}
   */
  const generateMailToUri = (title, secretKey, formId) => {
    return $translate(['LINKS.APP.ROOT']).then((translations) => {
      const appUrl = translations['LINKS.APP.ROOT']
      // Construct body piece by piece to avoid confusion with order of operations
      let body = dedent`
        Dear collaborator,

        I am sharing my form's secret key with you for safekeeping and backup. This is an important key that is needed to access all form responses.

        Form title: ${title}`
      if (formId) {
        // Note the newline at the start
        body += dedent`

        Form URL: ${appUrl}/${formId}`
      }
      // Note the newline at the start
      body += dedent`

        Secret key: ${secretKey}

        All you need to do is keep this email as a record, and please do not share this key with anyone else.

        Thank you for helping to safekeep my form!`
      return (
        'mailto:?subject=' +
        $window.encodeURIComponent(`Shared Secret Key for ${title}`) +
        '&body=' +
        $window.encodeURIComponent(body)
      )
    })
  }
  return { generateMailToUri }
}
