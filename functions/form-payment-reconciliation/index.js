const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')
const { generateLinkToCloudwatch, postToSlack } = require('./src/utils')

const AWS_REGION = 'ap-southeast-1'

const PARAMETER_STORE_NAME = 'staging-cron-payment'

const SUB_DOMAIN = process.env.ENV_SITE_SUBDOMAIN || 'staging.'

const KEY_VALUE_PAIR_REGEX = /^([^\s=]+)\s*=\s*(\S+)$/ // Make use of capture groups to obtain the key and value.

const API_AUTH_HEADER = 'x-formsg-cron-payment-secret'

/** TODO: migrate to separate file */
const getSecrets = () => {
  const awsSsmClient = new SSMClient({ region: AWS_REGION })
  const input = {
    Name: PARAMETER_STORE_NAME,
    WithDecryption: true,
  }
  const command = new GetParameterCommand(input)
  return awsSsmClient.send(command).then((res) => {
    const parametersAsString = res.Parameter.Value
    const parameters = parametersAsString
      .split(/[\r\n]+/)
      .map((line) => line.trim())
      .filter((line) => !!line) // Filter out empty lines
    return parameters.reduce((parameterMap, line) => {
      const match = line.match(KEY_VALUE_PAIR_REGEX)
      if (match && match.length === 3) parameterMap[match[1]] = match[2]
      return parameterMap
    }, {})
  })
}

const getPendingQueries = async (apiSecret) => {
  return fetch(
    `https://${SUB_DOMAIN}form.gov.sg/api/v3/payments/pendingPayments`,
    {
      headers: { [API_AUTH_HEADER]: apiSecret },
    },
  ).then((d) => d.json())
}

const reconcileAccount = async (apiSecret, stripeAccountId) => {
  return fetch(
    `https://${SUB_DOMAIN}form.gov.sg/api/v3/payments/reconcileAccount`,
    {
      method: 'POST',
      headers: { [API_AUTH_HEADER]: apiSecret },
      body: { stripeAccountId },
    },
  ).then((d) => d.json())
}

const reportToSlack = async ({
  env,
  title,
  reportContent,
  cloudwatchLink,
  timing,
  functionName,
}) => {
  const titleContentWithHeaderMrkdwn = `*${title}* for *${env}*`
  const reportContentWithCodeMrkdwn = '```' + reportContent + '```'
  const linkContentInHtml = `Detailed report on <${cloudwatchLink}|cloudwatch>`
  const runContent = `Run took(ms) ${timing}`
  const preparedTimeContent = `Report from \`${functionName}\` prepared on \`${new Date().toLocaleString(
    'en-SG',
  )} SGT\``
  const msgContent = [
    titleContentWithHeaderMrkdwn,
    `---`,
    '', // spacing
    reportContentWithCodeMrkdwn,
    linkContentInHtml,
    runContent,
    preparedTimeContent,
  ].join('\n')

  return postToSlack(secret['SLACK_API_SECRET'], msgContent).then((d) =>
    console.log(d),
  )
}

let secret
async function main(events, context) {
  const startTime = Date.now()
  secret = await getSecrets()

  const pendingQueries = await getPendingQueries(
    secret['CRON_PAYMENT_API_SECRET'],
  )

  if (pendingQueries.length <= 0) {
    console.log(
      'Exiting. No pending queries. Query length:',
      pendingQueries.data.length,
    )
    return
  }

  console.log(
    'Pending Queries Report' + '\n' + JSON.stringify(pendingQueries, null, 2),
  )

  const firstAccountToProcess =
    pendingQueries.data[pendingQueries.data.length - 1].stripeAccount
  if (!firstAccountToProcess) {
    console.log('Exiting. Invalid stripeAccount:', firstAccountToProcess)
    return
  }

  const reconcileStartTime = Date.now()
  const reconcileResult = await reconcileAccount(
    secret['CRON_PAYMENT_API_SECRET'],
    firstAccountToProcess,
  )
  const verboseReport = JSON.stringify(reconcileResult, null, 2)
  const report = [
    'Reconcile Report',
    verboseReport,
    'Reconcile took(ms): ' + (Date.now() - reconcileStartTime),
    'Lambda Event Details: ' + JSON.stringify(events),
    'Lambda Invocation Id: ' + JSON.stringify(context),
    'Details: ' + generateLinkToCloudwatch(context),
  ].join('\n')
  console.log(report)

  const summarizedReport = {
    ...reconcileResult,
    data: {
      processedCount: reconcileResult.data.processed.length,
      failedCount: reconcileResult.data.failed.length,
    },
  }
  await reportToSlack({
    env: SUB_DOMAIN,
    title: 'Reconcilation Report',
    reportContent: JSON.stringify(summarizedReport, null, 2),
    cloudwatchLink: generateLinkToCloudwatch(context),
    timing: Date.now() - startTime,
    functionName: context.functionName,
  })
}

if (require.main === module) {
  main()
}
exports.handler = main
