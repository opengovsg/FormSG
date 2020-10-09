/* LOAD LIBRARIES */

const fc = require('filecompare')
const Promise = require('bluebird')
const formIdsToCheck = require('./formIdsToCheck.js')

/* DEFINE HELPER FUNCTIONS */

const compareScreenshotsBetween = (formIds, beforePrefix, afterPrefix) => {
  return Promise.map(
    formIds,
    async (formId) => {
      return new Promise((resolve) => {
        fc(
          `./screenshots/${beforePrefix}/${formId}.jpg`,
          `./screenshots/${afterPrefix}/${formId}.jpg`,
          (isEqual) => {
            if (isEqual) {
              resolve(`formId=${formId} Images are equal`)
            } else {
              resolve(`formId=${formId} Images for form are not equal`)
            }
          },
        )
      })
    },
    {
      concurrency: 5,
    },
  )
}

;(async () => {
  const BEFORE = '2019-12-10-06-40' // Edit to be name of folder containing screenshots taken before script
  const AFTER = '2019-12-10-06-42' // Edit to be name of folder containing screenshots taken after script
  console.info(`Comparing ${BEFORE} to ${AFTER}`)
  // Run script
  await compareScreenshotsBetween(
    formIdsToCheck,
    BEFORE,
    AFTER,
  ).each((result) => console.info(result))
})()
