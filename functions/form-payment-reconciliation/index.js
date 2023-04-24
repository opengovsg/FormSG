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

const getPendingQueries = () => {
  return fetch('https://staging.form.gov.sg/api/v3/payments/pendingPayments')
}
async function main() {
  const secret = await getSecrets()

  const pendingQueries = await getPendingQueries()
  console.log(secret)
  console.log(JSON.stringify(pendingQueries, null, 2))
}

if (require.main === module) {
  main()
}
exports.handler = main
