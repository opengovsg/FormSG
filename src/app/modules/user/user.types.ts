import type { SetRequired } from 'type-fest'

import { UserContactView } from '../../../types'

export type UserWithContactNumber = SetRequired<UserContactView, 'contact'>
