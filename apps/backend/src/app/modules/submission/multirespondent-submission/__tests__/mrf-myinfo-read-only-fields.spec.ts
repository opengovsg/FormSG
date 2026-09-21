import { ObjectId } from 'bson'
import {
  BasicField,
  FormAuthType,
  FormFieldDto,
  MyInfoAttribute,
} from 'formsg-shared/types'
import { errAsync, okAsync } from 'neverthrow'

import { createLoggerWithLabel } from 'src/app/config/logger'
import { ParsedClearFormFieldResponsesV4 } from 'src/types/api'

import { MyInfoMissingHashError } from '../../../myinfo/myinfo.errors'
import { MyInfoService } from '../../../myinfo/myinfo.service'
import { resolveMrfMyInfoReadOnlyFields } from '../myinfo-read-only-fields'

jest.mock('src/app/config/logger', () => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
  return { createLoggerWithLabel: () => logger }
})

const mockLogger = createLoggerWithLabel(module) as unknown as {
  info: jest.Mock
  warn: jest.Mock
  error: jest.Mock
}

const MOCK_UINFIN = 'S1234567A'
const MOCK_FORM_ID = new ObjectId().toHexString()

const NAME_FIELD_ID = new ObjectId().toHexString()
const MOBILE_FIELD_ID = new ObjectId().toHexString()
const PLAIN_FIELD_ID = new ObjectId().toHexString()

const myInfoField = (_id: string, attr: MyInfoAttribute): FormFieldDto =>
  ({
    _id,
    fieldType: BasicField.ShortText,
    title: `${attr} question`,
    myInfo: { attr },
  }) as unknown as FormFieldDto

const plainField = (_id: string): FormFieldDto =>
  ({
    _id,
    fieldType: BasicField.ShortText,
    title: 'a question the respondent typed into',
  }) as unknown as FormFieldDto

const answered = (...ids: string[]): ParsedClearFormFieldResponsesV4 =>
  Object.fromEntries(
    ids.map((id) => [
      id,
      { fieldType: BasicField.ShortText, answer: 'an answer' },
    ]),
  ) as unknown as ParsedClearFormFieldResponsesV4

const hashes = (...attrs: string[]) =>
  Object.fromEntries(attrs.map((attr) => [attr, 'a-bcrypt-hash']))

const resolve = (
  formFields: FormFieldDto[],
  responses: ParsedClearFormFieldResponsesV4,
) =>
  resolveMrfMyInfoReadOnlyFields({
    uinFin: MOCK_UINFIN,
    formId: MOCK_FORM_ID,
    authType: FormAuthType.MyInfo,
    formFields,
    responses,
  })

describe('resolveMrfMyInfoReadOnlyFields', () => {
  let fetchMyInfoHashesSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    fetchMyInfoHashesSpy = jest.spyOn(MyInfoService, 'fetchMyInfoHashes')
  })

  afterEach(() => jest.restoreAllMocks())

  it('returns the ids of the fields whose attributes were read-only', async () => {
    fetchMyInfoHashesSpy.mockReturnValue(
      okAsync(hashes(MyInfoAttribute.Name, MyInfoAttribute.MobileNo)),
    )

    const result = await resolve(
      [
        myInfoField(NAME_FIELD_ID, MyInfoAttribute.Name),
        myInfoField(MOBILE_FIELD_ID, MyInfoAttribute.MobileNo),
      ],
      answered(NAME_FIELD_ID, MOBILE_FIELD_ID),
    )

    expect(result).toEqual([NAME_FIELD_ID, MOBILE_FIELD_ID])
    expect(fetchMyInfoHashesSpy).toHaveBeenCalledWith(MOCK_UINFIN, MOCK_FORM_ID)
  })

  it('excludes a MyInfo field whose attribute was not read-only', async () => {
    fetchMyInfoHashesSpy.mockReturnValue(okAsync(hashes(MyInfoAttribute.Name)))

    const result = await resolve(
      [
        myInfoField(NAME_FIELD_ID, MyInfoAttribute.Name),
        myInfoField(MOBILE_FIELD_ID, MyInfoAttribute.MobileNo),
      ],
      answered(NAME_FIELD_ID, MOBILE_FIELD_ID),
    )

    expect(result).toEqual([NAME_FIELD_ID])
  })

  it('excludes a MyInfo field hidden by form logic', async () => {
    fetchMyInfoHashesSpy.mockReturnValue(
      okAsync(hashes(MyInfoAttribute.Name, MyInfoAttribute.MobileNo)),
    )

    const result = await resolve(
      [
        myInfoField(NAME_FIELD_ID, MyInfoAttribute.Name),
        myInfoField(MOBILE_FIELD_ID, MyInfoAttribute.MobileNo),
      ],
      answered(NAME_FIELD_ID),
    )

    expect(result).toEqual([NAME_FIELD_ID])
  })

  it('excludes a non-MyInfo field', async () => {
    fetchMyInfoHashesSpy.mockReturnValue(okAsync(hashes(MyInfoAttribute.Name)))

    const result = await resolve(
      [
        myInfoField(NAME_FIELD_ID, MyInfoAttribute.Name),
        plainField(PLAIN_FIELD_ID),
      ],
      answered(NAME_FIELD_ID, PLAIN_FIELD_ID),
    )

    expect(result).toEqual([NAME_FIELD_ID])
  })

  it('returns [] and logs when the hash record is missing', async () => {
    fetchMyInfoHashesSpy.mockReturnValue(errAsync(new MyInfoMissingHashError()))

    const result = await resolve(
      [myInfoField(NAME_FIELD_ID, MyInfoAttribute.Name)],
      answered(NAME_FIELD_ID),
    )

    expect(result).toEqual([])
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({
          action: 'resolveMrfMyInfoReadOnlyFields',
          formId: MOCK_FORM_ID,
          authType: FormAuthType.MyInfo,
        }),
      }),
    )
  })

  it('logs when read-only attributes match no snapshot field', async () => {
    fetchMyInfoHashesSpy.mockReturnValue(
      okAsync(hashes('childrenbirthrecords.0.childname')),
    )

    const result = await resolve(
      [myInfoField(NAME_FIELD_ID, MyInfoAttribute.Name)],
      answered(NAME_FIELD_ID),
    )

    expect(result).toEqual([])
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({
          action: 'resolveMrfMyInfoReadOnlyFields',
          formId: MOCK_FORM_ID,
        }),
      }),
    )
  })

  it('returns [] without logging when the form has no read-only attributes', async () => {
    fetchMyInfoHashesSpy.mockReturnValue(okAsync({}))

    const result = await resolve(
      [myInfoField(NAME_FIELD_ID, MyInfoAttribute.Name)],
      answered(NAME_FIELD_ID),
    )

    expect(result).toEqual([])
    expect(mockLogger.info).not.toHaveBeenCalled()
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })
})
