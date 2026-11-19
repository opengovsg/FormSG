import {
  generateDefaultField,
  generateNewAttachmentResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'
import { BasicField } from 'formsg-shared/types'
import * as FileValidation from 'formsg-shared/utils/file-validation'
import JSZip from 'jszip'

import {
  getMultiAttachmentFilenames,
  nameMultiAttachmentAnswersV4,
  nameMultiAttachmentResponses,
  readMultiAttachmentResponses,
} from 'src/app/modules/submission/multi-attachment'
import { InvalidMultiAttachmentError } from 'src/app/modules/submission/submission.errors'
import { IPopulatedForm } from 'src/types'
import {
  ParsedClearAttachmentAnswerV4,
  ParsedClearFormFieldResponse,
} from 'src/types/api'

jest.mock('formsg-shared/utils/file-validation', () => ({
  ...jest.requireActual('formsg-shared/utils/file-validation'),
  inspectZip: jest.fn(),
}))
const MockInspectZip = jest.mocked(FileValidation.inspectZip)
const { inspectZip, getInvalidFileExtensionsInZip } = jest.requireActual<
  typeof FileValidation
>('formsg-shared/utils/file-validation')

const zipOf = (entryNames: string[], invalidExtensions: string[] = []) => ({
  entryNames,
  entryCount: entryNames.length,
  isUncompressed: true,
  hasExtraBytes: false,
  getInvalidExtensions: jest.fn().mockResolvedValue(invalidExtensions),
})

const zipFiles = (files: Record<string, string | Buffer>) => {
  const zip = new JSZip()
  Object.entries(files).forEach(([name, content]) => zip.file(name, content))
  return zip.generateAsync({ type: 'nodebuffer' })
}

/** A zip of `count` files that all share one name, which JSZip can't write. */
const zipFilesWithOneName = async (count: number) => {
  const names = Array.from(
    { length: count },
    (_, i) => `${String(i).padStart(2, '0')}.pdf`,
  )
  const zip = await zipFiles(Object.fromEntries(names.map((n) => [n, 'x'])))
  for (const name of names) {
    for (
      let at = zip.indexOf(name);
      at !== -1;
      at = zip.indexOf(name, at + 1)
    ) {
      zip.write('00.pdf', at)
    }
  }
  return zip
}

const nestedZip = async (depth: number): Promise<Buffer> =>
  depth === 0
    ? zipFiles({ 'a.pdf': 'a' })
    : zipFiles({ [`level${depth}.zip`]: await nestedZip(depth - 1) })

const [section, text, statement, multi, single] = [
  generateDefaultField(BasicField.Section),
  generateDefaultField(BasicField.ShortText),
  generateDefaultField(BasicField.Statement),
  generateDefaultField(BasicField.Attachment, { allowMultiple: true }),
  generateDefaultField(BasicField.Attachment),
]
const form = {
  form_fields: [section, text, statement, multi, single],
} as unknown as Pick<IPopulatedForm, 'form_fields'>

describe('multi-attachment', () => {
  beforeEach(() => {
    MockInspectZip.mockResolvedValue(zipOf(['a.pdf', 'b.jpg']))
  })

  describe('getMultiAttachmentFilenames', () => {
    it('lists the files in the zip in order', async () => {
      MockInspectZip.mockResolvedValueOnce(zipOf(['b.jpg', 'a.pdf']))

      const result = await getMultiAttachmentFilenames(Buffer.from(''))

      expect(result._unsafeUnwrap()).toEqual(['b.jpg', 'a.pdf'])
    })

    it.each([
      ['a folder', zipOf(['docs/'])],
      ['a file in a folder', zipOf(['docs/a.pdf'])],
      ['no files', zipOf([])],
      [
        'more than 20 files',
        zipOf(Array.from({ length: 21 }, (_, i) => `${i}.pdf`)),
      ],
      [
        'a file type that is not allowed',
        zipOf(['a.pdf', 'run.exe'], ['.exe']),
      ],
      ['compressed files', { ...zipOf(['a.pdf']), isUncompressed: false }],
    ])('rejects a zip with %s', async (_name, zip) => {
      MockInspectZip.mockResolvedValueOnce(zip)

      const result = await getMultiAttachmentFilenames(Buffer.from(''))

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidMultiAttachmentError,
      )
    })

    it('does not open the zips in a zip that breaks another rule', async () => {
      const zip = zipOf(Array.from({ length: 21 }, (_, i) => `${i}.zip`))
      MockInspectZip.mockResolvedValueOnce(zip)

      await getMultiAttachmentFilenames(Buffer.from(''))

      expect(zip.getInvalidExtensions).not.toHaveBeenCalled()
    })

    describe('with real zips', () => {
      beforeEach(() => MockInspectZip.mockImplementation(inspectZip))

      it.each([2, 25])(
        'rejects a zip of %i files that share one name',
        async (count) => {
          const result = await getMultiAttachmentFilenames(
            await zipFilesWithOneName(count),
          )

          expect(result._unsafeUnwrapErr()).toBeInstanceOf(
            InvalidMultiAttachmentError,
          )
        },
      )

      it('rejects a zip of files that share one name and declares one entry', async () => {
        const zip = await zipFilesWithOneName(25)
        const endOfCentralDirectory = zip.lastIndexOf('PK\x05\x06')
        zip.writeUInt16LE(1, endOfCentralDirectory + 8)
        zip.writeUInt16LE(1, endOfCentralDirectory + 10)

        const result = await getMultiAttachmentFilenames(zip)

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          InvalidMultiAttachmentError,
        )
      })

      it.each([
        [
          'names that clash once saved',
          () => zipFiles({ 'A:b.pdf': 'a', 'ab.pdf': 'b' }),
        ],
        [
          'bytes added before it',
          async () =>
            Buffer.concat([Buffer.alloc(10), await zipFiles({ 'a.pdf': 'a' })]),
        ],
      ])('rejects a zip with %s', async (_rule, makeZip) => {
        const result = await getMultiAttachmentFilenames(await makeZip())

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          InvalidMultiAttachmentError,
        )
      })

      it('accepts a zip nested as deep as a single upload allows', async () => {
        const respondentZip = await nestedZip(3)
        await expect(
          getInvalidFileExtensionsInZip('nodebuffer', respondentZip),
        ).resolves.toEqual([])

        const result = await getMultiAttachmentFilenames(
          await zipFiles({ 'nested.zip': respondentZip, 'b.pdf': 'b' }),
        )

        expect(result._unsafeUnwrap()).toEqual(['nested.zip', 'b.pdf'])
      })

      it('gives each zip in it the entry limit of a single upload', async () => {
        const respondentZip = await zipFiles(
          Object.fromEntries(
            Array.from({ length: 51 }, (_, i) => [`${i}.pdf`, 'x']),
          ),
        )
        const names = Array.from({ length: 20 }, (_, i) => `${i}.zip`)

        const result = await getMultiAttachmentFilenames(
          await zipFiles(
            Object.fromEntries(names.map((name) => [name, respondentZip])),
          ),
        )

        expect(result._unsafeUnwrap()).toEqual(names)
      })

      it('accepts a file name with a backslash, which is not a folder', async () => {
        const result = await getMultiAttachmentFilenames(
          await zipFiles({ 'Invoice 1\\2.pdf': 'a', 'other.pdf': 'b' }),
        )

        expect(result._unsafeUnwrap()).toEqual([
          'Invoice 1\\2.pdf',
          'other.pdf',
        ])
      })
    })

    it('rejects a file that cannot be read as a zip', async () => {
      MockInspectZip.mockRejectedValueOnce(new Error('not a zip'))

      const result = await getMultiAttachmentFilenames(Buffer.from('%PDF-1.7'))

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidMultiAttachmentError,
      )
    })
  })

  describe('readMultiAttachmentResponses', () => {
    const attachment = (_id: string, answerArray?: string[]) =>
      generateNewAttachmentResponse({
        _id,
        answer: 'from the browser.zip',
        filename: 'from the browser.zip',
        ...(answerArray && { answerArray }),
      }) as unknown as ParsedClearFormFieldResponse

    it("lists a multi-file zip's files and leaves naming it for later", async () => {
      const result = await readMultiAttachmentResponses(form, [
        attachment(multi._id, ['claimed.pdf']),
      ])

      expect(result._unsafeUnwrap()[0]).toMatchObject({
        answer: 'from the browser.zip',
        answerArray: ['a.pdf', 'b.jpg'],
      })
    })

    it('drops an answerArray the client sent on a single-file attachment', async () => {
      const result = await readMultiAttachmentResponses(form, [
        attachment(single._id, ['claimed.pdf']),
      ])

      expect(result._unsafeUnwrap()[0]).not.toHaveProperty('answerArray')
      expect(result._unsafeUnwrap()[0]).toMatchObject({
        answer: 'from the browser.zip',
      })
    })

    it('leaves an unanswered multi-file field without files', async () => {
      const unanswered = {
        _id: multi._id,
        fieldType: BasicField.Attachment,
        answer: '',
      } as unknown as ParsedClearFormFieldResponse

      const result = await readMultiAttachmentResponses(form, [unanswered])

      expect(result._unsafeUnwrap()).toEqual([unanswered])
    })

    it('fails when a multi-file zip breaks a rule', async () => {
      MockInspectZip.mockResolvedValueOnce(zipOf([]))

      const result = await readMultiAttachmentResponses(form, [
        attachment(multi._id),
      ])

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidMultiAttachmentError,
      )
    })
  })

  describe('nameMultiAttachmentResponses', () => {
    it('names the zip by its question number among the responses', () => {
      const responses = [
        { _id: section._id, fieldType: BasicField.Section, answer: '' },
        { _id: text._id, fieldType: BasicField.ShortText, answer: 'hi' },
        generateNewAttachmentResponse({
          _id: multi._id,
          answer: 'from the browser.zip',
          answerArray: ['a.pdf'],
        } as never),
        generateNewAttachmentResponse({ _id: single._id, answer: 'c.pdf' }),
      ] as unknown as ParsedClearFormFieldResponse[]

      const result = nameMultiAttachmentResponses(form, responses)

      expect(result[2]).toMatchObject({
        answer: 'Question 2.zip',
        filename: 'Question 2.zip',
        answerArray: ['a.pdf'],
      })
      expect(result[3]).toMatchObject({ answer: 'c.pdf' })
    })
  })

  describe('nameMultiAttachmentAnswersV4', () => {
    const answer = (filenames?: string[]): ParsedClearAttachmentAnswerV4 => ({
      value: 'from the browser.zip',
      filename: 'from the browser.zip',
      content: Buffer.from(''),
      hasBeenScanned: true,
      ...(filenames && { filenames }),
    })

    it("names the zip by its field's question number and lists its files", async () => {
      const result = await nameMultiAttachmentAnswersV4(form, [
        { id: multi._id, answer: answer() },
      ])

      expect(result._unsafeUnwrap()[0].answer).toMatchObject({
        value: 'Question 2.zip',
        filename: 'Question 2.zip',
        filenames: ['a.pdf', 'b.jpg'],
      })
    })

    it('drops filenames the client sent on a single-file attachment', async () => {
      const result = await nameMultiAttachmentAnswersV4(form, [
        { id: single._id, answer: answer(['claimed.pdf']) },
      ])

      expect(result._unsafeUnwrap()[0].answer).not.toHaveProperty('filenames')
    })
  })
})
