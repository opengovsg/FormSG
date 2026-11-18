import axios, { AxiosResponse } from 'axios'
import { ObjectId } from 'bson'

import { aws as AwsConfig } from 'src/app/config/config'
import { sendWebhook } from 'src/app/modules/webhook/webhook.service'
import * as WebhookValidationModule from 'src/app/modules/webhook/webhook.validation'
import { s3Operations } from 'src/app/utils/aws-s3'
import { WebhookData, WebhookView } from 'src/types/submission'

jest.mock('axios')
const MockAxios = jest.mocked(axios)

jest.mock('src/app/modules/webhook/webhook.validation')
const MockWebhookValidation = jest.mocked(WebhookValidationModule)

const MOCK_AXIOS_RESPONSE = {
  data: { result: 'ok' },
  status: 200,
  statusText: 'success',
  headers: {},
  config: {},
} as AxiosResponse

const WEBHOOK_URL = 'https://example.com/hook'

const ATTACHMENT_KEYS = {
  'field-one': 'form-id/aaaa/object-one',
  'field-two': 'form-id/bbbb/object-two',
}

const viewWith = (data: Partial<WebhookData> = {}): WebhookView =>
  ({
    data: {
      formId: new ObjectId().toHexString(),
      submissionId: new ObjectId().toHexString(),
      created: new Date(),
      encryptedContent: 'encrypted-content',
      attachmentDownloadUrls: ATTACHMENT_KEYS,
      version: 4,
      ...data,
    },
  }) as WebhookView

/**
 * The presigned URL a consumer receives carries no readable bucket, so the
 * gate observes the signing call's target and the posted body's URLs
 * together: what was signed is what was delivered.
 */
const signedUrlFor = ({ Bucket, Key }: { Bucket?: string; Key?: string }) =>
  `https://s3.example/${Bucket}/${Key}?X-Amz-Signature=sig`

describe('[GATE] attachment bucket routing', () => {
  let signCalls: { Bucket?: string; Key?: string }[]

  beforeEach(() => {
    jest.clearAllMocks()
    signCalls = []
    MockWebhookValidation.validateWebhookUrl.mockResolvedValue(undefined)
    MockAxios.post.mockResolvedValue(MOCK_AXIOS_RESPONSE)
    jest
      .spyOn(s3Operations, 'getSignedUrl')
      .mockImplementation(async (params) => {
        signCalls.push({ Bucket: params.Bucket, Key: params.Key })
        return signedUrlFor(params)
      })
  })

  const postedUrls = () =>
    (MockAxios.post.mock.calls[0][1] as WebhookView).data.attachmentDownloadUrls

  it('should presign a V1 delivery against the V1 attachment bucket', async () => {
    await sendWebhook(viewWith({ version: 2.1 }), WEBHOOK_URL, 'v1')

    expect(signCalls).toEqual(
      Object.values(ATTACHMENT_KEYS).map((Key) => ({
        Bucket: AwsConfig.submissionHistoryV1AttachmentS3Bucket,
        Key,
      })),
    )
    expect(postedUrls()).toEqual({
      'field-one': signedUrlFor({
        Bucket: AwsConfig.submissionHistoryV1AttachmentS3Bucket,
        Key: ATTACHMENT_KEYS['field-one'],
      }),
      'field-two': signedUrlFor({
        Bucket: AwsConfig.submissionHistoryV1AttachmentS3Bucket,
        Key: ATTACHMENT_KEYS['field-two'],
      }),
    })
  })

  it('should presign a V4 delivery against the native attachment bucket', async () => {
    await sendWebhook(viewWith(), WEBHOOK_URL, 'v4')

    expect(signCalls).toEqual(
      Object.values(ATTACHMENT_KEYS).map((Key) => ({
        Bucket: AwsConfig.attachmentS3Bucket,
        Key,
      })),
    )
  })

  it('should presign against the native attachment bucket when no content format is given', async () => {
    await sendWebhook(viewWith({ version: 2.1 }), WEBHOOK_URL)

    expect(signCalls).toEqual(
      Object.values(ATTACHMENT_KEYS).map((Key) => ({
        Bucket: AwsConfig.attachmentS3Bucket,
        Key,
      })),
    )
  })

  it('should generate a URL for every attachment key', async () => {
    await sendWebhook(viewWith({ version: 2.1 }), WEBHOOK_URL, 'v1')

    expect(Object.keys(postedUrls())).toEqual(Object.keys(ATTACHMENT_KEYS))
  })

  it('should route the two buckets apart', () => {
    expect(AwsConfig.submissionHistoryV1AttachmentS3Bucket).not.toBe(
      AwsConfig.attachmentS3Bucket,
    )
  })
})
