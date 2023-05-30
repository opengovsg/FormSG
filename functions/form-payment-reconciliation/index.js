/**
 * Main file that runs payment reconciliation CRON job.
 * Required env vars:
 * - AWS_REGION: the aws region which the
 * - SSM_ENV_SITE_NAME: ['prod', 'staging', 'staging-alt', 'staging-alt2', 'uat']
 *
 * Required parameters in parameter store `<SSM_ENV_SITE_NAME>-cron-payment`:
 * - CRON_PAYMENT_API_SECRET: the shared secret to validate protected routes in FormSG API
 * - SLACK_API_SECRET: the API key for posting reports to slack
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')
const { generateLinkToCloudwatch, getPostToSlack } = require('./src/utils')

const AWS_REGION = process.env.AWS_REGION

const ENV_SITE_NAME = process.env.SSM_ENV_SITE_NAME
const CRON_API_PREFIX = `https://${
  ENV_SITE_NAME === 'prod' ? '' : `${ENV_SITE_NAME}.`
}form.gov.sg/api/v3/payments/reconcile`

const PARAMETER_STORE_NAME = `${ENV_SITE_NAME}-cron-payment`
const CRON_PAYMENT_API_SECRET_KEY = 'CRON_PAYMENT_API_SECRET'
const CRON_PAYMENT_SLACK_SECRET_KEY = 'SLACK_API_SECRET'

const API_AUTH_HEADER = 'x-formsg-cron-payment-secret'

const MAX_AGE_HRS_EVENTS = 24

/**
 * Helper function to obtain secrets map from parameter store.
 */
const getSSMSecrets = () => {
  // Regex used to match key-value pairs from parameter store.
  // Makes use of capture groups to obtain the key and value.
  const KEY_VALUE_PAIR_REGEX = /^([^\s=]+)\s*=\s*(\S+)$/

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

/**
 * Helper function to get API functions given the API secret.
 */
const getApi = (apiSecret) => {
  const getIncompletePayments = async () => {
    return fetch(`${CRON_API_PREFIX}/incompletePayments`, {
      headers: { [API_AUTH_HEADER]: apiSecret },
    }).then(async (res) => ({ ok: res.ok, data: await res.json() }))
  }

  const reconcileAccount = async (stripeAccount, paymentIds) => {
    return fetch(
      `${CRON_API_PREFIX}/account/${stripeAccount}?maxAgeHrs=${MAX_AGE_HRS_EVENTS}`,
      {
        method: 'POST',
        headers: {
          [API_AUTH_HEADER]: apiSecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIds }),
      },
    ).then(async (res) => ({ ok: res.ok, data: await res.json() }))
  }

  return { getIncompletePayments, reconcileAccount }
}

