declare module 'msw-storybook-addon' {
  import { Decorator } from '@storybook/react'
  import { SetupWorkerApi } from 'msw'
  import { SetupServerApi } from 'msw/node'

  export declare const mswDecorator: Decorator
  export declare const initialize: (
    options?:
      | Parameters<SetupWorkerApi['start']>[0]
      | Parameters<SetupServerApi['listen']>[0],
  ) => void
}
