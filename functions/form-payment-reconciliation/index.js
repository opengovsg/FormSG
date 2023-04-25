const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')

const AWS_REGION = 'ap-southeast-1'

const PARAMETER_STORE_NAME = 'staging-cron-payment'

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
      // TODO: handle mulit-line values
      const [key, value] = d.split('=')
      return { [key]: [value] }
    })
}

const getPendingQueries = (apiSecret) => {
  return fetch('https://staging.form.gov.sg/api/v3/payments/pendingPayments', {
    headers: {
      'x-cron-payment-secret': apiSecret,
    },
  }).then((d) => d.json())
}

const reconcileAccount = (apiSecret, stripeAccountId) => {
  return fetch('https://staging.form.gov.sg/api/v3/payments/reconcileAccount', {
    method: 'POST',
    headers: {
      'x-cron-payment-secret': apiSecret,
    },
    body: { stripeAccountId },
  }).then((d) => d.json())
}

async function main() {
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

  const firstAccountToProcess = pendingQueries.data[0].stripeAccount
  if (firstAccountToProcess) {
    console.log('Exiting. Invalid stripeAccount:', firstAccountToProcess)
    return
  }

  const startTime = Date.now()
  const reconcileResult = await reconcileAccount(
    secret['CRON_PAYMENT_API_SECRET'],
    firstAccountToProcess,
  )
  console.log('Reconcile Report')
  console.log(JSON.stringify(reconcileResult, null, 2))
  console.log('Reconcile took(ms):', Date.now() - startTime)
}

if (require.main === module) {
  main()
}
exports.handler = main
