import { DefaultRequestBody, DelayMode, MockedRequest, RestHandler } from 'msw'

export type WithDelayProps = {
  delay?: number | DelayMode
}

export type DefaultRequestReturn = RestHandler<
  MockedRequest<DefaultRequestBody>
>
