import { ObjectId } from 'bson'
import {
  BasicField,
  FormFieldDto,
  MyInfoAttribute,
  SubmissionType,
} from 'formsg-shared/types'
import { flattenV4ToFormFields } from 'formsg-shared/utils/flatten-v4-to-v1'
import { applyMyInfoPrefix } from 'formsg-shared/utils/myinfo-prefix'
import { PassThrough } from 'stream'

import { MultirespondentSubmissionData } from 'src/types'

import { addMrfMetadata } from '../../submission.service'
import {
  createMultirespondentSubmissionDto,
  createPublicMultirespondentSubmissionDto,
} from '../multirespondent-submission.utils'

const NAME_FIELD_ID = new ObjectId().toHexString()
const MOBILE_FIELD_ID = new ObjectId().toHexString()
const HIDDEN_FIELD_ID = new ObjectId().toHexString()
const PLAIN_FIELD_ID = new ObjectId().toHexString()

const myInfoField = (
  _id: string,
  attr: MyInfoAttribute,
  title: string,
): FormFieldDto =>
  ({
    _id,
    fieldType: BasicField.ShortText,
    title,
    description: '',
    required: false,
    disabled: true,
    myInfo: { attr },
  }) as unknown as FormFieldDto

const FORM_FIELDS: FormFieldDto[] = [
  myInfoField(NAME_FIELD_ID, MyInfoAttribute.Name, 'Name'),
  myInfoField(MOBILE_FIELD_ID, MyInfoAttribute.MobileNo, 'Mobile number'),
  myInfoField(HIDDEN_FIELD_ID, MyInfoAttribute.Sex, 'Sex'),
  {
    _id: PLAIN_FIELD_ID,
    fieldType: BasicField.ShortText,
    title: 'Anything else?',
    description: '',
    required: false,
    disabled: false,
  } as unknown as FormFieldDto,
]

const V4_RESPONSES = {
  [NAME_FIELD_ID]: { fieldType: BasicField.ShortText, answer: 'PHUA CHU KANG' },
  [MOBILE_FIELD_ID]: { fieldType: BasicField.ShortText, answer: '98765432' },
  [PLAIN_FIELD_ID]: { fieldType: BasicField.ShortText, answer: 'no' },
}

const READ_ONLY_FIELD_IDS = [NAME_FIELD_ID]

const submissionData = (
  myInfoReadOnlyFields?: string[],
): MultirespondentSubmissionData =>
  ({
    submissionType: SubmissionType.Multirespondent,
    _id: new ObjectId(),
    created: new Date(),
    submissionPublicKey: 'a public key',
    encryptedSubmissionSecretKey: 'an encrypted secret key',
    encryptedContent: 'some encrypted content',
    workflow: [],
    workflowStep: 0,
    form_fields: FORM_FIELDS,
    form_logics: [],
    attachmentMetadata: {},
    version: 3,
    mrfVersion: 3,
    submittedSteps: [],
    ...(myInfoReadOnlyFields === undefined ? {} : { myInfoReadOnlyFields }),
  }) as unknown as MultirespondentSubmissionData

const webhookQuestionsById = (
  readOnlyFieldIds: string[],
): Record<string, string> =>
  Object.fromEntries(
    applyMyInfoPrefix(
      flattenV4ToFormFields({
        formLogics: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        v4Responses: V4_RESPONSES as any,
        formFields: FORM_FIELDS,
      }),
      readOnlyFieldIds,
    ).map((entry) => [entry._id, entry.question]),
  )

const titlesById = (formFields: FormFieldDto[]): Record<string, string> =>
  Object.fromEntries(formFields.map((field) => [field._id, field.title]))

const throughMrfMetadata = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> =>
  new Promise((resolve) => {
    const input = new PassThrough()
    input.pipe(addMrfMetadata()).on('data', resolve)
    input.emit('data', data)
    input.end()
  })

