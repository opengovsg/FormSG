import type { FormField } from '@opengovsg/formsg-sdk/dist/types'

import { BasicField, FormFieldDto } from 'formsg-shared/types'
import { FieldResponse } from 'formsg-shared/types/response'

import { FormFieldValues } from '~templates/Field'

import { augmentDecryptedResponses } from '~features/admin-form/responses/ResponsesPage/storage/utils/augmentDecryptedResponses'
import { EncryptedResponseCsvGenerator } from '~features/admin-form/responses/ResponsesPage/storage/utils/EncryptedResponseCsvGenerator'

import { createClearSubmissionFormData } from '../createSubmission'

import {
  ALL_FIELD_TYPES,
  buildAllFields,
  buildAnsweredInput,
  buildAnsweredInputs,
  buildField,
  buildUnansweredInputs,
  FIELD_IDS,
} from './storageModeFixture'

/**
 * [STEERING:T2a] Locks the bytes that storage mode produces today, before the
 * value rules and `validateResponses` move into `formsg-shared`. The committed
 * snapshots are the only artifact that actually proves the move is a no-op.
 *
 * Delete this file once #9974 is merged and verified — the permanent
 * per-field-type value-rule table is the ongoing guard.
 */

/**
 * The storage-mode V1 producer, observed at its real boundary: the JSON body
 * that `createClearSubmissionFormData` hands to the server, which is what gets
 * encrypted into `encryptedContent`.
 */
const storageModeResponsesJson = (
  formFields: FormFieldDto[],
  formInputs: FormFieldValues,
): string => {
  const formData = createClearSubmissionFormData({ formFields, formInputs })
  const body = formData.get('body')
  if (typeof body !== 'string') throw new Error('expected a string body')
  return JSON.stringify(
    (JSON.parse(body) as { responses: FieldResponse[] }).responses,
  )
}

const storageModeResponses = (
  formFields: FormFieldDto[],
  formInputs: FormFieldValues,
): FieldResponse[] =>
  JSON.parse(storageModeResponsesJson(formFields, formInputs))

/**
 * The admin CSV download, driven from the same responses array an admin would
 * have decrypted.
 */
const adminCsv = (responses: FieldResponse[]): string => {
  const generator = new EncryptedResponseCsvGenerator(1, 5, false)
  try {
    generator.addRecord({
      record: augmentDecryptedResponses(
        responses as unknown as FormField[],
        {},
      ),
      created: '2026-09-09T13:12:14',
      submissionId: 'mockSubmissionId',
    })
  } catch (e) {
    // The Children field's `string[][]` answerArray has no CSV response class,
    // so the generator rejects it today. That rejection is part of the current
    // behaviour this snapshot locks; it must not silently start or stop.
    return `THREW: ${(e as Error).message}`
  }
  generator.sort()
  generator.process()
  generator.addMetaDataFromSubmission(0, 0)
  return generator.records.join('')
}

describe('[STEERING:T2a] phase 1 is a no-op', () => {
  it('produces the same storage-mode responses array for an answered form of every field type', () => {
    expect(
      storageModeResponsesJson(buildAllFields(), buildAnsweredInputs()),
    ).toMatchSnapshot()
  })

  it('produces the same storage-mode responses array for an unanswered form of every field type', () => {
    expect(
      storageModeResponsesJson(buildAllFields(), buildUnansweredInputs()),
    ).toMatchSnapshot()
  })

  describe.each(ALL_FIELD_TYPES)('%s', (fieldType) => {
    const formFields = [buildField(fieldType)]
    const answeredInput = buildAnsweredInput(fieldType)
    const answeredInputs = (
      answeredInput === undefined
        ? {}
        : { [FIELD_IDS[fieldType]]: answeredInput }
    ) as FormFieldValues

    it('produces the same storage-mode responses array', () => {
      expect(
        storageModeResponsesJson(formFields, answeredInputs),
      ).toMatchSnapshot()
    })

    it('produces the same storage-mode responses array when unanswered', () => {
      expect(
        storageModeResponsesJson(formFields, buildUnansweredInputs()),
      ).toMatchSnapshot()
    })

    it('produces the same admin CSV download', () => {
      expect(
        adminCsv(storageModeResponses(formFields, answeredInputs)),
      ).toMatchSnapshot()
    })

    it('produces the same admin CSV download when unanswered', () => {
      expect(
        adminCsv(storageModeResponses(formFields, buildUnansweredInputs())),
      ).toMatchSnapshot()
    })
  })

  it('excludes Statement and Image from the responses array', () => {
    const responses = storageModeResponses(
      buildAllFields(),
      buildAnsweredInputs(),
    )
    const emitted = responses.map((r) => r.fieldType)
    expect(emitted).not.toContain(BasicField.Statement)
    expect(emitted).not.toContain(BasicField.Image)
  })
})
