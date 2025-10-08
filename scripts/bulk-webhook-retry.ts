import sqs from 'aws-sdk/clients/sqs';

const client = new sqs({ region: 'ap-southeast-1' });

const submissionIds = [
  'submission ids go here'
]

async function sendMessage(submissionId: string) {
  const params = {
    QueueUrl: 'queueUrl',
    MessageBody: JSON.stringify({"submissionId":submissionId,"previousAttempts":[1759900022020],"nextAttempt":1759905022020,"_v":0}),
  };

  try {
    const result = await client.sendMessage(params).promise();
    console.log(`Message sent for submissionId ${submissionId}:`, result.MessageId);
  } catch (error) {
    console.error(`Error sending message for submissionId ${submissionId}:`, error);
  }
}

async function main() {
  let idx = 0;
  for (const submissionId of submissionIds) {
    idx += 1
    await sendMessage(submissionId);
    console.log(`${idx} / ${submissionIds.length} sent`);
    await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay between messages
  }
}

main()
  .then(() => console.log('All messages sent'))
  .catch((error) => console.error('Error in sending messages:', error));