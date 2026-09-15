import { BasicField, FormFieldDto, MyInfoAttribute } from 'formsg-shared/types'

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

const myInfoField = (_id: string, title: string): FormFieldDto =>
  ({
    ...textField(_id, title),
    myInfo: { attr: MyInfoAttribute.Name },
  }) as unknown as FormFieldDto

describe('buildV1EncryptedContent', () => {
  it('should prefix the question of a read-only MyInfo field, exactly as storage mode does', () => {
    // `question` is a consumer's join key and the CSV column name, so a bare
    // title where storage mode sent `[Myinfo] Name` is a compatibility break.
    const { publicKey, secretKey } = formsgSdk.crypto.generate()
    const v4Responses = {
      'field-1': {
        fieldType: BasicField.ShortText,
        answer: { value: 'Tan Ah Kow' },
      },
      'field-2': {
        fieldType: BasicField.ShortText,
        answer: { value: 'self-declared' },
      },
    }
    const formFields = [
      myInfoField('field-1', 'Name'),
      myInfoField('field-2', 'Mobile number'),
    ]

    const encryptedContent = buildV1EncryptedContent({
      v4Responses,
      formFields,
      formPublicKey: publicKey,
      // Only the first was read-only for this respondent; the second was
      // user-provided, so storage mode leaves it bare.
      myInfoReadOnlyFieldIds: ['field-1'],
      logMeta: LOG_META,
    })._unsafeUnwrap()

    const recovered = formsgSdk.crypto.decrypt(secretKey, {
      encryptedContent,
      version: V1_VERSION,
    })
    expect(recovered?.responses.map((entry) => entry.question)).toEqual([
      '[Myinfo] Name',
      'Mobile number',
    ])
  })

  it('should produce content the FORM secret key recovers, through the storage-mode class', () => {
    // Arrange
    const { publicKey, secretKey } = formsgSdk.crypto.generate()
    const formFields = [textField('field-1', 'Your name')]

    // Act
    const result = buildV1EncryptedContent({
      v4Responses: {
        'field-1': {
          fieldType: BasicField.ShortText,
          answer: { value: 'Tan Ah Kow' },
        },
      },
      formFields,
      formPublicKey: publicKey,
      myInfoReadOnlyFieldIds: [],
      logMeta: LOG_META,
    })

    // Assert: decrypting with `crypto` — the class an unmodified storage-mode
    // consumer uses — recovers the flat V1 array.
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
    // The right key with the wrong class is the silent failure this guards.
    // `cryptoV3.encrypt` encrypts the content to a fresh per-submission public
    // key and only wraps that submission key under the form key, so its
    // content is NOT openable with the form secret key — which is what an
    // unmodified storage-mode consumer has and all it has.
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
      formPublicKey: publicKey,
      myInfoReadOnlyFieldIds: [],
      logMeta: LOG_META,
    })._unsafeUnwrap()

    // Control: the same payload, the same key, the MRF class.
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
      formPublicKey: publicKey,
      myInfoReadOnlyFieldIds: [],
      logMeta: LOG_META,
    })._unsafeUnwrap()

    const recovered = formsgSdk.crypto.decrypt(secretKey, {
      encryptedContent,
      version: V1_VERSION,
    })
    expect(recovered?.responses[0].question).toBe('Your name')
  })

  it('should fail loud rather than throw when the flatten cannot represent a field', () => {
    // Children is out of scope for MRF, but its failure mode is not: an
    // unrepresentable field type must reject the submission with a real
    // error, not escape as an exception through the submit chain.
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
      formPublicKey: publicKey,
      myInfoReadOnlyFieldIds: [],
      logMeta: LOG_META,
    })

    expect(result.isErr()).toBe(true)
    const error = result._unsafeUnwrapErr()
    expect(error).toBeInstanceOf(V1ContentProductionError)
    expect(error.code).toBe(ErrorCodes.SUBMISSION_MRF_V1_CONTENT_PRODUCTION)
  })
})
