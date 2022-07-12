import { okAsync, ResultAsync } from 'neverthrow'

import { DatabaseError } from '../core/core.errors'
import { MissingUserError } from '../user/user.errors'

export const getWorkspaces = (): ResultAsync<
  any[],
  MissingUserError | DatabaseError
> => {
  return okAsync([])
}

export const createWorkspace = (): ResultAsync<any, DatabaseError> => {
  return okAsync({})
}
