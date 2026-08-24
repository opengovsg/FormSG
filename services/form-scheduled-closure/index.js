/**
 * Scheduled form closure sweep.
 *
 * Closes forms whose admin-set expiry has passed. Deliberately thin: which
 * forms to close is decided behind the API, so it can reuse the backend's
 * models, logging and mailer.
 *
 * Required env vars (both set by template.yaml):
 * - AWS_REGION
 * - SSM_ENV_SITE_NAME: ['prod', 'uat', 'stg', 'stg-alt', 'stg-alt2', 'stg-alt3']
 * - SSM_SECRET_PARAMETER_NAME: full SSM path of the shared API secret
 *
 * The secret is the same parameter the backend reads, provisioned by pulumi in
 * formsg-infra. One copy rather than two, since a drift between them is silent.
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')

const AWS_REGION = process.env.AWS_REGION
const ENV_SITE_NAME = process.env.SSM_ENV_SITE_NAME

const API_URL = `https://${
  ENV_SITE_NAME === 'prod' ? '' : `${ENV_SITE_NAME}.`
}form.gov.sg/api/v3/cron/close-expired-forms`

const SECRET_PARAMETER_NAME = process.env.SSM_SECRET_PARAMETER_NAME
const API_AUTH_HEADER = 'x-formsg-cron-scheduled-closure-secret'

// A full batch means more forms are waiting, so keep sweeping — but bounded,
// so a backlog cannot run the Lambda to its timeout.
const MAX_SWEEPS_PER_RUN = 5

/** Reads the shared API secret from SSM Parameter Store. */
const getApiSecret = async () => {
  const awsSsmClient = new SSMClient({ region: AWS_REGION })
  const command = new GetParameterCommand({
    Name: SECRET_PARAMETER_NAME,
    WithDecryption: true,
  })

  const res = await awsSsmClient.send(command)
  return res.Parameter.Value
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

  const apiSecret = await getApiSecret()
  if (!apiSecret) {
    // Fail loudly: a silent no-op reads as "nothing expired" in the logs.
    throw new Error(`No secret found at SSM parameter ${SECRET_PARAMETER_NAME}`)
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
