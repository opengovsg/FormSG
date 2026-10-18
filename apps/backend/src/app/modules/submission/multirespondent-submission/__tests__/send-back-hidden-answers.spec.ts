import { ObjectId } from 'bson'
import {
  BasicField,
  FormAuthType,
  LogicConditionState,
  LogicType,
} from 'formsg-shared/types'

import formsgSdk from 'src/app/config/formsg-sdk'

import { validateMultirespondentSubmission } from '../multirespondent-submission.middleware'

// RATIONALE: Only decryption is mocked; logic evaluation and field validation
// run for real, as they decide which stored answers survive a step submit.
jest.mock('src/app/config/formsg-sdk', () => ({
  __esModule: true,
  default: {
    cryptoV3: {
      decryptFromSubmissionKey: jest.fn(),
    },
  },
}))

const FIELD_A = new ObjectId().toHexString() // step 1, yes/no
const FIELD_B = new ObjectId().toHexString() // step 2, yes/no
const FIELD_C = new ObjectId().toHexString() // step 3, shown if B is Yes
const FIELD_E = new ObjectId().toHexString() // step 3, shown if A is Yes

const yesNoField = (_id: string) => ({
  _id,
  fieldType: BasicField.YesNo,
  title: 'Yes or no',
  description: '',
  required: false,
  disabled: false,
})
const shortTextField = (_id: string) => ({
  _id,
  fieldType: BasicField.ShortText,
  title: 'Short text',
  description: '',
  required: false,
  disabled: false,
})
const showIfYes = (field: string, show: string) => ({
  _id: new ObjectId().toHexString(),
  logicType: LogicType.ShowFields,
  conditions: [{ field, state: LogicConditionState.Equal, value: 'Yes' }],
  show: [show],
})

const yesNo = (value: string) => ({
  fieldType: BasicField.YesNo,
  answer: { value },
  provenance: {},
})
const shortText = (value: string) => ({
  fieldType: BasicField.ShortText,
  answer: { value },
  provenance: {},
})

// Pending at step 4, then sent back to step 2: workflowStep is 0 and the
// stored content still holds step 3's answers.
const sentBackSubmission = {
  _id: new ObjectId(),
  encryptedContent: 'encrypted-content',
  version: 1,
  mrfVersion: 2,
  form_fields: [
    yesNoField(FIELD_A),
    yesNoField(FIELD_B),
    shortTextField(FIELD_C),
    shortTextField(FIELD_E),
  ],
  form_logics: [showIfYes(FIELD_B, FIELD_C), showIfYes(FIELD_A, FIELD_E)],
  workflow: [
    { _id: new ObjectId().toHexString(), edit: [FIELD_A] },
    { _id: new ObjectId().toHexString(), edit: [FIELD_B] },
    { _id: new ObjectId().toHexString(), edit: [FIELD_C, FIELD_E] },
    { _id: new ObjectId().toHexString(), edit: [] },
  ],
  workflowStep: 0,
}

const storedResponses = {
  [FIELD_A]: yesNo('Yes'),
  [FIELD_B]: yesNo('Yes'),
  [FIELD_C]: shortText('later answer'),
  [FIELD_E]: shortText('another later answer'),
}

const createMockReq = (responses: Record<string, unknown>) =>
  ({
    params: {
      formId: new ObjectId().toHexString(),
      submissionId: sentBackSubmission._id.toHexString(),
    },
    body: { responses, submissionSecretKey: 'submission-secret-key' },
    formsg: {
      formDef: { authType: FormAuthType.NIL },
      mrfSubmission: sentBackSubmission,
    },
    growthbook: { isOn: jest.fn().mockReturnValue(false) },
    get: jest.fn(),
    headers: {},
  }) as any

const createMockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
})

describe('validateMultirespondentSubmission after a send back', () => {
  beforeEach(() => {
    jest.mocked(formsgSdk.cryptoV3.decryptFromSubmissionKey).mockReturnValue({
      responses: storedResponses,
      verified: {},
    } as any)
  })

  afterEach(() => jest.clearAllMocks())

  it('drops a later step answer hidden by a changed answer', async () => {
    const req = createMockReq({
      [FIELD_A]: yesNo('Yes'),
      [FIELD_B]: yesNo('No'),
    })
    const res = createMockRes()
    const next = jest.fn()

    await validateMultirespondentSubmission(req, res as any, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.body.responses).toEqual({
      [FIELD_A]: yesNo('Yes'),
      [FIELD_B]: yesNo('No'),
      [FIELD_E]: storedResponses[FIELD_E],
    })
  })

  it('keeps a later step answer that is still visible', async () => {
    const req = createMockReq({
      [FIELD_A]: yesNo('Yes'),
      [FIELD_B]: yesNo('Yes'),
    })
    const res = createMockRes()
    const next = jest.fn()

    await validateMultirespondentSubmission(req, res as any, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.body.responses).toEqual(storedResponses)
  })

  it('evaluates visibility with omitted non-editable answers copied back', async () => {
    // A drives E; omitting A must not hide E and so drop its answer.
    const req = createMockReq({ [FIELD_B]: yesNo('Yes') })
    const res = createMockRes()
    const next = jest.fn()

    await validateMultirespondentSubmission(req, res as any, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.body.responses).toEqual(storedResponses)
  })

  it('still rejects a changed answer on a visible non-editable field', async () => {
    const req = createMockReq({
      [FIELD_A]: yesNo('No'),
      [FIELD_B]: yesNo('No'),
    })
    const res = createMockRes()
    const next = jest.fn()

    await validateMultirespondentSubmission(req, res as any, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('still rejects a client-sent answer on a non-editable field now hidden', async () => {
    const req = createMockReq({
      [FIELD_A]: yesNo('Yes'),
      [FIELD_B]: yesNo('No'),
      [FIELD_C]: shortText('later answer'),
    })
    const res = createMockRes()
    const next = jest.fn()

    await validateMultirespondentSubmission(req, res as any, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })
})
