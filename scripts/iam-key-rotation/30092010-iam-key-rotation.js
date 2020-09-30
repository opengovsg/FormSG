const max_days = process.env.ACCESS_KEY_MAX_DAYS
const aws = require('aws-sdk')
const ses = new aws.SES({
  region: 'us-west-2',
})
const iam = new aws.IAM()

exports.handler = () => {
  const getAllParams = {}
  iam
    .listUsers(getAllParams)
    .promise()
    .then((results) => {
      let userData = results.Users.map((user) =>
        // Extract emails
        // Note that listUsers does not return the tags, must extract manually
        // See https://github.com/boto/boto3/issues/1855
        {
          const params = { UserName: user.UserName }
          return iam
            .listUserTags(params)
            .promise()
            .then((tag) => {
              const emailData = tag.Tags.filter(
                (tag) => tag.Key.toLowerCase() === 'email',
              )
              // toLowerCase() in case of entry error
              const email =
                emailData && emailData[0] && emailData[0]['Value']
                  ? emailData[0]['Value']
                  : undefined
              return {
                userName: user.UserName,
                userId: user.UserId,
                email: email,
              }
            })
        },
      )
      return Promise.all(userData).then((results) => results)
    })
    .then((results) => {
      // Extract admin status
      let userData = results.map((result) => {
        const params = { UserName: result.userName }
        return iam
          .listGroupsForUser(params)
          .promise()
          .then((groupInfo) => {
            result['groupInfo'] = groupInfo
            groupInfo.Groups.forEach((info) => {
              if (info.GroupName && info.GroupName === 'Admin') {
                result['isAdmin'] = true
              }
            })
            return result
          })
      })
      return Promise.all(userData).then((results) => results)
    })
    .then((results) => {
      // Extract access key expired status
      let userData = results.map((result) => {
        const params = { UserName: result.userName }
        return iam
          .listAccessKeys(params)
          .promise()
          .then((accessKeyInfo) => {
            accessKeyInfo.AccessKeyMetadata.forEach(
              //AccessKeyMetadata is defined as iam returns empty list if none
              (data) => {
                //Check if any keys are expired
                const days = Math.floor(
                  (new Date() - new Date(data.CreateDate)) /
                    (1000 * 60 * 60 * 24),
                )
                const expired = days > max_days && data.Status === 'Active'
                if (expired) {
                  result['hasExpiredKey'] = true
                }
              },
            )
            return result
          })
      })
      return Promise.all(userData).then((results) => results)
    })
    .then((results) => {
      // Consolidate list of admin emails
      const adminEmails = []
      results.forEach((result) => {
        if (result.isAdmin && result.email) {
          adminEmails.push(result.email)
        }
      })
      // Send reminders to all users who have expired keys + send to admins
      results.forEach((result) => {
        if (result.hasExpiredKey) {
          const emailParams = {
            Destination: {
              ToAddresses: [...adminEmails, result.email],
            },
            Message: {
              Body: {
                Text: {
                  Charset: 'UTF-8',
                  Data: `Please note that user ${result.userName} has expired IAM access key(s). \n\n IAM access keys must be rotated once every 90 days. Please log on to IAM to rotate the access key(s).`,
                },
              },
              Subject: {
                Charset: 'UTF-8',
                Data: 'Expired IAM Access Key',
              },
            },
            Source: 'iam-rotation@form.gov.sg',
          }
          ses
            .sendEmail(emailParams)
            .promise()
            .then(() => {
              console.log(`sent reminder to ${result.userName}`)
            })
        }
      })
    })
    .catch((err) => console.log(`error: ${err}`))
}
