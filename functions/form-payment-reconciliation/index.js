const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')
const { generateLinkToCloudwatch, postToSlack } = require('./utils')

const AWS_REGION = 'ap-southeast-1'

const PARAMETER_STORE_NAME = 'staging-cron-payment'

const SUB_DOMAIN = process.env.ENV_SITE_SUBDOMAIN || 'staging.'

/** TODO: migrate to separate file */
function getSecrets() {
  const awsSsmClient = new SSMClient({ region: AWS_REGION })
  const input = {
    Name: PARAMETER_STORE_NAME,
    WithDecryption: true,
  }
  const command = new GetParameterCommand(input)
  return awsSsmClient
    .send(command)
    .then((d) => d.Parameter.Value)
    .then((d) => {
      const dn = d.split('\n')
      return dn.reduce((accum, line) => {
        const [key, value] = line.split('=')
        accum[key] = value
        return accum
      }, {})
    })
}

const getPendingQueries = (apiSecret) => {
  return fetch(
    `https://${SUB_DOMAIN}form.gov.sg/api/v3/payments/pendingPayments`,
    {
      headers: {
        'x-cron-payment-secret': apiSecret,
      },
    },
  ).then((d) => d.json())
}

const reconcileAccount = (apiSecret, stripeAccountId) => {
  return fetch(
    `https://${SUB_DOMAIN}form.gov.sg/api/v3/payments/reconcileAccount`,
    {
      method: 'POST',
      headers: {
        'x-cron-payment-secret': apiSecret,
      },
      body: { stripeAccountId },
    },
  ).then((d) => d.json())
}

async function main(events, context) {
  const secret = await getSecrets()

  const pendingQueries = await getPendingQueries(
    secret['CRON_PAYMENT_API_SECRET'],
  )
  console.log(secret)

  if (pendingQueries.length <= 0) {
    console.log(
      'Exiting. No pending queries. Query length:',
      pendingQueries.data.length,
    )
    return
  }

  console.log('Pending Queries Report')
  console.log(JSON.stringify(pendingQueries, null, 2))

  const firstAccountToProcess =
    pendingQueries.data[pendingQueries.data.length - 1].stripeAccount
  if (!firstAccountToProcess) {
    console.log('Exiting. Invalid stripeAccount:', firstAccountToProcess)
    return
  }

  const startTime = Date.now()
  const reconcileResult = await reconcileAccount(
    secret['CRON_PAYMENT_API_SECRET'],
    firstAccountToProcess,
  )
  const reconciledStr = JSON.stringify(reconcileResult, null, 2)
  const report = [
    'Reconcile Report',
    reconciledStr,
    'Reconcile took(ms): ' + (Date.now() - startTime),
    'Lambda Invocation Id: ' + JSON.stringify(context),
    'Details: ' + generateLinkToCloudwatch(context),
  ].join('\n')

  console.log(report)

  await postToSlack(secret['SLACK_API_SECRET'], report).then((d) =>
    console.log(d),
  )
}

if (require.main === module) {
  main()
}
exports.handler = main
