const generateLinkToCloudwatch = (region, context) => {
  const { logGroupName, logStreamName } = context
  return (
    `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/` +
    encodeURIComponent(encodeURIComponent(logGroupName)) +
    '/log-events/' +
    encodeURIComponent(encodeURIComponent(logStreamName))
  )
}

const getPostToSlack = (apiSecret) => async (message) => {
  return fetch(`https://hooks.slack.com/services/${apiSecret}`, {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify({ text: message }),
  })
}

module.exports = {
  generateLinkToCloudwatch,
  getPostToSlack,
}
