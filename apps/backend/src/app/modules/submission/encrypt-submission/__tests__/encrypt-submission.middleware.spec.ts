import { generateDefaultField } from '__tests__/unit/backend/helpers/generate-form-data'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import {
  BasicField,
  FormAuthType,
  FormResponseMode,
  LogicConditionState,
  LogicType,
  MyInfoAttribute,
  MyInfoChildAttributes,
} from 'formsg-shared/types'
import JSZip from 'jszip'
import { ok, okAsync } from 'neverthrow'

import formsgSdk from 'src/app/config/formsg-sdk'
import { MyInfoService } from 'src/app/modules/myinfo/myinfo.service'
import { extractMyInfoLoginJwt } from 'src/app/modules/myinfo/myinfo.util'

import {
  encryptSubmission,
  validatePaymentSubmission,
  validateStorageSubmission,
} from '../encrypt-submission.middleware'

jest.mock('src/app/modules/datadog/datadog.utils')
jest.mock('src/app/modules/myinfo/myinfo.service', () => ({
  MyInfoService: {
    verifyLoginJwt: jest.fn(),
    fetchMyInfoHashes: jest.fn(),
    checkMyInfoHashes: jest.fn(),
  },
}))
jest.mock('src/app/modules/myinfo/myinfo.util')

