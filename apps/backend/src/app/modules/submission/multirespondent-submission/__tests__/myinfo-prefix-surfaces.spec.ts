/**
 * One input, three consumers: the persisted `myInfoReadOnlyFields` has to
 * produce the same `[Myinfo] ` question text on the V1 wire, in the admin CSV
 * header and on the individual response page — and none at all for a later
 * step's respondent.
 *
 * The wire side is asserted against storage mode itself in
 * `submission/__tests__/flattenV4ToV1.parity.spec.ts`; here the wire is the
 * reference and the two admin surfaces are the candidates, so a change to one
 * of them cannot silently diverge from what the webhook delivered.
 */
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

/**
 * `Sex` is deliberately absent: the field is hidden by form logic, so the
 * respondent submitted no answer for it. That is the MRF equivalent of storage
 * mode's `isVisible` clause, which excludes a hidden MyInfo field from the
 * prefix.
 */
const V4_RESPONSES = {
  [NAME_FIELD_ID]: { fieldType: BasicField.ShortText, answer: 'PHUA CHU KANG' },
  [MOBILE_FIELD_ID]: { fieldType: BasicField.ShortText, answer: '98765432' },
  [PLAIN_FIELD_ID]: { fieldType: BasicField.ShortText, answer: 'no' },
}

/** Only Name came back from MyInfo as read-only for this respondent. */
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

/** The question text the V1 webhook payload carries, per field id. */
const wireQuestionsById = (
  readOnlyFieldIds: string[],
): Record<string, string> =>
  Object.fromEntries(
    applyMyInfoPrefix(
      flattenV4ToFormFields({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        v4Responses: V4_RESPONSES as any,
        formFields: FORM_FIELDS,
      }),
      readOnlyFieldIds,
    ).map((entry) => [entry._id, entry.question]),
  )

const titlesById = (formFields: FormFieldDto[]): Record<string, string> =>
  Object.fromEntries(formFields.map((field) => [field._id, field.title]))

/** One chunk through the response-download stream transform. */
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

describe('the MyInfo question prefix on the wire and both admin surfaces', () => {
  it('prefixes only the read-only, visible MyInfo field on the wire', () => {
    // Act
    const questions = wireQuestionsById(READ_ONLY_FIELD_IDS)

    // Assert: MobileNo is a MyInfo field but was user-provided, and Sex is
    // hidden, so neither is prefixed.
    expect(questions[NAME_FIELD_ID]).toBe('[Myinfo] Name')
    expect(questions[MOBILE_FIELD_ID]).toBe('Mobile number')
    expect(questions[PLAIN_FIELD_ID]).toBe('Anything else?')
    expect(questions[HIDDEN_FIELD_ID]).toBe('Sex')
  })

  it('serves the individual response page the same question text as the wire', () => {
    // Act
    const dto = createMultirespondentSubmissionDto(
      submissionData(READ_ONLY_FIELD_IDS),
      {},
    )

    // Assert
    const titles = titlesById(dto.form_fields)
    const questions = wireQuestionsById(READ_ONLY_FIELD_IDS)
    expect(titles[NAME_FIELD_ID]).toBe(questions[NAME_FIELD_ID])
    expect(titles[MOBILE_FIELD_ID]).toBe(questions[MOBILE_FIELD_ID])
    expect(titles[PLAIN_FIELD_ID]).toBe(questions[PLAIN_FIELD_ID])
    // Hidden field: the wire carries a bare entry for it, and so does the
    // snapshot the CSV header is built from.
    expect(titles[HIDDEN_FIELD_ID]).toBe('Sex')
  })

  it('serves the response download the same question text as the wire', async () => {
    // Act
    const chunk = await throughMrfMetadata({
      ...submissionData(READ_ONLY_FIELD_IDS),
      submissionType: SubmissionType.Multirespondent,
    })

    // Assert
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
    // Act
    const dto = createMultirespondentSubmissionDto(
      submissionData(READ_ONLY_FIELD_IDS),
      {},
    )
    const chunk = await throughMrfMetadata(submissionData(READ_ONLY_FIELD_IDS))

    // Assert: the row field is the server's input to the prefix, not a
    // consumer's data.
    expect(JSON.stringify(dto)).not.toContain('myInfoReadOnlyFields')
    expect(chunk).not.toHaveProperty('myInfoReadOnlyFields')
  })

  it('prefixes nothing anywhere when the row field is absent', async () => {
    // Arrange: a row predating this feature, or a form without MyInfo auth.
    // Act
    const dto = createMultirespondentSubmissionDto(submissionData(), {})
    const chunk = await throughMrfMetadata(submissionData())

    // Assert
    expect(titlesById(dto.form_fields)).toEqual(titlesById(FORM_FIELDS))
    expect(titlesById(chunk.form_fields)).toEqual(titlesById(FORM_FIELDS))
    expect(titlesById(FORM_FIELDS)).toEqual(wireQuestionsById([]))
  })

  it('prefixes nothing anywhere when the row field is empty', async () => {
    // Arrange: the resolution ran and matched nothing. Behaves identically to
    // absent at read time; the distinction only exists for diagnosis.
    // Act
    const dto = createMultirespondentSubmissionDto(submissionData([]), {})
    const chunk = await throughMrfMetadata(submissionData([]))

    // Assert
    expect(titlesById(dto.form_fields)).toEqual(titlesById(FORM_FIELDS))
    expect(titlesById(chunk.form_fields)).toEqual(titlesById(FORM_FIELDS))
  })

  it('shows a later step respondent their own unprefixed field labels', () => {
    // Act
    const publicDto = createPublicMultirespondentSubmissionDto(
      submissionData(READ_ONLY_FIELD_IDS),
      {},
    )

    // Assert: the stored snapshot is unprefixed, and the public DTO is built
    // from it — a step-2 respondent must not see `[Myinfo] Name` as the label
    // of a field they are filling in.
    expect(titlesById(publicDto.form_fields)).toEqual(titlesById(FORM_FIELDS))
    expect(JSON.stringify(publicDto)).not.toContain('[Myinfo]')
  })

  it('leaves the stored snapshot itself unprefixed', () => {
    // Act
    const data = submissionData(READ_ONLY_FIELD_IDS)
    createMultirespondentSubmissionDto(data, {})

    // Assert: the prefix is applied on the way out, never written back — the
    // snapshot is what later steps are rendered and validated against.
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
