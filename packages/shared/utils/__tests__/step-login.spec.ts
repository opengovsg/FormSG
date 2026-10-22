import {
  canStepLoginFillField,
  formUsesAuthType,
  getOwningStepIndex,
  getStepAuthType,
  getStepEsrvcId,
  getStepFields,
  getStepFieldsNeedingLogin,
  getStepLoginConfigErrors,
  hasStepLoginConfig,
} from '../step-login'

import {
  BasicField,
  CorppassAttribute,
  FormAuthType,
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

    it('reads the e-service ID from the form for Step 1 and the step otherwise', () => {
      const form = { authType: FormAuthType.CP, esrvcId: 'FORM-1' }
      const workflow = [{ edit: [] }, corppassStep]
      expect(getStepEsrvcId(form, workflow, 0)).toBe('FORM-1')
      expect(getStepEsrvcId(form, workflow, 1)).toBe('AGENCY-1')
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
})
