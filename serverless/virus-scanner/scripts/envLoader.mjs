import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import fs from 'fs'
import { exit } from 'process'

const SHORT_ENV_MAP = {
  dev: 'dev',
  develop: 'dev',
  development: 'dev',
  prod: 'prod',
  production: 'prod',
  stg: 'staging',
  staging: 'staging',
  'stg-alt3': 'stg-alt3',
  test: 'test',
  testing: 'test',
  uat: 'uat',
  vapt: 'vapt',
}

/**
 * Returns true if the environment is an IaC migrated environment.
 * IaC migrated environments use new SSM keys and format that are different from the legacy ones.
 */
const isIacMigratedSsmKeys = (env) => {
  return env === SHORT_ENV_MAP['stg-alt3']
}

/**
 * Fetches the parameter string for the given environment from SSM. 
 */
const getParamString = async (env) => {
  const client = new SSMClient({ region: 'ap-southeast-1' })

  if (isIacMigratedSsmKeys(env)) {
    const VIRUS_SCANNER_QUARANTINE_S3_BUCKET_KEY = 'VIRUS_SCANNER_QUARANTINE_S3_BUCKET'
    const VIRUS_SCANNER_CLEAN_S3_BUCKET_KEY = 'VIRUS_SCANNER_CLEAN_S3_BUCKET'

    const virusScannerQuarantineBucketParam = `/virus-scanner/${SHORT_ENV_MAP[env]}/${VIRUS_SCANNER_QUARANTINE_S3_BUCKET_KEY}`
    const virusScannerCleanBucketParam = `/virus-scanner/${SHORT_ENV_MAP[env]}/${VIRUS_SCANNER_CLEAN_S3_BUCKET_KEY}`

    const virusScannerQuarantineBucketParamRes = await client.send(
      new GetParameterCommand({
        Name: virusScannerQuarantineBucketParam,
      }),
    )
    const virusScannerCleanBucketParamRes = await client.send(
      new GetParameterCommand({
        Name: virusScannerCleanBucketParam,
      }),
    )

    const paramString = ''

    const quarantineBucketParam = `${VIRUS_SCANNER_QUARANTINE_S3_BUCKET_KEY}=${virusScannerQuarantineBucketParamRes.Parameter.Value}`;
    const cleanBucketParam = `${VIRUS_SCANNER_CLEAN_S3_BUCKET_KEY}=${virusScannerCleanBucketParamRes.Parameter.Value}`;
    return paramString.concat(quarantineBucketParam, '\n', cleanBucketParam);
  }

  const parameterName = `/virus-scanner/${SHORT_ENV_MAP[env]}`

  const res = await client.send(
    new GetParameterCommand({
      Name: parameterName,
    }),
  )
  const parameterString = (res.Parameter?.Value ?? '')

  return parameterString
}

// This is a helper for local file runs or jest, as specified in package.json
// It emulates the loading of SSM which Lambda will do.
// This file is not meant to be used in a deployment and is .mjs so we can use top-level await
async function saveAllParameters() {

  // If process.env.ENV is not a key in SHORT_ENV_MAP, then it is not a valid environment
  if (!Object.keys(SHORT_ENV_MAP).includes(process.env.ENV)) {
    console.log(`Invalid ENV=${process.env.ENV}. Must be a valid env in SHORT_ENV_MAP`)
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

  const parameterString = await getParamString(process.env.ENV)

  // Add on NODE_ENV
  const parameterStringWithNodeEnv = parameterString.concat(`\nNODE_ENV=${process.env.ENV}`)

  await fs.promises.writeFile(`.env.${process.env.ENV}`, parameterStringWithNodeEnv)
}

await saveAllParameters()
