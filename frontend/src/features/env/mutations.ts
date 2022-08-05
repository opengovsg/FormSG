// TODO #4279: Remove after React rollout is complete
import { useMutation } from 'react-query'
import { useParams } from 'react-router-dom'

import { PublicFormViewDto, switchEnvFeedbackFormBodyDto } from '~shared/types'

import {
  adminChooseEnvironment,
  publicChooseEnvironment,
} from '~services/EnvService'

import { submitSwitchEnvFormFeedback } from './EnvService'

export const useEnvMutations = (
  feedbackForm: PublicFormViewDto | undefined,
) => {
  const { formId } = useParams()

  const publicSwitchEnvMutation = useMutation(() => publicChooseEnvironment(), {
    onSuccess: () => window.location.reload(),
  })

  const adminSwitchEnvMutation = useMutation(() => adminChooseEnvironment(), {
    onSuccess: () => {
      const formBuilderReactPath = new RegExp('^/admin/form/')
      const adminWorkspaceReactPath = new RegExp('^/workspace')
      // If on form builder page
      if (window.location.pathname.match(formBuilderReactPath)) {
        window.location.assign(`/#!/${formId}/admin`)
        // If on admin workspace page
      } else if (window.location.pathname.match(adminWorkspaceReactPath)) {
        window.location.assign('/#!/forms')
      } else {
        // if on public form page
        window.location.reload()
      }
    },
  })

  const submitSwitchEnvFormFeedbackMutation = useMutation(
    (args: switchEnvFeedbackFormBodyDto) => {
      return submitSwitchEnvFormFeedback({
        formInputs: args,
        feedbackForm: feedbackForm,
      })
    },
  )

  return {
    publicSwitchEnvMutation,
    adminSwitchEnvMutation,
    submitSwitchEnvFormFeedbackMutation,
  }
}