async function main(events, context) {
  // Things will be appended as we go along.
  const REPORT = [
    `*Reconciliation report for ${ENV_SITE_NAME}*`,
    '---',
    '*Critical messages:*',
  ]

  console.log('CRON job starting')
  const CRON_START_TIME = Date.now()

  // Step 0(a): Load secrets from SSM
  const secret = await getSSMSecrets()

  // Step 0(b): Get API functions based on secret keys
  const { getIncompletePayments, reconcileAccount } = getApi(
    secret[CRON_PAYMENT_API_SECRET_KEY],
  )
  const postToSlack = getPostToSlack(secret[CRON_PAYMENT_SLACK_SECRET_KEY])

  // Wrap the primary running functionality in a function to take advantage of
  // short-circuiting.
  const run = async () => {
    // Step 1: Get all incomplete payments from the past
    console.log('Retrieving incomplete payments')

    const getIncompletePaymentsResponse = await getIncompletePayments()

    if (!getIncompletePaymentsResponse.ok) {
      console.error(
        'Error occurred while retrieving incomplete payments:',
        getIncompletePaymentsResponse.data.message,
      )
      REPORT.push(
        `- Error occurred while retrieving incomplete payments: \`${getIncompletePaymentsResponse.data.message}\``,
        '---',
      )
      return
    }

    if (getIncompletePaymentsResponse.data.length === 0) {
      console.log('No incomplete payments to reconcile.')
      REPORT.push('---', 'No incomplete payments to reconcile.')
      return
    }

    console.log(
      'Incomplete payments\n' +
        JSON.stringify(getIncompletePaymentsResponse.data, null, 2),
    )

    // Step 2: Group all payments by stripeAccount.
    console.log('Grouping payments by Stripe account')

    const incompletePaymentsByStripeAccount = {}
    getIncompletePaymentsResponse.data.forEach(
      ({ stripeAccount, paymentId }) => {
        if (!incompletePaymentsByStripeAccount[stripeAccount]) {
          incompletePaymentsByStripeAccount[stripeAccount] = []
        }
        incompletePaymentsByStripeAccount[stripeAccount].push(paymentId)
      },
    )

    // Step 3: Reconcile each Stripe account individually
    const reconciliationMeta = {
      error: {
        accounts: [],
      },
      ok: {
        accounts: [],
        events: {
          success: [],
          failed: [],
        },
        payments: {
          match: [],
          mismatch: [],
          canceled: [],
        },
      },
    }

    for (const [stripeAccount, paymentIds] of Object.entries(
      incompletePaymentsByStripeAccount,
    )) {
      console.log('Reconciling Stripe account', stripeAccount)

      const reconcileAccountResponse = await reconcileAccount(
        stripeAccount,
        paymentIds,
      )

      if (!reconcileAccountResponse.ok) {
        console.error(
          `Error occurred while reconciling Stripe account ${stripeAccount}:`,
          reconcileAccountResponse.data.message,
        )
        REPORT.push(
          `- Error occurred while reconciling Stripe account \`${stripeAccount}\`: \`${reconcileAccountResponse.data.message}\``,
        )
        reconciliationMeta.error.accounts.push(stripeAccount)
        continue
      }

      console.log(
        `Reconcile attempt OK for Stripe account ${stripeAccount}`,
        JSON.stringify(reconcileAccountResponse.data, null, 2),
      )
      reconciliationMeta.ok.accounts.push(stripeAccount)

      // Aggregate data of resent events
      reconcileAccountResponse.data.eventsReport.forEach(({ event, error }) => {
        const identifier = `${stripeAccount}::${event.id}`
        if (error) {
          reconciliationMeta.ok.events.failed.push(
            `${identifier} [ERROR: ${error}]`,
          )
        } else {
          reconciliationMeta.ok.events.success.push(identifier)
        }
      })

      // Aggregate data of payments
      reconcileAccountResponse.data.reconciliationReport.forEach(
        ({ payment, paymentIntent, mismatch, canceled }) => {
          const identifier = `${stripeAccount}::${payment.id}::${paymentIntent.id}`

          if (mismatch) {
            reconciliationMeta.ok.payments.mismatch.push(identifier)
            // Mismatched payments should never be canceled
            if (canceled) {
              console.error(
                `Found mismatched payment that was canceled: ${identifier}`,
              )
              REPORT.push(
                `- Found mismatched payment that was canceled: \`${identifier}\``,
              )
            }
          } else {
            reconciliationMeta.ok.payments.match.push(identifier)
            if (canceled) {
              reconciliationMeta.ok.payments.canceled.push(identifier)
            }
          }
        },
      )
    }

    // Step 4: Aggregate reconciliation meta counts for reporting to Slack
    const reconciliationMetaCounts = {
      error: {
        accounts: reconciliationMeta.error.accounts.length,
      },
      ok: {
        accounts: reconciliationMeta.ok.accounts.length,
        events: {
          success: reconciliationMeta.ok.events.success.length,
          failed: reconciliationMeta.ok.events.failed.length,
        },
        payments: {
          match: reconciliationMeta.ok.payments.match.length,
          mismatch: reconciliationMeta.ok.payments.mismatch.length,
          canceled: reconciliationMeta.ok.payments.canceled.length,
        },
      },
    }

    console.log(
      'Reconciliation result\n' + JSON.stringify(reconciliationMeta, null, 2),
    )
    REPORT.push(
      '---',
      'Reconciliation result (aggregated):',
      '',
      '```' + JSON.stringify(reconciliationMetaCounts, null, 2) + '```',
    )
  }

  await run()

  // Step 5: Push CRON metadata
  console.log('Lambda event details:\n' + JSON.stringify(events, null, 2))
  console.log('Lambda invocation context:\n' + JSON.stringify(context, null, 2))

  REPORT.push(
    'CRON job runtime (ms): ' + (Date.now() - CRON_START_TIME),
    'Cloudwatch log: <' +
      generateLinkToCloudwatch(AWS_REGION, context) +
      '|cloudwatch>',
    '---',
    `Report from \`${
      context.functionName
    }\` prepared on \`${new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Singapore',
    })} SGT\``,
  )

  await postToSlack(REPORT.join('\n')).then((res) =>
    console.log('Post to Slack response:\n' + JSON.stringify(res, null, 2)),
  )
}

if (require.main === module) {
  main()
}
exports.handler = main
