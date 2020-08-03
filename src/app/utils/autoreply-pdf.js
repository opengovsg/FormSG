const puppeteer = require('puppeteer-core')
const moment = require('moment-timezone')

const config = require('../../config/config')
const logger = require('../../config/logger').createLoggerWithLabel('autoreply')
const { renderPromise } = require('../utils/render-promise')

/**
 * The data required to template an autoreply email
 * @typedef {Object} autoReplyDataObject
 * @param {String} refNo Submission ID
 * @param {String} formTitle Title of the form
 * @param {Date} submissionTime Timestamp of of submission
 * @param {Object[]} formData Array of objects representing question-answer pairs
 * @param {String[]} formData[].answerTemplate Array of answers.
 * Most fields contain only one answer element, but table-style questions
 * and checkboxes may generate additional rows.
 * @param {String} formData[].question The question on the form
 * @param {String} formUrl The URL of the form that was filled in
 */

/**
 * Returns a data object for templating autoreply emails
 * @param {Object} form Form object
 * @param {Object} submission Submissions object
 * @param {*} autoReplyData auto-reply data
 * @param {String} urlOrigin Domain of request
 * @returns {autoReplyDataObject}
 */
function parseAutoReplyData(form, submission, autoReplyData, urlOrigin) {
  return {
    refNo: submission.id,
    formTitle: form.title,
    submissionTime: moment(submission.created)
      .tz('Asia/Singapore')
      .format('ddd, DD MMM YYYY hh:mm:ss A'),
    formData: autoReplyData,
    formUrl: `${urlOrigin}/${form._id}`,
  }
}

/**
 * Generate response.pdf for auto-reply emails
 * @param {autoReplyDataObject} renderData Data object created by parseAutoReplyData function
 * @param {Express.Response} res The Express response object used for templating the HTML page.
 * @return {Promise<Buffer>} Promise with PDF Buffer object
 */
async function generateAutoReplyPdf({ renderData, res }) {
  let summaryHTML
  try {
    summaryHTML = await renderPromise(
      res,
      'templates/submit-form-summary-pdf',
      renderData,
    )
  } catch (err) {
    logger.warn('Unable to create submit form summary:\t', err)
    return Promise.reject(err)
  }
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      headless: true,
      executablePath: config.chromiumBin,
    })
    const page = await browser.newPage()
    await page.setContent(summaryHTML, {
      waitUntil: 'networkidle0',
    })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '40px',
      },
    })
    await browser.close()
    return pdfBuffer
  } catch (err) {
    logger.error(`PDF error with Puppeteer:\t, ${err}`)
    return Promise.reject(err)
  }
}

module.exports = {
  generateAutoReplyPdf,
  parseAutoReplyData,
}
