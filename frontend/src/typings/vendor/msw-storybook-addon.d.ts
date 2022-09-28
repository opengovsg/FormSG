declare module 'msw-storybook-addon' {
  import { DecoratorFn } from '@storybook/react'
  import { SetupWorkerApi } from 'msw'
  import { SetupServerApi } from 'msw/node'

  export declare const mswDecorator: DecoratorFn
  export declare const initialize: (
    options?:
      | Parameters<SetupWorkerApi['start']>[0]
      | Parameters<SetupServerApi['listen']>[0],
  ) => void
}
