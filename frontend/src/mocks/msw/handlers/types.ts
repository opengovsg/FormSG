import { DefaultBodyType, DelayMode, MockedRequest, RestHandler } from 'msw'

export type WithDelayProps = {
  delay?: number | DelayMode
}

export type DefaultRequestReturn = RestHandler<MockedRequest<DefaultBodyType>>
