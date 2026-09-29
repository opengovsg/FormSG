import { FormAuthType, FormWorkflowStep, WorkflowType } from '../../types'
import {
  findFirstStepUsingAuthType,
  FormLoginFields,
  formUsesAuthType,
  formUsesMyInfo,
  resolveAllStepAuths,
  resolveStepAuth,
  toStepLoginAuthType,
} from '../workflow-auth'

const step = (auth?: FormWorkflowStep['auth']): FormWorkflowStep => ({
  workflow_type: WorkflowType.Static,
  emails: [],
  edit: [],
  auth,
})

const NO_LOGIN_FORM: FormLoginFields = {
  authType: FormAuthType.NIL,
  isSubmitterIdCollectionEnabled: false,
  isSingleSubmission: false,
}

const SINGPASS_FORM: FormLoginFields = {
  authType: FormAuthType.MyInfo,
  isSubmitterIdCollectionEnabled: true,
  isSingleSubmission: true,
  whitelistedSubmitterIds: { isWhitelistEnabled: true },
}

// Step 1 no login, step 2 none, step 3 Corppass with a whitelist.
const MIXED_WORKFLOW = [
  step(),
  step(),
  step({
    auth_type: FormAuthType.CP,
    is_submitter_id_collection_enabled: true,
    whitelisted_submitter_ids: { isWhitelistEnabled: true },
  }),
]

describe('workflow-auth', () => {
  describe('resolveStepAuth', () => {
    it('reads step 1 from the form-level fields', () => {
      expect(resolveStepAuth(SINGPASS_FORM, [step()], 0)).toEqual({
        authType: FormAuthType.MyInfo,
        isSubmitterIdCollectionEnabled: true,
        isSingleSubmission: true,
        isWhitelistEnabled: true,
      })
    })

    it('ignores leftover step 1 settings when step 1 has no login', () => {
      expect(
        resolveStepAuth(
          { ...SINGPASS_FORM, authType: FormAuthType.NIL },
          [step()],
          0,
        ),
      ).toEqual({
        authType: FormAuthType.NIL,
        isSubmitterIdCollectionEnabled: false,
        isSingleSubmission: false,
        isWhitelistEnabled: false,
      })
    })

    it('reads later steps from step.auth, never with one response per ID', () => {
      expect(resolveStepAuth(NO_LOGIN_FORM, MIXED_WORKFLOW, 2)).toEqual({
        authType: FormAuthType.CP,
        isSubmitterIdCollectionEnabled: true,
        isSingleSubmission: false,
        isWhitelistEnabled: true,
      })
    })

    it('treats a later step without auth as no login', () => {
      expect(resolveStepAuth(SINGPASS_FORM, MIXED_WORKFLOW, 1).authType).toBe(
        FormAuthType.NIL,
      )
    })

    it('keeps a retired provider on step 1 as saved', () => {
      expect(
        resolveStepAuth({ authType: FormAuthType.SGID_MyInfo }, [], 0).authType,
      ).toBe(FormAuthType.SGID_MyInfo)
    })

    it('reads the whitelist state from a public step projection', () => {
      expect(
        resolveStepAuth(
          NO_LOGIN_FORM,
          [
            {},
            {
              auth: {
                auth_type: FormAuthType.CP,
                is_submitter_id_collection_enabled: false,
                isWhitelistEnabled: true,
              },
            },
          ],
          1,
        ).isWhitelistEnabled,
      ).toBe(true)
    })
  })

  describe('toStepLoginAuthType', () => {
    it.each([FormAuthType.SP, FormAuthType.SGID, FormAuthType.SGID_MyInfo])(
      'maps retired %s to the Singpass option',
      (authType) => {
        expect(toStepLoginAuthType(authType)).toBe(FormAuthType.MyInfo)
      },
    )
  })

  describe('formUsesMyInfo', () => {
    it('counts a legacy sgID with MyInfo step 1', () => {
      expect(formUsesMyInfo({ authType: FormAuthType.SGID_MyInfo }, [])).toBe(
        true,
      )
    })

    it('is false when only Corppass is used', () => {
      expect(formUsesMyInfo(NO_LOGIN_FORM, MIXED_WORKFLOW)).toBe(false)
    })
  })

  describe('resolveAllStepAuths', () => {
    it('returns step 1 for a form with no steps', () => {
      expect(resolveAllStepAuths(SINGPASS_FORM, [])).toHaveLength(1)
      expect(resolveAllStepAuths(SINGPASS_FORM)[0].authType).toBe(
        FormAuthType.MyInfo,
      )
    })

    it('returns one entry per step', () => {
      expect(
        resolveAllStepAuths(NO_LOGIN_FORM, MIXED_WORKFLOW).map(
          (r) => r.authType,
        ),
      ).toEqual([FormAuthType.NIL, FormAuthType.NIL, FormAuthType.CP])
    })
  })

  describe('formUsesAuthType', () => {
    it('finds a login on a later step when step 1 has none', () => {
      expect(
        formUsesAuthType(NO_LOGIN_FORM, MIXED_WORKFLOW, FormAuthType.CP),
      ).toBe(true)
      expect(
        findFirstStepUsingAuthType(
          NO_LOGIN_FORM,
          MIXED_WORKFLOW,
          FormAuthType.CP,
        ),
      ).toBe(2)
    })

    it('is false when no step uses the login', () => {
      expect(
        formUsesAuthType(NO_LOGIN_FORM, MIXED_WORKFLOW, FormAuthType.MyInfo),
      ).toBe(false)
    })
  })
})
