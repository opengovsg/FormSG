import { useMutation } from 'react-query'
import { useNavigate } from 'react-router-dom'

import {
  adminChooseEnvironment,
  publicChooseEnvironment,
} from '~services/EnvService'

export const useEnvMutations = () => {
  const navigate = useNavigate()

  const publicSwitchEnvMutation = useMutation(() => publicChooseEnvironment(), {
    onSuccess: () => window.location.reload(),
  })

  const adminSwitchEnvMutation = useMutation(() => adminChooseEnvironment(), {
    onSuccess: () => navigate('/#!/forms'),
  })

  return {
    publicSwitchEnvMutation,
    adminSwitchEnvMutation,
  }
}
