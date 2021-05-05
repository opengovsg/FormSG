import { SetRequired } from 'type-fest'

import { UserContactView } from '@root/types'

export type UserWithContactNumber = SetRequired<UserContactView, 'contact'>
