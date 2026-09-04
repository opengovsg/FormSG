/**
 * Weekly product digest generator.
 *
 * Deliberately thin: the Lambda is a clock with an HTTP client. Every decision
 * — what merged, what is worth reporting, whether there is enough to be worth
 * sending — lives behind the API, where it can reuse the backend's models and
 * logging.
 *
 * Note what this does NOT do: send anything. It drafts a digest and persists
 * it. Mail goes out only when someone approves that digest, which is a separate
 * endpoint and deliberately not on a timer. A drafted digest nobody approves is
 * a normal outcome, not a failed run.
 *
 * The call is safe to repeat. Generation is idempotent within an ISO week, so a
 * retry, an overlapping invocation, or someone running it by hand on the same
 * day all return the digest that already exists rather than drafting a second.
 *
 * Required env vars (all set by template.yaml):
 * - AWS_REGION
 * - SSM_ENV_SITE_NAME: ['prod', 'uat', 'stg', 'stg-alt', 'stg-alt2', 'stg-alt3']
 * - SSM_SECRET_PARAMETER_NAME: full SSM path of the shared API secret
 *
 * The secret is the same parameter the backend reads, provisioned by pulumi in
 * formsg-infra. One copy rather than two, because a drift between them is
 * silent: every run would 401 and the digest would simply never arrive.
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')

const AWS_REGION = process.env.AWS_REGION
const ENV_SITE_NAME = process.env.SSM_ENV_SITE_NAME

const API_URL = `https://${
  ENV_SITE_NAME === 'prod' ? '' : `${ENV_SITE_NAME}.`
}form.gov.sg/api/v3/cron/generate-digest`

const SECRET_PARAMETER_NAME = process.env.SSM_SECRET_PARAMETER_NAME
const API_AUTH_HEADER = 'x-formsg-cron-changelog-secret'

/**
 * Drafting calls a model over the network, which is slower than the usual API
 * request and worth waiting for rather than retrying blind.
 */
const REQUEST_TIMEOUT_MS = 120_000

// Module scope so the client (and its connections) survive warm invocations.
const ssmClient = new SSMClient({ region: AWS_REGION })

/** Reads the shared API secret from SSM Parameter Store. */
const getApiSecret = async () => {
  const { Parameter } = await ssmClient.send(
    new GetParameterCommand({
      Name: SECRET_PARAMETER_NAME,
      WithDecryption: true,
    }),
  )

  if (!Parameter || !Parameter.Value) {
    throw new Error(`No value at SSM parameter ${SECRET_PARAMETER_NAME}`)
  }

  return Parameter.Value
}

exports.handler = async () => {
  const apiSecret = await getApiSecret()

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [API_AUTH_HEADER]: apiSecret,
    },
    // No body. The endpoint decides its own window: everything merged since a
    // digest was last *sent*. A week that sent nothing is therefore picked up
    // by the following one rather than falling between two fixed windows.
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  const body = await response.text()

  if (!response.ok) {
    // Thrown so the invocation is recorded as a failure and the alarm fires.
    throw new Error(`Digest request failed: ${response.status} ${body}`)
  }

  const result = JSON.parse(body)

  console.log(
    JSON.stringify({
      message: 'Digest generated',
      digestId: result.digestId,
      week: result.week,
      status: result.status,
      itemCount: result.itemCount,
      window: result.window,
    }),
  )

  return { statusCode: 200, body }
}
