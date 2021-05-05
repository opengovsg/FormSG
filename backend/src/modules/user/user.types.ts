import { SetRequired } from 'type-fest'

import { UserContactView } from 'src/types'

export type UserWithContactNumber = SetRequired<UserContactView, 'contact'>
