import {
  BasicField,
  FormFieldDto,
  LogicConditionState,
  LogicDto,
  LogicType,
} from 'formsg-shared/types'

import formsgSdk from 'src/app/config/formsg-sdk'
import { ErrorCodes } from 'src/app/modules/core/core.errors'

import { V1ContentProductionError } from '../submission-snapshot.errors'
import { buildV1EncryptedContent } from '../v1-content.producer'

const LOG_META = { formId: 'form-1', submissionId: 'sub-1' }

const textField = (_id: string, title: string): FormFieldDto =>
  ({
    _id,
    title,
    fieldType: BasicField.ShortText,
    description: '',
    required: true,
    disabled: false,
    ValidationOptions: { customVal: null, selectedValidation: null },
  }) as unknown as FormFieldDto

const V1_VERSION = 2.1

describe('buildV1EncryptedContent', () => {
  it("should resolve visibility from the row's own logic, not treat every field as shown", () => {
    const { publicKey, secretKey } = formsgSdk.crypto.generate()
    const formFields = [
      {
        ...textField('gate', 'Do you live in Singapore?'),
        fieldType: BasicField.YesNo,
      } as unknown as FormFieldDto,
      {
        ...textField('addr', 'Your address'),
        fieldType: BasicField.Address,
        required: false,
      } as unknown as FormFieldDto,
    ]
    const formLogics: LogicDto[] = [
      {
        _id: 'logic-1',
        logicType: LogicType.ShowFields,
        conditions: [
          { field: 'gate', state: LogicConditionState.Equal, value: 'Yes' },
        ],
        show: ['addr'],
      },
    ]
    const v4Responses = {
      gate: { fieldType: BasicField.YesNo, answer: { value: 'No' } },
    }

    const withLogic = formsgSdk.crypto.decrypt(secretKey, {
      encryptedContent: buildV1EncryptedContent({
        v4Responses,
        formFields,
        formLogics,
        formPublicKey: publicKey,
        myInfoReadOnlyFieldIds: [],
        logMeta: LOG_META,
      })._unsafeUnwrap(),
      version: V1_VERSION,
    })
    const withoutLogic = formsgSdk.crypto.decrypt(secretKey, {
      encryptedContent: buildV1EncryptedContent({
        v4Responses,
        formFields,
        formLogics: [],
        formPublicKey: publicKey,
        myInfoReadOnlyFieldIds: [],
        logMeta: LOG_META,
      })._unsafeUnwrap(),
      version: V1_VERSION,
    })

    const addressOf = (content: typeof withLogic) =>
      content?.responses.find((response) => response._id === 'addr')

    expect(addressOf(withLogic)?.answerArray).toEqual([])
    expect(addressOf(withoutLogic)?.answerArray).toEqual([
      '',
      '',
      '',
      '',
      '',
      '',
    ])
  })

  it('should produce content the FORM secret key recovers, through the storage-mode class', () => {
    const { publicKey, secretKey } = formsgSdk.crypto.generate()
    const formFields = [textField('field-1', 'Your name')]

    const result = buildV1EncryptedContent({
      v4Responses: {
        'field-1': {
          fieldType: BasicField.ShortText,
          answer: { value: 'Tan Ah Kow' },
        },
      },
      formFields,
      formLogics: [],
      formPublicKey: publicKey,
      logMeta: LOG_META,
    })

    expect(result.isOk()).toBe(true)
    const recovered = formsgSdk.crypto.decrypt(secretKey, {
      encryptedContent: result._unsafeUnwrap(),
      version: V1_VERSION,
    })
    expect(recovered?.responses).toEqual([
      {
        _id: 'field-1',
        question: 'Your name',
        answer: 'Tan Ah Kow',
        fieldType: BasicField.ShortText,
      },
    ])
  })

  it('should encrypt with the storage-mode class, not the MRF one', () => {
    const { publicKey, secretKey } = formsgSdk.crypto.generate()
    const v4Responses = {
      'field-1': {
        fieldType: BasicField.ShortText,
        answer: { value: 'Tan Ah Kow' },
      },
    }
    const formFields = [textField('field-1', 'Your name')]

    const ours = buildV1EncryptedContent({
      v4Responses,
      formFields,
      formLogics: [],
      formPublicKey: publicKey,
      logMeta: LOG_META,
    })._unsafeUnwrap()

    const wrongClass = formsgSdk.cryptoV3.encrypt(v4Responses, publicKey)

    expect(
      formsgSdk.crypto.decrypt(secretKey, {
        encryptedContent: ours,
        version: V1_VERSION,
      }),
    ).not.toBeNull()
    expect(
      formsgSdk.crypto.decrypt(secretKey, {
        encryptedContent: wrongClass.encryptedContent,
        version: V1_VERSION,
      }),
    ).toBeNull()
  })

  it('should take question text from the snapshot, ignoring any the respondent supplied', () => {
    const { publicKey, secretKey } = formsgSdk.crypto.generate()

    const encryptedContent = buildV1EncryptedContent({
      v4Responses: {
        'field-1': {
          fieldType: BasicField.ShortText,
          answer: { value: 'Tan Ah Kow' },
          question: 'Anything I like',
        },
      },
      formFields: [textField('field-1', 'Your name')],
      formLogics: [],
      formPublicKey: publicKey,
      logMeta: LOG_META,
    })._unsafeUnwrap()

    const recovered = formsgSdk.crypto.decrypt(secretKey, {
      encryptedContent,
      version: V1_VERSION,
    })
    expect(recovered?.responses[0].question).toBe('Your name')
  })

  it('should fail loud rather than throw when the flatten cannot represent a field', () => {
    const { publicKey } = formsgSdk.crypto.generate()

    const result = buildV1EncryptedContent({
      v4Responses: {
        'field-1': {
          fieldType: BasicField.Children,
          answer: { child: [['Child Name']], childFields: ['childname'] },
        },
      },
      formFields: [
        {
          ...textField('field-1', 'Children'),
          fieldType: BasicField.Children,
        } as unknown as FormFieldDto,
      ],
      formLogics: [],
      formPublicKey: publicKey,
      logMeta: LOG_META,
    })

    expect(result.isErr()).toBe(true)
    const error = result._unsafeUnwrapErr()
    expect(error).toBeInstanceOf(V1ContentProductionError)
    expect(error.code).toBe(ErrorCodes.SUBMISSION_MRF_V1_CONTENT_PRODUCTION)
  })
})
