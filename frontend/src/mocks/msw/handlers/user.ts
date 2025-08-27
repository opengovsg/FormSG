import { delay as MswDelay, http, HttpResponse } from 'msw'

import { AgencyId } from '~shared/types/agency'
import { ErrorDto } from '~shared/types/core'
import { DateString } from '~shared/types/generic'
import { UserDto, UserId, VerifyUserContactOtpDto } from '~shared/types/user'

import { WithDelayProps } from './types'

export const MOCK_USER: UserDto = {
  _id: 'mock_id' as UserId,
  email: 'admin@example.com',
  agency: {
    emailDomain: ['example.com'],
    _id: '59bb6d4ef06ef18400109733' as AgencyId,
    lastModified: '2017-09-15T06:03:58.803Z' as DateString,
    shortName: 'eg',
    fullName: 'Example Agency Name',
    logo: '/path/to/logo/example.jpg',
    created: '2017-09-15T06:03:58.792Z' as DateString,
  },
  betaFlags: { payment: true },
  created: '2020-03-26T09:39:44.613Z' as DateString,
  contact: '+6598765432',
  lastAccessed: '2021-08-24T09:10:02.661Z' as DateString,
  updatedAt: '2021-08-24T09:10:03.295Z' as DateString,
}

export const getUnauthedUser = ({ delay = 0 }: WithDelayProps = {}) => {
  return http.get<never, never, UserDto>('/api/v3/user', async () => {
    await MswDelay(delay)
    return new HttpResponse(null, {
      status: 401,
    })
  })
}

export const getUser = ({
  delay,
  mockUser = MOCK_USER,
}: { mockUser?: UserDto } & WithDelayProps = {}) => {
  return http.get<never, never, UserDto>('/api/v3/user', async () => {
    await MswDelay(delay)
    return HttpResponse.json(mockUser, {
      status: 200,
    })
  })
}

export const postGenerateContactOtp = ({ delay }: WithDelayProps = {}) => {
  return http.post('/api/v3/user/contact/otp/generate', async () => {
    await MswDelay(delay)
    return HttpResponse.json(null, {
      status: 200,
    })
  })
}

export const postVerifyContactOtp = ({
  delay,
  mockOtp,
}: WithDelayProps & { mockOtp?: string } = {}) => {
  return http.post<never, VerifyUserContactOtpDto, UserDto | ErrorDto>(
    '/api/v3/user/contact/otp/verify',
    async ({ request }) => {
      const body = await request.json()
      const nextContact = body.contact

      if (mockOtp && body.otp !== mockOtp) {
        await MswDelay(delay)
        return HttpResponse.json(
          { message: 'OTP is invalid. Please try again.' },
          {
            status: 422,
          },
        )
      }

      await MswDelay(delay)
      return HttpResponse.json(
        { ...MOCK_USER, contact: nextContact },
        {
          status: 200,
        },
      )
    },
  )
}

export const userHandlers = (props: WithDelayProps = {}) => [
  getUser(props),
  postGenerateContactOtp(props),
  postVerifyContactOtp(props),
]
