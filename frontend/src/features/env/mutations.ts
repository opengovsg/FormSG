import { useMutation } from 'react-query'

import {
  adminChooseEnvironment,
  publicChooseEnvironment,
} from '~services/EnvService'

export const useEnvMutations = () => {
  const publicSwitchEnvMutation = useMutation(() => publicChooseEnvironment(), {
    onSuccess: () => window.location.reload(),
  })

  const adminSwitchEnvMutation = useMutation(() => adminChooseEnvironment(), {
    onSuccess: () => window.location.reload(),
  })

  return {
    publicSwitchEnvMutation,
    adminSwitchEnvMutation,
  }
}
