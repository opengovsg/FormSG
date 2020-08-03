const FileSaver = require('file-saver')
const fixParamsToUrl = function (dict, url) {
  Object.keys(dict).forEach(function (key) {
    url = url.replace(':' + key, dict[key])
  })
  return url
}

/**
 * Triggers a file download to disk.
 * @param {Blob} The file contents
 * @param {String} The filename
 */
const triggerFileDownload = function (blob, filename) {
  FileSaver.saveAs(blob, filename)
}

module.exports = {
  fixParamsToUrl,
  triggerFileDownload,
}
