import { FormAuthType, FormWorkflowStep, WorkflowType } from '../../types'
import {
  findFirstStepUsingAuthType,
  FormLoginFields,
  formUsesAuthType,
  isMyInfoAuthType,
  resolveAllStepAuths,
  resolveStepAuth,
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

// Step 1 no login, Step 2 none, Step 3 Corppass with a list.
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
    it('reads Step 1 from the form-level fields', () => {
      expect(resolveStepAuth(SINGPASS_FORM, [step()], 0)).toEqual({
        authType: FormAuthType.MyInfo,
        isSubmitterIdCollectionEnabled: true,
        isSingleSubmission: true,
        isWhitelistEnabled: true,
      })
    })

    it('ignores leftover Step 1 settings when Step 1 has no login', () => {
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

    it('keeps a retired Step 1 provider as it is', () => {
      expect(
        resolveStepAuth({ authType: FormAuthType.SGID_MyInfo }, [], 0).authType,
      ).toBe(FormAuthType.SGID_MyInfo)
    })

    it('reads later steps from step.auth, never with one response per ID', () => {
      expect(resolveStepAuth(NO_LOGIN_FORM, MIXED_WORKFLOW, 2)).toEqual({
        authType: FormAuthType.CP,
        isSubmitterIdCollectionEnabled: true,
        isSingleSubmission: false,
        isWhitelistEnabled: true,
      })
    })

    it('reads the list state from a public projection', () => {
      expect(
        resolveStepAuth(
          NO_LOGIN_FORM,
          [
            {},
            {
              auth: {
                auth_type: FormAuthType.MyInfo,
                is_submitter_id_collection_enabled: false,
                isWhitelistEnabled: true,
              },
            },
          ],
          1,
        ).isWhitelistEnabled,
      ).toBe(true)
    })

    it('treats a later step without auth as no login', () => {
      expect(resolveStepAuth(SINGPASS_FORM, MIXED_WORKFLOW, 1).authType).toBe(
        FormAuthType.NIL,
      )
    })
  })

  describe('resolveAllStepAuths', () => {
    it('returns Step 1 for a form with no steps', () => {
      expect(resolveAllStepAuths(SINGPASS_FORM)).toHaveLength(1)
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
    it('finds a login on a later step when Step 1 has none', () => {
      const isCorppass = (authType: FormAuthType) =>
        authType === FormAuthType.CP
      expect(formUsesAuthType(NO_LOGIN_FORM, MIXED_WORKFLOW, isCorppass)).toBe(
        true,
      )
      expect(
        findFirstStepUsingAuthType(NO_LOGIN_FORM, MIXED_WORKFLOW, isCorppass),
      ).toBe(2)
    })

    it('counts a retired MyInfo provider on Step 1 as MyInfo', () => {
      expect(
        formUsesAuthType(
          { authType: FormAuthType.SGID_MyInfo },
          [],
          isMyInfoAuthType,
        ),
      ).toBe(true)
      expect(
        formUsesAuthType(NO_LOGIN_FORM, MIXED_WORKFLOW, isMyInfoAuthType),
      ).toBe(false)
    })
  })
})
