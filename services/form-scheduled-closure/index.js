/**
 * Scheduled form closure sweep.
 *
 * Closes forms whose admin-set expiry has passed. Deliberately thin: the
 * Lambda is a clock with an HTTP client, and every decision about *which*
 * forms to close lives behind the API so it can reuse the backend's models,
 * logging and (later) mailer.
 *
 * Required env vars:
 * - AWS_REGION
 * - SSM_ENV_SITE_NAME: ['prod', 'uat', 'stg', 'stg-alt', 'stg-alt2', 'stg-alt3']
 *
 * Required parameters in parameter store `<SSM_ENV_SITE_NAME>-cron-scheduled-closure`:
 * - CRON_SCHEDULED_CLOSURE_API_SECRET: shared secret validating requests to the API
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')

const AWS_REGION = process.env.AWS_REGION
const ENV_SITE_NAME = process.env.SSM_ENV_SITE_NAME

const API_URL = `https://${
  ENV_SITE_NAME === 'prod' ? '' : `${ENV_SITE_NAME}.`
}form.gov.sg/api/v3/cron/close-expired-forms`

const PARAMETER_STORE_NAME = `${ENV_SITE_NAME}-cron-scheduled-closure`
const API_SECRET_KEY = 'CRON_SCHEDULED_CLOSURE_API_SECRET'
const API_AUTH_HEADER = 'x-formsg-cron-scheduled-closure-secret'

/**
 * A sweep that fills its batch means more forms are still waiting. Rather than
 * leave them until the next scheduled run, keep sweeping — but bounded, so a
 * pathological backlog cannot run the Lambda to its timeout.
 */
const MAX_SWEEPS_PER_RUN = 5

/**
 * Reads the key-value parameter blob from SSM. Matches the format used by the
 * payment reconciliation job's parameter.
 */
const getSSMSecrets = async () => {
  const KEY_VALUE_PAIR_REGEX = /^([^\s=]+)\s*=\s*(\S+)$/

  const awsSsmClient = new SSMClient({ region: AWS_REGION })
  const command = new GetParameterCommand({
    Name: PARAMETER_STORE_NAME,
    WithDecryption: true,
  })

  const res = await awsSsmClient.send(command)
  return res.Parameter.Value.split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((parameterMap, line) => {
      const match = line.match(KEY_VALUE_PAIR_REGEX)
      if (match && match.length === 3) parameterMap[match[1]] = match[2]
      return parameterMap
    }, {})
}

const closeExpiredForms = async (apiSecret) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { [API_AUTH_HEADER]: apiSecret },
  })

  if (!res.ok) {
    throw new Error(
      `Sweep failed with ${res.status} ${res.statusText}: ${await res.text()}`,
    )
  }

  return res.json()
}

exports.handler = async () => {
  console.log(`Scheduled closure sweep starting for ${ENV_SITE_NAME}`)

  const secrets = await getSSMSecrets()
  const apiSecret = secrets[API_SECRET_KEY]
  if (!apiSecret) {
    // Fail loudly: silently no-opping would look identical to "nothing expired"
    // in the logs, and the forms would quietly stay open.
    throw new Error(
      `${API_SECRET_KEY} missing from parameter ${PARAMETER_STORE_NAME}`,
    )
  }

  const closedFormIds = []
  let sweeps = 0
  let hasMore = true

  while (hasMore && sweeps < MAX_SWEEPS_PER_RUN) {
    const result = await closeExpiredForms(apiSecret)
    sweeps += 1
    closedFormIds.push(...result.formIds)
    hasMore = result.hasMore
  }

  if (hasMore) {
    console.warn(
      `Stopped after ${MAX_SWEEPS_PER_RUN} sweeps with forms still expiring; the next scheduled run will continue.`,
    )
  }

  console.log(
    `Scheduled closure sweep done. Closed ${closedFormIds.length} form(s) over ${sweeps} sweep(s).`,
    closedFormIds,
  )

  return {
    environment: ENV_SITE_NAME,
    closedCount: closedFormIds.length,
    formIds: closedFormIds,
    sweeps,
    hasMore,
  }
}
