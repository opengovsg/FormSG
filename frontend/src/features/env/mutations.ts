// TODO #4279: Remove after React rollout is complete
import { useMutation } from 'react-query'
import { useParams } from 'react-router-dom'

import { switchEnvFeedbackFormBodyDto } from '~shared/types'

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
      if (window.location.href.indexOf('admin/form/') > -1) {
        window.location.assign(`#!/${formId}/admin`)
      } else {
        window.location.assign('/#!/forms')
      }
    },
  })

  const submitSwitchEnvFormFeedbackMutation = useMutation(
    (args: switchEnvFeedbackFormBodyDto) => {
      return submitSwitchEnvFormFeedback({
        formInputs: args,
      })
    },
  )

  return {
    publicSwitchEnvMutation,
    adminSwitchEnvMutation,
    submitSwitchEnvFormFeedbackMutation,
  }
}
