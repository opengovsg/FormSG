import { UserDto } from '~shared/types/user'

import { ApiService } from './ApiService'

const USER_ENDPOINT = '/user'

/**
 * Fetches the user from the server using the current session cookie.
 *
 * @returns the logged in user if session is valid, will throw 401 error if not.
 */
export const fetchUser = async (): Promise<UserDto> => {
  return ApiService.get<UserDto>(USER_ENDPOINT).then(({ data }) => data)
}
