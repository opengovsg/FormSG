import { BasicField, FormFieldDto, MyInfoAttribute } from 'formsg-shared/types'

import { WebhookData } from 'src/types/submission'

import { buildV4Snapshot } from '../submission-snapshot.producer'
import { parseSnapshot } from '../submission-snapshot.schema'
import { buildWebhookFormFields } from '../webhook-form-fields'
import {
  reconstructMrfWebhookData,
  reconstructV1WebhookData,
} from '../webhook-reconstruction'

describe('V4 webhook question metadata', () => {
  const fields = [
    {
      _id: 'name',
      title: 'Original name question',
      fieldType: BasicField.ShortText,
      description: 'Not webhook metadata',
    },
    {
      _id: 'country',
      title: 'Birth country',
      fieldType: BasicField.Dropdown,
      myInfo: { attr: MyInfoAttribute.BirthCountry },
    },
  ] as FormFieldDto[]

  const liveData: WebhookData = {
    formId: 'form',
    submissionId: 'submission',
    encryptedContent: 'new-content',
    verifiedContent: undefined,
    version: 4,
    created: new Date('2026-10-05T00:00:00.000Z'),
    attachmentDownloadUrls: {},
    formFields: { name: { question: 'Edited question' } },
  }
  const snapshotInput = {
    formId: 'form',
    submissionId: 'submission',
    submissionIndex: 0,
    workflowStep: 0,
    encryptedContent: 'original-content',
    encryptedSubmissionSecretKey: 'key',
    createdAt: '2026-10-05T00:00:00.000Z',
  }
  const policy = {
    contentFormat: 'v4' as const,
    includeEncryptedSubmissionSecretKey: true,
  }

  it('exports only question labels and keeps them unchanged after the source form is edited', () => {
    // Prepare: form fields also contain configuration that must not enter the metadata map.
    const source = structuredClone(fields)

    // Act: build the metadata, then change the original form definition.
    const metadata = buildWebhookFormFields(source)
    source[0].title = 'Edited question'

    // Assert: labels remain frozen and neither descriptions nor MyInfo attributes are exported.
    expect(metadata).toEqual({
      name: { question: 'Original name question' },
      country: { question: 'Birth country' },
    })
  })

  it('returns an empty metadata map when the saved form has no fields', () => {
    expect(buildWebhookFormFields([])).toEqual({})
  })

  it('replays the original question titles after snapshot serialization', () => {
    // Prepare: the live row has a newer question than the persisted snapshot.
    const formFields = buildWebhookFormFields(fields)
    const snapshot = parseSnapshot(
      JSON.stringify(buildV4Snapshot({ ...snapshotInput, formFields })),
    )._unsafeUnwrap()
    if (snapshot.contentFormat !== 'v4') throw new Error('Expected V4 snapshot')

    // Act: reconstruct the delivery from the persisted snapshot.
    const output = reconstructMrfWebhookData({
      liveData,
      snapshot,
      submissionIndex: 0,
      policy,
    })._unsafeUnwrap()

    // Assert: the replay uses the old labels and content without modifying the live row.
    expect(output.formFields).toEqual({
      name: { question: 'Original name question' },
      country: { question: 'Birth country' },
    })
    expect(output.encryptedContent).toBe('original-content')
    expect(liveData.formFields?.name.question).toBe('Edited question')
  })

  it('includes live-row question metadata when no delivery snapshot is used', () => {
    // Act
    const output = reconstructMrfWebhookData({
      liveData,
      snapshot: undefined,
      submissionIndex: undefined,
      policy,
    })._unsafeUnwrap()

    // Assert
    expect(output.formFields).toEqual(liveData.formFields)
  })

  it.each([
    {
      scenario: 'an older snapshot without metadata',
      metadata: undefined,
      expected: undefined,
    },
    {
      scenario: 'a snapshot with an empty metadata map',
      metadata: {},
      expected: {},
    },
  ])('does not borrow live labels for $scenario', ({ metadata, expected }) => {
    // Prepare: both cases must be distinguished from a live row containing newer labels.
    const persisted = buildV4Snapshot({ ...snapshotInput, formFields: {} })
    // Older persisted objects predate the producer's required formFields input.
    const snapshot = { ...persisted, formFields: metadata }

    // Act
    const output = reconstructMrfWebhookData({
      liveData,
      snapshot,
      submissionIndex: 0,
      policy,
    })._unsafeUnwrap()
    const serialized = JSON.parse(JSON.stringify(output))

    // Assert: legacy absence and an explicitly empty map retain their wire representation.
    expect(serialized.formFields).toEqual(expected)
    expect(Object.hasOwn(serialized, 'formFields')).toBe(expected !== undefined)
  })

  it.each([
    { scenario: 'missing question text', entry: {} },
    { scenario: 'non-string question text', entry: { question: 42 } },
  ])('rejects snapshot metadata with $scenario', ({ entry }) => {
    const rawSnapshot = JSON.stringify({
      ...buildV4Snapshot({ ...snapshotInput, formFields: {} }),
      formFields: { name: entry },
    })
    expect(parseSnapshot(rawSnapshot).isErr()).toBe(true)
  })

  it('omits V4 question metadata when reconstructing a legacy V1 delivery', () => {
    // Act: the live row contains metadata, but the selected delivery format is V1.
    const output = reconstructV1WebhookData({
      liveData,
      snapshot: { ...snapshotInput, _v: 1, contentFormat: 'v1' },
    })

    // Assert
    expect(output).not.toHaveProperty('formFields')
  })
})
