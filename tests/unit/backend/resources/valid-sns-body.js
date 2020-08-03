const validSnsBody = {
  Type: 'type',
  MessageId: 'message-id',
  TopicArn: 'topic-arn',
  Message: 'message',
  Timestamp: 'timestamp',
  SignatureVersion: '1',
  Signature: 'signature',
  SigningCertURL: 'https://fakeawsurl.amazonaws.com/cert.pem',
  UnsubscribeURL: 'unsubscribe-url',
}

module.exports = {
  validSnsBody,
}