describe('the MyInfo question prefix on the webhook and admin surfaces', () => {
  it('prefixes only the read-only, visible MyInfo field on the webhook', () => {
    const questions = webhookQuestionsById(READ_ONLY_FIELD_IDS)

    expect(questions[NAME_FIELD_ID]).toBe('[Myinfo] Name')
    expect(questions[MOBILE_FIELD_ID]).toBe('Mobile number')
    expect(questions[PLAIN_FIELD_ID]).toBe('Anything else?')
    expect(questions[HIDDEN_FIELD_ID]).toBe('Sex')
  })

  it('serves the individual response page the same question text', () => {
    const dto = createMultirespondentSubmissionDto(
      submissionData(READ_ONLY_FIELD_IDS),
      {},
    )

    const titles = titlesById(dto.form_fields)
    const questions = webhookQuestionsById(READ_ONLY_FIELD_IDS)
    expect(titles[NAME_FIELD_ID]).toBe(questions[NAME_FIELD_ID])
    expect(titles[MOBILE_FIELD_ID]).toBe(questions[MOBILE_FIELD_ID])
    expect(titles[PLAIN_FIELD_ID]).toBe(questions[PLAIN_FIELD_ID])
    expect(titles[HIDDEN_FIELD_ID]).toBe('Sex')
  })

  it('still prefixes Name when the snapshot field _id is an ObjectId', () => {
    const objectId = new ObjectId(NAME_FIELD_ID)
    const data = submissionData(READ_ONLY_FIELD_IDS)
    data.form_fields = data.form_fields.map((field) =>
      String(field._id) === NAME_FIELD_ID
        ? { ...field, _id: objectId as unknown as string }
        : field,
    )

    const dto = createMultirespondentSubmissionDto(data, {})
    const nameField = dto.form_fields.find(
      (field) => String(field._id) === NAME_FIELD_ID,
    )

    expect(nameField?.title).toBe('[Myinfo] Name')
  })

  it('serves the response download the same question text', async () => {
    const chunk = await throughMrfMetadata({
      ...submissionData(READ_ONLY_FIELD_IDS),
      submissionType: SubmissionType.Multirespondent,
    })

    const titles = titlesById(chunk.form_fields)
    expect(titles).toEqual(
      titlesById(
        createMultirespondentSubmissionDto(
          submissionData(READ_ONLY_FIELD_IDS),
          {},
        ).form_fields,
      ),
    )
    expect(titles[NAME_FIELD_ID]).toBe('[Myinfo] Name')
  })

  it('never ships myInfoReadOnlyFields on either admin surface', async () => {
    const dto = createMultirespondentSubmissionDto(
      submissionData(READ_ONLY_FIELD_IDS),
      {},
    )
    const chunk = await throughMrfMetadata(submissionData(READ_ONLY_FIELD_IDS))

    expect(JSON.stringify(dto)).not.toContain('myInfoReadOnlyFields')
    expect(chunk).not.toHaveProperty('myInfoReadOnlyFields')
  })

  it('prefixes nothing anywhere when the row field is absent', async () => {
    const dto = createMultirespondentSubmissionDto(submissionData(), {})
    const chunk = await throughMrfMetadata(submissionData())

    expect(titlesById(dto.form_fields)).toEqual(titlesById(FORM_FIELDS))
    expect(titlesById(chunk.form_fields)).toEqual(titlesById(FORM_FIELDS))
    expect(titlesById(FORM_FIELDS)).toEqual(webhookQuestionsById([]))
  })

  it('prefixes nothing anywhere when the row field is empty', async () => {
    const dto = createMultirespondentSubmissionDto(submissionData([]), {})
    const chunk = await throughMrfMetadata(submissionData([]))

    expect(titlesById(dto.form_fields)).toEqual(titlesById(FORM_FIELDS))
    expect(titlesById(chunk.form_fields)).toEqual(titlesById(FORM_FIELDS))
  })

  it('shows a later step respondent their own unprefixed field labels', () => {
    const publicDto = createPublicMultirespondentSubmissionDto(
      submissionData(READ_ONLY_FIELD_IDS),
      {},
    )

    expect(titlesById(publicDto.form_fields)).toEqual(titlesById(FORM_FIELDS))
    expect(JSON.stringify(publicDto)).not.toContain('[Myinfo]')
  })

  it('leaves the stored snapshot itself unprefixed', () => {
    const data = submissionData(READ_ONLY_FIELD_IDS)
    createMultirespondentSubmissionDto(data, {})

    expect(titlesById(data.form_fields as FormFieldDto[])).toEqual(
      titlesById(FORM_FIELDS),
    )
    expect(FORM_FIELDS.map((field) => field.title)).toEqual([
      'Name',
      'Mobile number',
      'Sex',
      'Anything else?',
    ])
  })
})
