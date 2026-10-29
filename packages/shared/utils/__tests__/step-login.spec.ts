import {
  canStepLoginFillField,
  formUsesAuthType,
  getOwningStepIndex,
  getStepAuthType,
  getStepFields,
  getStepFieldsNeedingLogin,
  getResultingLoginErrors,
  getLoginFieldPublishErrors,
  getStepLoginConfigErrors,
  hasStepLoginConfig,
  MYINFO_FIELDS_NEED_FORM_SINGPASS,
  MYINFO_FIELDS_NEED_SINGPASS_STEP,
} from '../step-login'

import {
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormResponseMode,
  MyInfoAttribute,
} from '../../types'

const nricIdentity = {
  _id: 'nric',
  fieldType: BasicField.Nric,
  title: 'NRIC/FIN',
  myInfo: { attr: MyInfoAttribute.UinFin },
}
const uenIdentity = {
  _id: 'uen',
  fieldType: BasicField.Uen,
  title: 'UEN',
  corppass: { attr: CorppassAttribute.Uen },
}
const name = {
  _id: 'name',
  fieldType: BasicField.ShortText,
  title: 'Name',
  myInfo: { attr: MyInfoAttribute.Name },
}
const plain = { _id: 'plain', fieldType: BasicField.ShortText, title: 'Plain' }

const singpassStep = {
  edit: ['name'],
  auth: { auth_type: FormAuthType.MyInfo as const },
}
const corppassStep = {
  edit: ['uen'],
  auth: { auth_type: FormAuthType.CP as const, esrvc_id: 'AGENCY-1' },
}