describe('encrypt-submission.middleware', () => {
  describe('validatePaymentSubmission', () => {
    it('should return message key when payment settings have been updated', async () => {
      const mockReq = expressHandler.mockRequest({
        body: {
          paymentProducts: [{ data: { id: 'mock-product-id', quantity: 1 } }],
        },
      })
      mockReq.formsg = {
        formDef: {
          _id: 'mockFormId',
          toObject: () => ({
            _id: 'mockFormId',
            payments_field: {},
          }),
        },
      } as never

      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      await validatePaymentSubmission(mockReq as never, mockRes, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'The payment settings in this form have been updated. Please refresh and try again.',
        messageKey:
          'features.publicForm.backendErrors.submission.payment.settingsUpdated',
      })
    })
  })

  describe('validateStorageSubmission then encryptSubmission', () => {
    const { publicKey, secretKey } = formsgSdk.crypto.generate()

    const zipOf = async (files: Record<string, string | Buffer>) => {
      const zip = new JSZip()
      Object.entries(files).forEach(([name, content]) =>
        zip.file(name, content),
      )
      return zip.generateAsync({ type: 'nodebuffer' })
    }

    const attachment = (fieldId: string, content: Buffer, name: string) => ({
      _id: fieldId,
      fieldType: BasicField.Attachment,
      question: 'Attachment',
      answer: name,
      filename: name,
      content,
    })

    const submit = async (
      form: Record<string, unknown> & { form_fields: unknown[] },
      responses: unknown[],
    ) => {
      const req = expressHandler.mockRequest({
        body: { responses, version: 2.1 },
      })
      req.formsg = {
        formDef: {
          _id: new ObjectId(),
          responseMode: FormResponseMode.Encrypt,
          authType: FormAuthType.NIL,
          form_logics: [],
          ...form,
        },
        encryptedFormDef: { publicKey },
      } as never
      const res = expressHandler.mockResponse()
      const next = jest.fn()

      await validateStorageSubmission(req as never, res, next)
      if (next.mock.calls.length > 0) {
        await encryptSubmission(req as never, res, jest.fn())
      }
      return { req, res, next }
    }

    const storedResponses = async (
      ...args: Parameters<typeof submit>
    ): Promise<Record<string, unknown>[]> => {
      const { req, res, next } = await submit(...args)
      expect(res.status).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith()
      const { encryptedContent } = req.formsg!.encryptedPayload!
      return formsgSdk.crypto.decrypt(secretKey, {
        encryptedContent,
        version: 1,
      })!.responses as unknown as Record<string, unknown>[]
    }

    const multi = generateDefaultField(BasicField.Attachment, {
      allowMultiple: true,
    })

    it('names a multi-file zip by its question number after a MyInfo child, which is stored as a row per detail', async () => {
      jest.mocked(extractMyInfoLoginJwt).mockReturnValue(ok('jwt'))
      jest
        .mocked(MyInfoService.verifyLoginJwt)
        .mockReturnValue(ok({ uinFin: 'S1234567D' }) as never)
      jest
        .mocked(MyInfoService.fetchMyInfoHashes)
        .mockReturnValue(okAsync({}) as never)
      jest
        .mocked(MyInfoService.checkMyInfoHashes)
        .mockReturnValue(okAsync(new Set()) as never)
      const children = generateDefaultField(BasicField.Children, {
        myInfo: { attr: MyInfoAttribute.ChildrenBirthRecords },
        childrenSubFields: [
          MyInfoChildAttributes.ChildName,
          MyInfoChildAttributes.ChildDateOfBirth,
        ],
      } as never)

      const stored = await storedResponses(
        { authType: FormAuthType.MyInfo, form_fields: [children, multi] },
        [
          {
            _id: children._id,
            fieldType: BasicField.Children,
            answerArray: [['Tan Ah Kow', '01/01/2020']],
          },
          attachment(
            multi._id,
            await zipOf({ 'a.pdf': 'a', 'b.pdf': 'b' }),
            'attachments.zip',
          ),
        ],
      )

      expect(stored).toHaveLength(3)
      expect(stored[2]).toMatchObject({
        _id: multi._id,
        answer: 'Question 3.zip',
        answerArray: ['a.pdf', 'b.pdf'],
      })
    })

    it('counts a field hidden by logic, which is stored with a blank answer', async () => {
      const text = generateDefaultField(BasicField.ShortText)
      const yesNo = generateDefaultField(BasicField.YesNo)
      const showTextOnYes = {
        _id: new ObjectId().toHexString(),
        logicType: LogicType.ShowFields,
        conditions: [
          { field: yesNo._id, state: LogicConditionState.Equal, value: 'Yes' },
        ],
        show: [text._id],
      }

      const stored = await storedResponses(
        { form_fields: [text, multi, yesNo], form_logics: [showTextOnYes] },
        [
          { _id: text._id, fieldType: BasicField.ShortText, answer: '' },
          attachment(
            multi._id,
            await zipOf({ 'a.pdf': 'a', 'b.pdf': 'b' }),
            'attachments.zip',
          ),
          { _id: yesNo._id, fieldType: BasicField.YesNo, answer: 'No' },
        ],
      )

      expect(stored.map(({ _id }) => _id)).toEqual([
        text._id,
        multi._id,
        yesNo._id,
      ])
      expect(stored[1]).toMatchObject({ answer: 'Question 2.zip' })
    })

    it('accepts a multi-file answer holding a zip nested as deep as a single upload allows', async () => {
      const nestedZip = async (depth: number): Promise<Buffer> =>
        depth === 0
          ? zipOf({ 'a.pdf': 'a' })
          : zipOf({ [`level${depth}.zip`]: await nestedZip(depth - 1) })

      const stored = await storedResponses({ form_fields: [multi] }, [
        attachment(
          multi._id,
          await zipOf({ 'nested.zip': await nestedZip(3) }),
          'attachments.zip',
        ),
      ])

      expect(stored[0]).toMatchObject({
        answer: 'Question 1.zip',
        answerArray: ['nested.zip'],
      })
    })

    it('stores an ordinary attachment on a form without a multi-file field as before', async () => {
      const single = generateDefaultField(BasicField.Attachment)
      const text = generateDefaultField(BasicField.ShortText)

      const stored = await storedResponses({ form_fields: [text, single] }, [
        { _id: text._id, fieldType: BasicField.ShortText, answer: 'hi' },
        attachment(single._id, Buffer.from('%PDF-1.7'), 'report.pdf'),
      ])

      expect(stored).toEqual([
        {
          _id: text._id,
          fieldType: BasicField.ShortText,
          question: text.title,
          answer: 'hi',
        },
        {
          _id: single._id,
          fieldType: BasicField.Attachment,
          question: single.title,
          answer: 'report.pdf',
          isVisible: true,
        },
      ])
    })

    it('still rejects a file type that is not allowed on a single-file field sent with a list of files', async () => {
      const single = generateDefaultField(BasicField.Attachment)

      const { res, next } = await submit({ form_fields: [single] }, [
        {
          ...attachment(single._id, Buffer.from('MZ'), 'run.exe'),
          answerArray: ['a.pdf'],
        },
      ])

      expect(next).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
