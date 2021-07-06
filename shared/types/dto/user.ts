import { z } from 'zod'
import { Agency } from '../model/agency'
import { User } from '../model/user'

export const UserDto = User.extend({
  agency: Agency.omit({ lastModified: true, created: true }),
})
export type UserDto = z.infer<typeof UserDto>