describe('step-login', () => {
  describe('getStepAuthType', () => {
    it('reads Step 1 from the form and later steps from auth', () => {
      const form = { authType: FormAuthType.NIL }
      const workflow = [{ edit: [] }, singpassStep, corppassStep, { edit: [] }]
      expect(getStepAuthType(form, workflow, 0)).toBe(FormAuthType.NIL)
      expect(getStepAuthType(form, workflow, 1)).toBe(FormAuthType.MyInfo)
      expect(getStepAuthType(form, workflow, 2)).toBe(FormAuthType.CP)
      expect(getStepAuthType(form, workflow, 3)).toBe(FormAuthType.NIL)
      expect(getStepAuthType(form, undefined, 5)).toBe(FormAuthType.NIL)
    })
  })

  it('formUsesAuthType looks at Step 1 and later steps', () => {
    const form = {
      authType: FormAuthType.NIL,
      workflow: [{ edit: [] }, corppassStep],
    }
    expect(formUsesAuthType(form, FormAuthType.CP)).toBe(true)
    expect(formUsesAuthType(form, FormAuthType.MyInfo)).toBe(false)
    expect(
      formUsesAuthType({ authType: FormAuthType.MyInfo }, FormAuthType.MyInfo),
    ).toBe(true)
  })

  it('hasStepLoginConfig ignores Step 1', () => {
    expect(hasStepLoginConfig({ workflow: [{ edit: [] }] })).toBe(false)
    expect(hasStepLoginConfig({ workflow: [{ edit: [] }, singpassStep] })).toBe(
      true,
    )
  })

  it('getStepFields gives every field to Step 1 of a form without a workflow', () => {
    expect(getStepFields([nricIdentity, plain], [], 0)).toEqual([
      nricIdentity,
      plain,
    ])
    expect(getStepFields([nricIdentity, plain], [], 1)).toEqual([])
    expect(
      getStepFields(
        [nricIdentity, plain],
        [{ edit: ['plain'] }, { edit: ['nric'] }],
        1,
      ),
    ).toEqual([nricIdentity])
  })

  it('getOwningStepIndex finds the step holding the field', () => {
    const workflow = [{ edit: ['plain'] }, { edit: ['nric'] }]
    expect(getOwningStepIndex(nricIdentity, workflow)).toBe(1)
    expect(getOwningStepIndex(uenIdentity, workflow)).toBeUndefined()
    expect(getOwningStepIndex(uenIdentity, [])).toBe(0)
  })

  describe('canStepLoginFillField', () => {
    it('matches login-filled fields to their provider', () => {
      expect(canStepLoginFillField(plain, FormAuthType.NIL)).toBe(true)
      expect(canStepLoginFillField(name, FormAuthType.MyInfo)).toBe(true)
      expect(canStepLoginFillField(name, FormAuthType.CP)).toBe(false)
      expect(canStepLoginFillField(nricIdentity, FormAuthType.MyInfo)).toBe(
        true,
      )
      expect(canStepLoginFillField(uenIdentity, FormAuthType.MyInfo)).toBe(
        false,
      )
      expect(canStepLoginFillField(uenIdentity, FormAuthType.CP)).toBe(true)
    })

    it('lists the fields a login change would strand', () => {
      expect(
        getStepFieldsNeedingLogin(
          [name, nricIdentity, plain],
          FormAuthType.NIL,
        ),
      ).toEqual([name, nricIdentity])
    })
  })

  describe('getStepLoginConfigErrors', () => {
    const form = { authType: FormAuthType.NIL }
    const formFields = [nricIdentity, uenIdentity, name, plain]

    it('accepts a workflow whose steps can fill their fields', () => {
      expect(
        getStepLoginConfigErrors({
          form,
          formFields,
          workflow: [
            { edit: ['plain'] },
            { ...singpassStep, edit: ['name', 'nric'] },
            corppassStep,
          ],
        }),
      ).toEqual([])
    })

    it('rejects a login-filled field in two steps', () => {
      expect(
        getStepLoginConfigErrors({
          form,
          formFields,
          workflow: [
            { edit: [] },
            singpassStep,
            { ...singpassStep, edit: ['name'] },
          ],
        }),
      ).toEqual(['"Name" can only be filled in by one step.'])
    })

    it('rejects a step whose login cannot fill its field', () => {
      expect(
        getStepLoginConfigErrors({
          form,
          formFields,
          workflow: [{ edit: [] }, { edit: ['name'] }],
        }),
      ).toEqual(['Step 2 needs Singpass login to fill in "Name".'])
      expect(
        getStepLoginConfigErrors({
          form: { authType: FormAuthType.CP },
          formFields,
          workflow: [{ edit: ['nric'] }, { edit: [] }],
        }),
      ).toEqual(['Step 1 needs Singpass login to fill in "NRIC/FIN".'])
    })

    it('rejects collecting the same identity twice in one step', () => {
      expect(
        getStepLoginConfigErrors({
          form,
          formFields: [nricIdentity, { ...nricIdentity, _id: 'nric2' }],
          workflow: [
            { edit: [] },
            { ...singpassStep, edit: ['nric', 'nric2'] },
          ],
        }),
      ).toEqual(['Step 2 can only collect NRIC/FIN once.'])
    })

    it('allows unassigned fields', () => {
      expect(
        getStepLoginConfigErrors({
          form,
          formFields,
          workflow: [{ edit: [] }, { edit: [] }],
        }),
      ).toEqual([])
    })
  })

  describe('getResultingLoginErrors', () => {
    const mrf = {
      authType: FormAuthType.NIL,
      responseMode: FormResponseMode.Multirespondent,
    }

    it('passes when a later Singpass step fills the Myinfo fields', () => {
      expect(
        getResultingLoginErrors({
          ...mrf,
          form_fields: [plain, name],
          workflow: [{ edit: ['plain'] }, singpassStep],
        }),
      ).toEqual([])
    })

    it('rejects Myinfo fields once no step has Singpass login', () => {
      // Step 2 was deleted: its Myinfo field is now unassigned
      expect(
        getResultingLoginErrors({
          ...mrf,
          form_fields: [plain, name],
          workflow: [{ edit: ['plain'] }],
        }),
      ).toEqual([MYINFO_FIELDS_NEED_SINGPASS_STEP])
    })

    it('rejects login fields left on a no-login Step 1 when the workflow is deleted', () => {
      expect(
        getResultingLoginErrors({
          ...mrf,
          form_fields: [name, uenIdentity],
          workflow: [],
        }),
      ).toEqual([
        'UEN fields need Corppass login.',
        // No steps are left, so the message must not point to one
        MYINFO_FIELDS_NEED_FORM_SINGPASS,
      ])
    })

    it('passes when Step 1 keeps a Singpass login without a workflow', () => {
      expect(
        getResultingLoginErrors({
          ...mrf,
          authType: FormAuthType.MyInfo,
          form_fields: [name, nricIdentity],
          workflow: [],
        }),
      ).toEqual([])
    })

    it('includes step login errors', () => {
      expect(
        getResultingLoginErrors({
          ...mrf,
          form_fields: [name],
          workflow: [{ edit: ['name'] }, singpassStep],
        }),
      ).toEqual([
        '"Name" can only be filled in by one step.',
        'Step 1 needs Singpass login to fill in "Name".',
      ])
    })
  })
})

