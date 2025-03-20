import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import fs from 'fs'
import { exit } from 'process'

const SHORT_ENV_MAP = {
  dev: 'dev',
  develop: 'dev',
  development: 'dev',
  prod: 'prod',
  production: 'prod',
  stg: 'stg',
  staging: 'stg',
  'stg-alt': 'stg-alt',
  'staging-alt': 'stg-alt',
  'stg-alt2': 'stg-alt2',
  'staging-alt2': 'stg-alt2',
  'stg-alt3': 'stg-alt3',
  'staging-alt3': 'stg-alt3',
  test: 'test',
  testing: 'test',
  uat: 'uat',
  vapt: 'vapt',
}

const SSM_PARAMETER_STORE_KEYS = [
  'GUARDDUTY_CLEAN_S3_BUCKET',
  'GUARDDUTY_QUARANTINE_S3_BUCKET',
]

// This is a helper for local file runs or jest, as specified in package.json
// It emulates the loading of SSM which Lambda will do.
// This file is not meant to be used in a deployment and is .mjs so we can use top-level await
async function saveAllParameters() {
  // If process.env.ENV is not a key in SHORT_ENV_MAP, then it is not a valid environment
  if (!Object.keys(SHORT_ENV_MAP).includes(process.env.ENV)) {
    console.log(
      `Invalid ENV=${process.env.ENV}. Must be a valid env in SHORT_ENV_MAP`,
    )
    exit(1)
  }

  console.log(`Retrieving parameters for ENV=${process.env.ENV}`)

  const devEnvs = ['dev', 'develop', 'development']
  if (devEnvs.includes(process.env.ENV)) {
    console.log('In develop mode! Not fetching from SSM param store.')
    console.log(
      'Please reference .env.example to populate .env.development file for development environment',
    )
    exit(0)
  }
  const client = new SSMClient({ region: 'ap-southeast-1' })
  const parameterNamePrefix = `/virus-scanner-guardduty/${SHORT_ENV_MAP[process.env.ENV]}/`

  const requests = SSM_PARAMETER_STORE_KEYS.map((key) =>
    client.send(
      new GetParameterCommand({ Name: `${parameterNamePrefix}${key}` }),
    ),
  )

  const resolvedParameters = Promise.all(requests).map(
    (res) => `${res.Parameter.Name}=${res.Parameter.Value}`,
  )

  const parameterString = resolvedParameters.join('\n')

  // Add on NODE_ENV
  const parameterStringWithNodeEnv = [
    ...parameterString,
    `NODE_ENV=${process.env.ENV}`,
  ].join('\n')

  await fs.promises.writeFile(
    `.env.${process.env.ENV}`,
    parameterStringWithNodeEnv,
  )
}

await saveAllParameters()
