// TODO #4279: Remove after React rollout is complete
import { useMutation } from 'react-query'
import { useParams } from 'react-router-dom'

import {
  adminChooseEnvironment,
  publicChooseEnvironment,
} from '~services/EnvService'

import { submitSwitchEnvFormFeedback } from './EnvService'

export const useEnvMutations = () => {
  const { formId } = useParams()

  const publicSwitchEnvMutation = useMutation(() => publicChooseEnvironment(), {
    onSuccess: () => window.location.reload(),
  })

  const adminSwitchEnvMutation = useMutation(() => adminChooseEnvironment(), {
    onSuccess: () => {
      const previewFormReactPath = new RegExp(`^/admin/form/${formId}/preview`)
      const adminWorkspaceReactPath = new RegExp('^/dashboard')
      const formBuilderReactPath = new RegExp('^/admin/form/')

      // If on admin preview form page
      if (window.location.pathname.match(previewFormReactPath)) {
        window.location.assign(`/#!/${formId}/preview`)
        // If on admin workspace page
      } else if (window.location.pathname.match(adminWorkspaceReactPath)) {
        window.location.assign('/#!/forms')
        // If on form builder page
      } else if (window.location.pathname.match(formBuilderReactPath)) {
        window.location.assign(`/#!/${formId}/admin`)
      } else {
        // if on public form page
        window.location.reload()
      }
    },
  })

  return {
    publicSwitchEnvMutation,
    adminSwitchEnvMutation,
  }
}

export const useFeedbackMutation = () => {
  return useMutation(submitSwitchEnvFormFeedback)
}
