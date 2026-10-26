import { ObjectId } from 'bson'
import {
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  MyInfoAttribute,
  WorkflowType,
} from 'formsg-shared/types'

import { MalformedParametersError } from 'src/app/modules/core/core.errors'
import {
  ForbiddenFormError,
  FormOpenToResponsesError,
} from 'src/app/modules/form/form.errors'
import { IPopulatedForm } from 'src/types'

import {
  checkFormLoginWrite,
  checkWorkflowStepLoginWrite,
  CLOSE_FORM_BEFORE_LOGIN_CHANGE,
  CONVERT_BEFORE_LATER_STEP_LOGIN,
  FIRST_STEP_LOGIN_ONLY_ON_STEP_ONE,
  REMOVE_MYINFO_FIELDS_FIRST,
  STEP_LOGIN_NOT_AVAILABLE,
  STEP_ONE_LOGIN_IN_SETTINGS,
  toSavedWorkflowStep,
} from '../admin-form.step-login'

const MYINFO_FIELD_ID = new ObjectId().toHexString()
const NRIC_FIELD_ID = new ObjectId().toHexString()
const UEN_FIELD_ID = new ObjectId().toHexString()
const PLAIN_FIELD_ID = new ObjectId().toHexString()

const FORM_FIELDS = [
  {
    _id: MYINFO_FIELD_ID,
    fieldType: BasicField.ShortText,
    title: 'Name',
    myInfo: { attr: MyInfoAttribute.Name },
  },
  {
    _id: NRIC_FIELD_ID,
    fieldType: BasicField.Nric,
    title: 'NRIC/FIN',
    myInfo: { attr: MyInfoAttribute.UinFin },
  },
  {
    _id: UEN_FIELD_ID,
    fieldType: BasicField.Uen,
    title: 'UEN',
    corppass: { attr: CorppassAttribute.Uen },
  },
  { _id: PLAIN_FIELD_ID, fieldType: BasicField.ShortText, title: 'Plain' },
]

const step = (edit: string[], extra: Record<string, unknown> = {}) => ({
  _id: new ObjectId().toHexString(),
  workflow_type: WorkflowType.Static,
  emails: ['someone@example.com'],
  edit,
  ...extra,
})

const makeForm = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: new ObjectId(),
    responseMode: FormResponseMode.Multirespondent,
    status: FormStatus.Private,
    authType: FormAuthType.NIL,
    form_fields: FORM_FIELDS,
    workflow: [step([PLAIN_FIELD_ID]), step([])],
    ...overrides,
  }) as unknown as IPopulatedForm

const SINGPASS = { auth_type: FormAuthType.MyInfo as const }
const CORPPASS = { auth_type: FormAuthType.CP as const, esrvc_id: 'ESRVC' }

/** Runs the check for replacing `form.workflow[stepNumber]` with `next`. */
const update = ({
  form = makeForm(),
  stepNumber = 1,
  next = {},
  enabled = true,
}: {
  form?: IPopulatedForm
  stepNumber?: number
  next?: Record<string, unknown>
  enabled?: boolean
}) => {
  const workflow = (form as unknown as { workflow: ReturnType<typeof step>[] })
    .workflow
  const current = workflow[stepNumber] ?? step([])
  const nextStep = { ...current, ...next } as Record<string, unknown>
  const saved = toSavedWorkflowStep(nextStep as never)
  const resultingWorkflow =
    stepNumber < workflow.length
      ? workflow.map((s, i) => (i === stepNumber ? saved : s))
      : [...workflow, saved]
  return checkWorkflowStepLoginWrite({
    form,
    stepNumber,
    step: nextStep as never,
    resultingWorkflow: resultingWorkflow as never,
    isStepLoginEnabled: enabled,
  })
}

