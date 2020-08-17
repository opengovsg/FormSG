import axios from 'axios'
import { ObjectId } from 'bson'
import crypto from 'crypto'
import dedent from 'dedent'
import { cloneDeep, merge } from 'lodash'
import { mocked } from 'ts-jest/utils'

import { isValidSnsRequest, updateBounces } from 'src/app/services/sns.service'
import {
  IBounceNotification,
  IDeliveryNotification,
  IEmailNotification,
  ISnsNotification,
} from 'src/types'

import dbHandler from '../helpers/db-handler'

jest.mock('axios')
const mockAxios = mocked(axios, true)

const MOCK_SNS_BODY: ISnsNotification = {
  Type: 'type',
  MessageId: 'message-id',
  TopicArn: 'topic-arn',
  Message: 'message',
  Timestamp: 'timestamp',
  SignatureVersion: '1',
  Signature: 'signature',
  SigningCertURL: 'https://fakeawsurl.amazonaws.com/cert.pem',
}

describe('isValidSnsRequest', () => {
  let keys, body: ISnsNotification
  beforeAll(() => {
    keys = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    })
  })
  beforeEach(() => {
    body = cloneDeep(MOCK_SNS_BODY)
    mockAxios.get.mockResolvedValue({
      data: keys.publicKey,
    })
  })
  test('should gracefully reject empty input', () => {
    return expect(isValidSnsRequest(undefined)).resolves.toBe(false)
  })
  test('should reject requests without valid structure', () => {
    delete body.Type
    return expect(isValidSnsRequest(body)).resolves.toBe(false)
  })
  test('should reject requests with invalid certificate URL', () => {
    body.SigningCertURL = 'http://www.example.com'
    return expect(isValidSnsRequest(body)).resolves.toBe(false)
  })
  test('should reject requests with invalid signature version', () => {
    body.SignatureVersion = 'wrongSignatureVersion'
    return expect(isValidSnsRequest(body)).resolves.toBe(false)
  })
  test('should reject requests with invalid signature', () => {
    return expect(isValidSnsRequest(body)).resolves.toBe(false)
  })
  test('should accept valid requests', () => {
    const signer = crypto.createSign('RSA-SHA1')
    const baseString =
      dedent`Message
      ${body.Message}
      MessageId
      ${body.MessageId}
      Timestamp
      ${body.Timestamp}
      TopicArn
      ${body.TopicArn}
      Type
      ${body.Type}
      ` + '\n'
    signer.write(baseString)
    body.Signature = signer.sign(keys.privateKey, 'base64')
    return expect(isValidSnsRequest(body)).resolves.toBe(true)
  })
})

describe('updateBounces', () => {
  const recipientList = ['email1@example.com', 'email2@example.com']
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  test('should save a single delivery notification correctly', async () => {
    const notification = makeDeliveryNotification(
      String(new ObjectId()),
      String(new ObjectId()),
      recipientList,
      recipientList,
    )
    await updateBounces(notification)
  })

  test('should save a single bounce notification correctly', async () => {
    const notification = makeBounceNotification(
      String(new ObjectId()),
      String(new ObjectId()),
      recipientList,
      recipientList,
    )
    await updateBounces(notification)
  })
})

const makeEmailNotification = (
  notificationType: 'Bounce' | 'Delivery',
  formId: string,
  submissionId: string,
  recipientList: string[],
): IEmailNotification => {
  return {
    notificationType,
    mail: {
      source: 'donotreply@form.gov.sg',
      destination: recipientList,
      headers: [
        {
          name: 'X-Formsg-Form-ID',
          value: formId,
        },
        {
          name: 'X-Formsg-Submission-ID',
          value: submissionId,
        },
        {
          name: 'X-Formsg-Email-Type',
          value: 'Admin (response)',
        },
      ],
      commonHeaders: {
        subject: `Title (Ref: ${submissionId})`,
        to: recipientList,
        from: 'donotreply@form.gov.sg',
      },
    },
  }
}

const makeBounceNotification = (
  formId: string,
  submissionId: string,
  recipientList: string[],
  bouncedList: string[],
  bounceType: 'Transient' | 'Permanent' = 'Permanent',
): ISnsNotification => {
  const Message = merge(
    makeEmailNotification('Bounce', formId, submissionId, recipientList),
    {
      bounce: {
        bounceType,
        bouncedRecipients: bouncedList.map((emailAddress) => ({
          emailAddress,
        })),
      },
    },
  ) as IBounceNotification
  const body = cloneDeep(MOCK_SNS_BODY)
  body.Message = JSON.stringify(Message)
  return body
}

const makeDeliveryNotification = (
  formId: string,
  submissionId: string,
  recipientList: string[],
  deliveredList: string[],
): ISnsNotification => {
  const Message = merge(
    makeEmailNotification('Delivery', formId, submissionId, recipientList),
    {
      delivery: {
        recipients: deliveredList,
      },
    },
  ) as IDeliveryNotification
  const body = cloneDeep(MOCK_SNS_BODY)
  body.Message = JSON.stringify(Message)
  return body
}
