/** [STEERING:T7] Remove after verifying the provisioned bucket (#9755). */
import { GetObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import axios from 'axios'
import { ObjectId } from 'bson'

import { aws as AwsConfig } from 'src/app/config/config'
import { getSignedS3Url, putS3Object } from 'src/app/utils/aws-s3'

const isLocalstackReachable = async (): Promise<boolean> => {
  try {
    await AwsConfig.s3.send(
      new HeadBucketCommand({
        Bucket: AwsConfig.submissionHistoryV1AttachmentS3Bucket,
      }),
    )
    return true
  } catch {
    return false
  }
}

describe('[STEERING:T7] V1 attachment bucket smoke test', () => {
  let reachable = false

  beforeAll(async () => {
    reachable = await isLocalstackReachable()
    if (!reachable) {
      // eslint-disable-next-line no-console
      console.warn(
        `Skipping the V1 attachment bucket smoke test: ${AwsConfig.submissionHistoryV1AttachmentS3Bucket} is not reachable. Run \`docker-compose up localstack\` and \`./init-localstack.sh\` to exercise it.`,
      )
    }
  })

  it('should write an object to the V1 attachment bucket and read it back through a presigned URL', async () => {
    if (!reachable) return

    const key = `${new ObjectId().toHexString()}/${new ObjectId().toHexString()}`
    const body = JSON.stringify({
      encryptedFile: {
        submissionPublicKey: 'pk',
        nonce: 'n',
        binary: 'YmluCg==',
      },
    })

    await putS3Object({
      Bucket: AwsConfig.submissionHistoryV1AttachmentS3Bucket,
      Key: key,
      Body: Buffer.from(body),
    })

    const url = await getSignedS3Url(
      { Bucket: AwsConfig.submissionHistoryV1AttachmentS3Bucket, Key: key },
      60,
    )
    const { data } = await axios.get(url, { responseType: 'text' })

    expect(String(data)).toBe(body)
  })

  it('should not find a V1 attachment object in the native attachment bucket', async () => {
    if (!reachable) return

    const key = `${new ObjectId().toHexString()}/${new ObjectId().toHexString()}`
    await putS3Object({
      Bucket: AwsConfig.submissionHistoryV1AttachmentS3Bucket,
      Key: key,
      Body: Buffer.from('v1-copy'),
    })

    await expect(
      AwsConfig.s3.send(
        new GetObjectCommand({
          Bucket: AwsConfig.attachmentS3Bucket,
          Key: key,
        }),
      ),
    ).rejects.toThrow()
  })
})
