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
      // If on form builder page
      if (window.location.href.indexOf('admin/form/') > -1) {
        window.location.assign(`#!/${formId}/admin`)
        // If on admin workspace page
      } else if (window.location.href.indexOf('workspace') > -1) {
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
