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
  test: 'test',
  testing: 'test',
  uat: 'uat',
  vapt: 'vapt',
}

// This is a helper for local file runs or jest, as specified in package.json
// It emulates the loading of SSM which Lambda will do.
// This file is not meant to be used in a deployment and is .mjs so we can use top-level await
async function saveAllParameters() {
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
  const parameterName = `/virus-scanner/${SHORT_ENV_MAP[process.env.ENV]}`

  const res = await client.send(
    new GetParameterCommand({
      Name: parameterName,
    }),
  )

  const parameterString = (res.Parameter?.Value ?? '')

  // Add on NODE_ENV
  const parameterStringWithNodeEnv = parameterString.concat(`\nNODE_ENV=${process.env.ENV}`)

  await fs.promises.writeFile(`.env.${process.env.ENV}`, parameterStringWithNodeEnv)
}

await saveAllParameters()
