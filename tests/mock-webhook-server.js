const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const formsgSdkPackage = require('@opengovsg/formsg-sdk')
const { getDownloadsFolder } = require('./end-to-end/helpers/util')

const WEBHOOK_PORT = process.env.MOCK_WEBHOOK_PORT
const WEBHOOK_CONFIG_FILE = process.env.MOCK_WEBHOOK_CONFIG_FILE

// Configure formsg sdk
const formsgSdk = formsgSdkPackage({
  webhookSecretKey: process.env.SIGNING_SECRET_KEY,
  mode: 'test',
  verificationOptions: {
    secretKey: process.env.VERIFICATION_SECRET_KEY,
    transactionExpiry: 14400, // 4 hours
  },
})

// Create app
const app = express()
app.use(bodyParser.json())

// Declare post route
app.post('/', async (req, res) => {
  // Fetch webhook configuration
  const config = fs.readFileSync(
    `${getDownloadsFolder()}/${WEBHOOK_CONFIG_FILE}`,
    'utf8',
  )
  const formTitle = config.split(',')[0]
  const postUri = config.split(',')[1]
  const secretKey = fs.readFileSync(
    `${getDownloadsFolder()}/Form Secret Key - ${decodeURI(formTitle)}.txt`,
    'utf8',
  )
  // Verify Signature
  try {
    formsgSdk.webhooks.authenticate(req.get('X-FormSG-Signature'), postUri)
  } catch (e) {
    return res.status(401).send({ message: 'Unauthorized' })
  }
  // Decrypt submission body
  try {
    const data = formsgSdk.crypto.decrypt(secretKey, req.body.data)
    return res.status(200).send(data)
  } catch (e) {
    return res.status(500).send({ message: 'Decryption failed' })
  }
})

app.listen(WEBHOOK_PORT, () =>
  console.info(`Webhook mock server running on port ${WEBHOOK_PORT}`),
)
