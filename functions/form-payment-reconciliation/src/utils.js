const generateLinkToCloudwatch = (context) => {
  const { logGroupName, logStreamName } = context
  return (
    'https://ap-southeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-southeast-1#logsV2:log-groups/log-group/' +
    encodeURIComponent(encodeURIComponent(logGroupName)) +
    '/log-events/' +
    encodeURIComponent(encodeURIComponent(logStreamName))
  )
}

const postToSlack = (slackApiSecret, message) => {
  return fetch(`https://hooks.slack.com/services/${slackApiSecret}`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ text: message }),
  })
}

module.exports = {
  generateLinkToCloudwatch,
  postToSlack,
}
