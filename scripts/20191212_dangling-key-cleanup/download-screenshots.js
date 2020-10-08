/* LOAD LIBRARIES */
const flatten = require('flat')
const fs = require('fs')
const puppeteer = require('puppeteer')
const Promise = require('bluebird')
const formIdsToCheck = require('./formIdsToCheck.js')
const moment = require('moment')

/* LOAD ENVIROMENT VARIABLES */

const config = {
  appPath: process.env.APP_PATH,
}

/* ENSURE VARIABLES ARE DEFINED */

const flatConfig = flatten(config)
for (const key of Object.keys(flatConfig)) {
  if (
    flatConfig[key] === null ||
    flatConfig[key] === undefined ||
    flatConfig[key] === ''
  ) {
    throw new Error(`Environment variable: ${key} not defined!!!`)
  }
}

const downloadScreenshotsFor = (formIds, folder) => {
  return Promise.map(
    formIds,
    async (formId) => {
      let browser = await puppeteer.launch({ ignoreHTTPSErrors: true })
      let page = await browser.newPage()
      await page.goto(`${config.appPath}/#!/${formId}`)
      await page.waitFor(5000)
      await page.screenshot({
        path: `${folder}/${formId}.jpg`,
        type: 'jpeg',
        fullPage: true,
      })
      await page.close()
      await browser.close()
    },
    {
      concurrency: 5,
    },
  )
}

;(async () => {
  const timestamp = moment().format('YYYY-MM-DD-hh-mm')
  const SCREENSHOT_FOLDER = './screenshots'
  const SUB_FOLDER = `${SCREENSHOT_FOLDER}/${timestamp}`
  // Create folder for screenshots
  if (!fs.existsSync(SCREENSHOT_FOLDER)) {
    fs.mkdirSync(SCREENSHOT_FOLDER)
  }
  fs.mkdirSync(SUB_FOLDER)
  // Download screenshots
  console.info(
    `Downloading screenshots into ${SUB_FOLDER} for ${config.appPath}`,
  )
  await downloadScreenshotsFor(formIdsToCheck, SUB_FOLDER)
})()