describe('draft and publish authentication rules', () => {
  const draft = {
    authType: FormAuthType.NIL,
    responseMode: FormResponseMode.Multirespondent,
    form_fields: [name, uenIdentity, plain],
    workflow: [{ edit: ['plain'] }],
  }
  it('allows missing providers for unassigned draft fields', () => {
    expect(
      getResultingLoginErrors({ ...draft, allowIncompleteDraft: true }),
    ).toEqual([])
  })
  it('does not relax assigned-field compatibility in drafts', () => {
    expect(
      getResultingLoginErrors({
        ...draft,
        workflow: [{ edit: ['uen'] }],
        allowIncompleteDraft: true,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Step 1 needs Corppass'),
      ]),
    )
  })
  it('lists both unassigned provider fields at publication', () => {
    const errors = getLoginFieldPublishErrors(draft)
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          '"Name" must be assigned to a step with Singpass',
        ),
        expect.stringContaining(
          '"UEN" must be assigned to a step with Corppass',
        ),
      ]),
    )
    expect(errors.join(' ')).not.toContain('"Plain"')
  })
  it('rejects authentication fields on an empty MRF workflow even with form login', () => {
    expect(
      getLoginFieldPublishErrors({
        ...draft,
        authType: FormAuthType.MyInfo,
        form_fields: [name],
        workflow: [],
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('"Name" must be assigned'),
      ]),
    )
  })
  it('accepts mixed-provider fields assigned to their matching steps', () => {
    expect(
      getLoginFieldPublishErrors({
        ...draft,
        authType: FormAuthType.MyInfo,
        workflow: [{ edit: ['name'] }, corppassStep],
      }),
    ).toEqual([])
  })
  it('does not require ordinary fields to be assigned', () => {
    expect(
      getLoginFieldPublishErrors({
        ...draft,
        form_fields: [plain],
        workflow: [],
      }),
    ).toEqual([])
  })
  it.each([FormResponseMode.Encrypt, FormResponseMode.Email])(
    'allows providerless Myinfo fields in closed %s drafts',
    (responseMode) => {
      expect(
        getResultingLoginErrors({
          authType: FormAuthType.NIL,
          responseMode,
          form_fields: [name],
          allowIncompleteDraft: true,
        }),
      ).toEqual([])
      expect(
        getLoginFieldPublishErrors({
          authType: FormAuthType.NIL,
          responseMode,
          form_fields: [name],
        }),
      ).toEqual(
        expect.arrayContaining([
          expect.stringContaining('"Name" needs Singpass'),
        ]),
      )
    },
  )
  it('allows flat Corppass fields in drafts but requires its provider at publication', () => {
    const flat = {
      authType: FormAuthType.NIL,
      responseMode: FormResponseMode.Encrypt,
      form_fields: [uenIdentity],
    }
    expect(
      getResultingLoginErrors({ ...flat, allowIncompleteDraft: true }),
    ).toEqual([])
    expect(getLoginFieldPublishErrors(flat)).toEqual(
      expect.arrayContaining([expect.stringContaining('"UEN" needs Corppass')]),
    )
    expect(
      getLoginFieldPublishErrors({ ...flat, authType: FormAuthType.CP }),
    ).toEqual([])
  })
  it('preserves storage/MRF-only identity restrictions in drafts', () => {
    expect(
      getResultingLoginErrors({
        authType: FormAuthType.NIL,
        responseMode: FormResponseMode.Email,
        form_fields: [uenIdentity],
        allowIncompleteDraft: true,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('only available in storage mode'),
      ]),
    )
  })
})
