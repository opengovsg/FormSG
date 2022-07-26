// TODO #4279: Remove after React rollout is complete
import { useMutation } from 'react-query'
import { useNavigate } from 'react-router-dom'

import { switchEnvFeedbackFormBodyDto } from '~shared/types'

import {
  adminChooseEnvironment,
  publicChooseEnvironment,
} from '~services/EnvService'

import { submitSwitchEnvFormFeedback } from './EnvService'

export const useEnvMutations = () => {
  const navigate = useNavigate()

  const publicSwitchEnvMutation = useMutation(() => publicChooseEnvironment(), {
    onSuccess: () => window.location.reload(),
  })

  const adminSwitchEnvMutation = useMutation(() => adminChooseEnvironment(), {
    onSuccess: () => {
      navigate('/#!/forms')
      window.location.reload()
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
