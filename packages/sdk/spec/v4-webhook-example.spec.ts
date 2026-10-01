import { readFileSync } from 'fs'
import { resolve } from 'path'

import { decryptWebhook } from '../examples/v4-webhook'
import formsg from '../src'

it('runs the documented consumer against V4 and legacy payloads', async () => {
  const sdk = formsg({ mode: 'test' })
  const keys = sdk.crypto.generate()
  const v4Responses = {
    text: {
      fieldType: 'textfield',
      question: 'Name',
      answer: { value: 'Ada' },
      provenance: { stepNumber: 0 },
    },
  }
  const v4 = sdk.cryptoV3.encrypt(v4Responses, keys.publicKey)
  const payload = {
    ...v4,
    version: 4,
    submissionId: 'submission-1',
    workflowContent: { workflowStep: 0, submittedSteps: [{}] },
  }
  const first = await decryptWebhook(sdk, keys.secretKey, payload)
  expect(first.deliveryKey).toBe('submission-1:0:0')
  expect(first.submission.content.responses).toEqual(v4Responses)
  expect(first.submission.attachments).toEqual({})
  expect((await decryptWebhook(sdk, keys.secretKey, payload)).deliveryKey).toBe(
    first.deliveryKey
  )
  const next = await decryptWebhook(sdk, keys.secretKey, {
    ...payload,
    workflowContent: { workflowStep: 1, submittedSteps: [{}, {}] },
  })
  expect(next.deliveryKey).toBe('submission-1:1:1')
  const legacyResponses = [
    {
      _id: 'text',
      fieldType: 'textfield' as const,
      question: 'Name',
      answer: 'Ada',
    },
  ]
  const legacy = await decryptWebhook(sdk, keys.secretKey, {
    encryptedContent: sdk.crypto.encrypt(legacyResponses, keys.publicKey),
    version: 1,
    submissionId: 'legacy-1',
  })
  expect(legacy.submission.content.responses).toEqual(legacyResponses)
})

it.each(['../README.md', '../../../docs/v4-webhooks.md'])(
  'keeps %s code samples identical to the executable example',
  (path) => {
    const example = readFileSync(
      resolve(__dirname, '../examples/v4-webhook.ts'),
      'utf8'
    )
    const sample = example
      .split('// BEGIN CONSUMER SAMPLE\n')[1]
      .split('// END CONSUMER SAMPLE')[0]
      .trim()
    expect(readFileSync(resolve(__dirname, path), 'utf8')).toContain(sample)
  }
)
