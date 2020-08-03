/**
 * Calls app.render in Promise form. Useful for rendering HTML email templates.
 * @param {Object} res Express response object
 * @param {string} templatePath Path to template relative to src/app/views
 * @param {Object} renderData Parameters to render in the template
 */
const renderPromise = (res, templatePath, renderData) => {
  return new Promise((resolve, reject) => {
    res.app.render(templatePath, renderData, (err, html) => {
      if (err) {
        return reject(err)
      }
      return resolve(html)
    })
  })
}

module.exports = { renderPromise }