describe('admin-form.step-login', () => {
  describe('toSavedWorkflowStep', () => {
    it('drops first_step_login and a null auth', () => {
      const saved = toSavedWorkflowStep({
        ...step([]),
        auth: null,
        first_step_login: { auth_type: FormAuthType.MyInfo },
      } as never)
      expect(saved).not.toHaveProperty('auth')
      expect(saved).not.toHaveProperty('first_step_login')
    })

    it('keeps a step login', () => {
      const saved = toSavedWorkflowStep({
        ...step([]),
        auth: CORPPASS,
      } as never)
      expect(saved.auth).toEqual(CORPPASS)
    })
  })

  describe('checkWorkflowStepLoginWrite', () => {
    it('ignores non-MRF forms', () => {
      const result = update({
        form: makeForm({ responseMode: FormResponseMode.Encrypt }),
        stepNumber: 0,
        next: { auth: SINGPASS },
      })
      expect(result.isOk()).toBe(true)
    })

    it('rejects auth on Step 1', () => {
      const result = update({ stepNumber: 0, next: { auth: SINGPASS } })
      expect(result._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError(STEP_ONE_LOGIN_IN_SETTINGS),
      )
    })

    it('rejects auth when creating the first step', () => {
      const result = update({
        form: makeForm({ workflow: [] }),
        stepNumber: 0,
        next: { auth: SINGPASS },
      })
      expect(result._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError(STEP_ONE_LOGIN_IN_SETTINGS),
      )
    })

    it('rejects first_step_login on a later step', () => {
      const result = update({
        stepNumber: 1,
        next: { first_step_login: { auth_type: FormAuthType.MyInfo } },
      })
      expect(result._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError(FIRST_STEP_LOGIN_ONLY_ON_STEP_ONE),
      )
    })

    it('allows first_step_login when creating into an empty workflow', () => {
      const result = update({
        form: makeForm({ workflow: [] }),
        stepNumber: 0,
        next: { first_step_login: { auth_type: FormAuthType.MyInfo } },
      })
      expect(result._unsafeUnwrap()).toEqual({
        formLogin: { authType: FormAuthType.MyInfo },
      })
    })

    describe('rollout flag', () => {
      it('rejects adding a login while the flag is off', () => {
        const result = update({ next: { auth: SINGPASS }, enabled: false })
        expect(result._unsafeUnwrapErr()).toEqual(
          new ForbiddenFormError(STEP_LOGIN_NOT_AVAILABLE),
        )
      })

      it('rejects switching provider while the flag is off', () => {
        const form = makeForm({
          workflow: [step([PLAIN_FIELD_ID]), step([], { auth: CORPPASS })],
        })
        const result = update({
          form,
          next: { auth: SINGPASS },
          enabled: false,
        })
        expect(result._unsafeUnwrapErr()).toEqual(
          new ForbiddenFormError(STEP_LOGIN_NOT_AVAILABLE),
        )
      })

      it.each([
        ['keeping a saved login', CORPPASS],
        ['re-keying a saved Corppass login', { ...CORPPASS, esrvc_id: 'NEW' }],
        ['removing a saved login', null],
        ['removing a saved login by omission', undefined],
      ])('allows %s while the flag is off', (_name, auth) => {
        const form = makeForm({
          workflow: [step([PLAIN_FIELD_ID]), step([], { auth: CORPPASS })],
        })
        const result = update({ form, next: { auth }, enabled: false })
        expect(result.isOk()).toBe(true)
      })
    })

    describe('open forms', () => {
      const publicForm = (workflow: unknown[]) =>
        makeForm({ status: FormStatus.Public, workflow })

      it.each([
        ['adding', [step([PLAIN_FIELD_ID]), step([])], SINGPASS],
        [
          'changing',
          [step([PLAIN_FIELD_ID]), step([], { auth: CORPPASS })],
          SINGPASS,
        ],
        [
          'editing the e-service ID of',
          [step([PLAIN_FIELD_ID]), step([], { auth: CORPPASS })],
          { ...CORPPASS, esrvc_id: 'NEW' },
        ],
        [
          'removing',
          [step([PLAIN_FIELD_ID]), step([], { auth: CORPPASS })],
          null,
        ],
      ])(
        'rejects %s a step login on a public form',
        (_name, workflow, auth) => {
          const result = update({ form: publicForm(workflow), next: { auth } })
          expect(result._unsafeUnwrapErr()).toEqual(
            new FormOpenToResponsesError(CLOSE_FORM_BEFORE_LOGIN_CHANGE),
          )
        },
      )

      it('allows saving an unchanged step login on a public form', () => {
        const result = update({
          form: publicForm([
            step([PLAIN_FIELD_ID]),
            step([], { auth: CORPPASS }),
          ]),
          next: { auth: { ...CORPPASS } },
        })
        expect(result.isOk()).toBe(true)
      })

      it.each([
        ['login', { auth_type: FormAuthType.MyInfo }],
        ['e-service ID', { auth_type: FormAuthType.CP, esrvc_id: 'NEW' }],
      ])('rejects changing Step 1 %s on a public form', (_name, login) => {
        const form = makeForm({
          status: FormStatus.Public,
          authType: FormAuthType.CP,
          esrvcId: 'OLD',
        })
        const result = update({
          form,
          stepNumber: 0,
          next: { first_step_login: login },
        })
        expect(result._unsafeUnwrapErr()).toEqual(
          new FormOpenToResponsesError(CLOSE_FORM_BEFORE_LOGIN_CHANGE),
        )
      })

      it('allows an unchanged first_step_login on a public form', () => {
        const form = makeForm({
          status: FormStatus.Public,
          authType: FormAuthType.CP,
          esrvcId: 'OLD',
        })
        const result = update({
          form,
          stepNumber: 0,
          next: {
            first_step_login: { auth_type: FormAuthType.CP, esrvc_id: 'OLD' },
          },
        })
        expect(result.isOk()).toBe(true)
      })
    })

    it('requires converting the legacy toggle before a later-step login', () => {
      const form = makeForm({
        authType: FormAuthType.MyInfo,
        isSubmitterIdCollectionEnabled: true,
      })
      const result = update({ form, next: { auth: SINGPASS } })
      expect(result._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError(CONVERT_BEFORE_LATER_STEP_LOGIN),
      )
    })

    it('still allows removing a later-step login with the legacy toggle on', () => {
      const form = makeForm({
        authType: FormAuthType.MyInfo,
        isSubmitterIdCollectionEnabled: true,
        workflow: [step([PLAIN_FIELD_ID]), step([], { auth: CORPPASS })],
      })
      const result = update({ form, next: { auth: null } })
      expect(result.isOk()).toBe(true)
    })

    describe('fields the step login must fill', () => {
      it('rejects removing a login from a step that holds Myinfo fields', () => {
        const form = makeForm({
          workflow: [
            step([PLAIN_FIELD_ID]),
            step([MYINFO_FIELD_ID], { auth: SINGPASS }),
          ],
        })
        const result = update({ form, next: { auth: null } })
        expect(result._unsafeUnwrapErr()).toEqual(
          new MalformedParametersError(REMOVE_MYINFO_FIELDS_FIRST),
        )
      })

      it('rejects switching a step with identity fields to a login that cannot fill them', () => {
        const form = makeForm({
          workflow: [
            step([PLAIN_FIELD_ID]),
            step([NRIC_FIELD_ID], { auth: SINGPASS }),
          ],
        })
        const result = update({ form, next: { auth: CORPPASS } })
        expect(result._unsafeUnwrapErr()).toEqual(
          new MalformedParametersError(REMOVE_MYINFO_FIELDS_FIRST),
        )
      })

      it('rejects assigning a Myinfo field to a step without a login', () => {
        const result = update({ next: { edit: [MYINFO_FIELD_ID] } })
        expect(result._unsafeUnwrapErr()).toEqual(
          new MalformedParametersError(REMOVE_MYINFO_FIELDS_FIRST),
        )
      })

      it('rejects switching Step 1 away from a login its fields need', () => {
        const form = makeForm({
          authType: FormAuthType.MyInfo,
          workflow: [step([NRIC_FIELD_ID, MYINFO_FIELD_ID]), step([])],
        })
        const result = update({
          form,
          stepNumber: 0,
          next: { first_step_login: { auth_type: FormAuthType.NIL } },
        })
        expect(result._unsafeUnwrapErr()).toEqual(
          new MalformedParametersError(REMOVE_MYINFO_FIELDS_FIRST),
        )
      })

      it('allows a Singpass step to take Myinfo and NRIC/FIN fields', () => {
        const result = update({
          next: { auth: SINGPASS, edit: [MYINFO_FIELD_ID, NRIC_FIELD_ID] },
        })
        expect(result.isOk()).toBe(true)
      })

      it('allows a Corppass step to take a UEN field', () => {
        const result = update({
          next: { auth: CORPPASS, edit: [UEN_FIELD_ID] },
        })
        expect(result.isOk()).toBe(true)
      })
    })

    it('rejects a login-filled field owned by two steps', () => {
      const form = makeForm({
        authType: FormAuthType.MyInfo,
        workflow: [step([MYINFO_FIELD_ID]), step([])],
      })
      const result = update({
        form,
        next: { auth: SINGPASS, edit: [MYINFO_FIELD_ID] },
      })
      expect(result._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError(
          '"Name" can only be filled in by one step.',
        ),
      )
    })

    it('maps first_step_login to the form-level login', () => {
      const result = update({
        stepNumber: 0,
        next: {
          first_step_login: { auth_type: FormAuthType.CP, esrvc_id: 'ESRVC' },
        },
      })
      expect(result._unsafeUnwrap()).toEqual({
        formLogin: { authType: FormAuthType.CP, esrvcId: 'ESRVC' },
      })
    })

    it('checks the identity rules against the login Step 1 would end up with', () => {
      const form = makeForm({
        authType: FormAuthType.MyInfo,
        workflow: [step([NRIC_FIELD_ID]), step([])],
      })
      // No login-filled field in the way: the generic check runs.
      const result = update({
        form,
        stepNumber: 0,
        next: {
          edit: [PLAIN_FIELD_ID],
          first_step_login: { auth_type: FormAuthType.NIL },
        },
      })
      expect(result.isOk()).toBe(true)
    })
  })

  describe('checkFormLoginWrite', () => {
    const form = makeForm({
      authType: FormAuthType.CP,
      esrvcId: 'OLD',
      form_fields: FORM_FIELDS.filter(({ _id }) => _id === UEN_FIELD_ID),
    })

    it('rejects a login change on a public form', () => {
      const result = checkFormLoginWrite(
        { ...form, status: FormStatus.Public } as IPopulatedForm,
        { authType: FormAuthType.MyInfo },
        [],
      )
      expect(result._unsafeUnwrapErr()).toEqual(
        new FormOpenToResponsesError(CLOSE_FORM_BEFORE_LOGIN_CHANGE),
      )
    })

    it('allows re-saving the same login on a public form', () => {
      const result = checkFormLoginWrite(
        { ...form, status: FormStatus.Public } as IPopulatedForm,
        { authType: FormAuthType.CP, esrvcId: 'OLD' },
        [],
      )
      expect(result.isOk()).toBe(true)
    })

    it('reports identity fields the new login cannot fill', () => {
      const result = checkFormLoginWrite(form, { authType: FormAuthType.NIL }, [
        step([UEN_FIELD_ID]),
      ])
      expect(result._unsafeUnwrapErr().message).toContain(
        'UEN fields need Corppass login.',
      )
    })

    it('blocks removing a Step 1 login that still fills a Myinfo field', () => {
      const singpassForm = makeForm({
        authType: FormAuthType.MyInfo,
        form_fields: FORM_FIELDS.filter(({ _id }) => _id === MYINFO_FIELD_ID),
      })
      const result = checkFormLoginWrite(
        singpassForm,
        { authType: FormAuthType.NIL },
        [step([MYINFO_FIELD_ID]), step([])],
      )
      expect(result._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError(REMOVE_MYINFO_FIELDS_FIRST),
      )
    })

    it('allows changing Step 1 login when only a later step owns Myinfo fields', () => {
      const singpassForm = makeForm({
        authType: FormAuthType.MyInfo,
        form_fields: FORM_FIELDS.filter(({ _id }) => _id === MYINFO_FIELD_ID),
      })
      const result = checkFormLoginWrite(
        singpassForm,
        { authType: FormAuthType.NIL },
        [step([]), step([MYINFO_FIELD_ID], { auth: SINGPASS })],
      )
      expect(result.isOk()).toBe(true)
    })
  })
})
