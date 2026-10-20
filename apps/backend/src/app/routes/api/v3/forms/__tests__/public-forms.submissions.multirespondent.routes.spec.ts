import { setupApp } from '__tests__/integration/helpers/express-setup'
import { generateDefaultField } from '__tests__/unit/backend/helpers/generate-form-data'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { MULTIRESPONDENT_FORM_SUBMISSION_VERSION } from 'formsg-shared/constants'
import { BasicField, FormStatus } from 'formsg-shared/types'
import session, { Session } from 'supertest-session'

import { aws } from 'src/app/config/config'
import { s3Operations } from 'src/app/utils/aws-s3'

import { PublicFormsRouter } from '../public-forms.routes'

const app = setupApp('/forms', PublicFormsRouter)

const QUARANTINE_KEY = '1b90195b-ce8a-4590-810b-04ebaef8e4dd'
const CLEAN_KEY = '3b241101-e2bb-4255-8caf-4136c566a962'

describe('POST /forms/:formId/submissions/multirespondent', () => {
  let request: Session

  beforeAll(async () => await dbHandler.connect())
  beforeEach(() => {
    request = session(app)
    jest.spyOn(aws.guarddutyLambda, 'invoke').mockResolvedValue({
      Payload: Buffer.from(
        JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            cleanFileKey: CLEAN_KEY,
            destinationVersionId: 'version',
          }),
        }),
      ),
    } as never)
    jest.spyOn(s3Operations, 'getObject').mockResolvedValue({
      Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) },
    } as never)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  const submitAttachment = async ({
    answer,
    withFilePart,
  }: {
    answer: unknown
    withFilePart: boolean
  }) => {
    const attachmentField = generateDefaultField(BasicField.Attachment, {
      _id: String(new ObjectId()),
      required: true,
    })
    const { form } = await dbHandler.insertMultirespondentForm({
      formOptions: {
        status: FormStatus.Public,
        form_fields: [attachmentField],
      },
    })

    const submission = request
      .post(`/forms/${form._id}/submissions/multirespondent`)
      .query({ captchaResponse: 'null' })
      .field(
        'body',
        JSON.stringify({
          responses: {
            [attachmentField._id]: {
              fieldType: BasicField.Attachment,
              answer,
              provenance: {},
            },
          },
          version: MULTIRESPONDENT_FORM_SUBMISSION_VERSION,
        }),
      )
    // A crash leaves the request without a response, so time out instead of
    // waiting for the test timeout.
    return (
      withFilePart
        ? submission.attach(
            'file.pdf',
            Buffer.alloc(0),
            String(attachmentField._id),
          )
        : submission
    ).timeout(5000)
  }

  it('should return 422 when a required attachment response has no file part', async () => {
    const response = await submitAttachment({
      answer: { value: QUARANTINE_KEY, hasBeenScanned: false },
      withFilePart: false,
    })

    expect(response.status).toBe(422)
  })

  it.each([null, 'not-an-object'])(
    'should return 422 when the attachment answer is %p',
    async (answer) => {
      const response = await submitAttachment({ answer, withFilePart: true })

      expect(response.status).toBe(422)
    },
  )
})
