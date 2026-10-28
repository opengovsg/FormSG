import { BasicField, FormFieldDto, MyInfoAttribute } from 'formsg-shared/types'

import { WebhookData } from 'src/types/submission'

import { buildV4Snapshot } from '../submission-snapshot.producer'
import { parseSnapshot } from '../submission-snapshot.schema'
import { buildWebhookFormFields } from '../webhook-form-fields'
import {
  reconstructMrfWebhookData,
  reconstructV1WebhookData,
} from '../webhook-reconstruction'

describe('V4 webhook field metadata', () => {
  const fields = [
    {
      _id: 'name',
      title: 'Original name question',
      fieldType: BasicField.ShortText,
      description: 'Not webhook metadata',
    },
    {
      _id: 'household',
      title: 'Household members',
      fieldType: BasicField.Table,
      columns: [
        { _id: 'member', title: 'Name', columnType: BasicField.ShortText },
        {
          _id: 'relation',
          title: 'Relationship',
          columnType: BasicField.Dropdown,
        },
      ],
    },
    {
      _id: 'address',
      title: 'Address',
      fieldType: BasicField.Address,
    },
    {
      _id: 'children',
      title: 'Children',
      fieldType: BasicField.Children,
      myInfo: { attr: MyInfoAttribute.ChildrenBirthRecords },
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

  it('includes only question titles and table column names and keeps them unchanged after form edits', () => {
    // Prepare: form fields also contain configuration that must not enter the metadata map.
    const source = structuredClone(fields)

    // Act: build the metadata, then change the original form definition.
    const metadata = buildWebhookFormFields(source)
    source[0].title = 'Edited question'
    const table = source.find((field) => field.fieldType === BasicField.Table)
    if (table?.fieldType !== BasicField.Table) throw new Error('Expected table')
    table.columns[0].title = 'Edited column'
    table.columns.reverse()

    // Assert: titles and column names are unchanged; other field settings are omitted.
    expect(metadata).toEqual({
      name: { question: 'Original name question' },
      country: { question: 'Birth country' },
      household: {
        question: 'Household members',
        subFields: {
          member: { question: 'Name' },
          relation: { question: 'Relationship' },
        },
      },
      address: { question: 'Address' },
      children: { question: 'Children' },
    })
  })

  it('returns an empty metadata map when the saved form has no fields', () => {
    expect(buildWebhookFormFields([])).toEqual({})
  })

  it('prefixes [Myinfo] on questions of fields in myInfoReadOnlyFields', () => {
    const metadata = buildWebhookFormFields(fields, ['country', 'children'])

    expect(metadata.country).toEqual({ question: '[Myinfo] Birth country' })
    expect(metadata.children).toEqual({ question: '[Myinfo] Children' })
    expect(metadata.name).toEqual({ question: 'Original name question' })
  })

  it('does not prefix a read-only field without a Myinfo or Corppass attribute', () => {
    const metadata = buildWebhookFormFields(fields, ['name'])

    expect(metadata.name).toEqual({ question: 'Original name question' })
    expect(metadata.country).toEqual({ question: 'Birth country' })
  })

  it('uses question titles and table column names from the saved snapshot after form edits', () => {
    // Prepare: the form has been edited since the snapshot was saved.
    const source = structuredClone(fields)
    const formFields = buildWebhookFormFields(source)
    const table = source.find((field) => field.fieldType === BasicField.Table)
    if (table?.fieldType !== BasicField.Table) throw new Error('Expected table')
    table.columns[0].title = 'Edited column'
    source[0].title = 'Edited question'
    const editedLiveData = {
      ...liveData,
      formFields: buildWebhookFormFields(source),
    }
    const snapshot = parseSnapshot(
      JSON.stringify(buildV4Snapshot({ ...snapshotInput, formFields })),
    )._unsafeUnwrap()
    if (snapshot.contentFormat !== 'v4') throw new Error('Expected V4 snapshot')

    // Act: reconstruct the delivery from the persisted snapshot.
    const output = reconstructMrfWebhookData({
      liveData: editedLiveData,
      snapshot,
      submissionIndex: 0,
      policy,
    })._unsafeUnwrap()

    // Assert: the webhook uses the saved titles, column names, and encrypted content.
    expect(output.formFields).toEqual({
      name: { question: 'Original name question' },
      country: { question: 'Birth country' },
      household: {
        question: 'Household members',
        subFields: {
          member: { question: 'Name' },
          relation: { question: 'Relationship' },
        },
      },
      address: { question: 'Address' },
      children: { question: 'Children' },
    })
    expect(output.encryptedContent).toBe('original-content')
    expect(editedLiveData.formFields.name.question).toBe('Edited question')
  })

  it('uses question titles from the submission when no saved snapshot is available', () => {
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
  ])('keeps formFields unchanged for $scenario', ({ metadata, expected }) => {
    // Prepare: the submission has question titles that are absent from the snapshot.
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

    // Assert: missing metadata stays absent, and an empty map stays empty.
    expect(serialized.formFields).toEqual(expected)
    expect(Object.hasOwn(serialized, 'formFields')).toBe(expected !== undefined)
  })

  it('does not add table column names to a saved snapshot that contains only question titles', () => {
    const formFields = {
      household: { question: 'Original household question' },
    }
    const snapshot = parseSnapshot(
      JSON.stringify(buildV4Snapshot({ ...snapshotInput, formFields })),
    )._unsafeUnwrap()
    if (snapshot.contentFormat !== 'v4') throw new Error('Expected V4 snapshot')

    const output = reconstructMrfWebhookData({
      liveData: { ...liveData, formFields: buildWebhookFormFields(fields) },
      snapshot,
      submissionIndex: 0,
      policy,
    })._unsafeUnwrap()

    expect(output.formFields).toStrictEqual(formFields)
  })

  it.each([
    {
      scenario: 'a missing table column name',
      entry: { question: 'Table', subFields: { column: {} } },
    },
    {
      scenario: 'a table column name that is not a string',
      entry: { question: 'Table', subFields: { column: { question: 42 } } },
    },
    { scenario: 'a missing question title', entry: {} },
    {
      scenario: 'a question title that is not a string',
      entry: { question: 42 },
    },
  ])('rejects snapshot metadata with $scenario', ({ entry }) => {
    const rawSnapshot = JSON.stringify({
      ...buildV4Snapshot({ ...snapshotInput, formFields: {} }),
      formFields: { name: entry },
    })
    expect(parseSnapshot(rawSnapshot).isErr()).toBe(true)
  })

  it('omits formFields from V1 webhooks', () => {
    // Act: reconstruct a V1 webhook from a submission with question titles.
    const output = reconstructV1WebhookData({
      liveData,
      snapshot: { ...snapshotInput, _v: 1, contentFormat: 'v1' },
    })

    // Assert
    expect(output).not.toHaveProperty('formFields')
  })
})
