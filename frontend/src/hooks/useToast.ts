import React from 'react'
import {
  RenderProps,
  useToast as useChakraToast,
  UseToastOptions,
} from '@chakra-ui/react'

import { Toast, ToastProps } from '~/components/Toast/Toast'

type ToastBehaviourProps = Pick<
  UseToastOptions,
  'duration' | 'position' | 'render'
>

// onClose is provided by the chakra hook and should not be exposed to clients
export type UseToastProps = Omit<ToastBehaviourProps & ToastProps, 'onClose'>

type UseToast = () => (props: UseToastProps) => void

export const useToast: UseToast = () => {
  const toast = useChakraToast()

  return ({
    duration = 6000,
    position = 'top',
    render,
    ...rest
  }: UseToastProps) =>
    toast({
      duration,
      position,
      render: (props: RenderProps) =>
        // NOTE: Because chakra expects this to be JSX, this has to be called with createElement.
        // Omitting the createElement causes a visual bug, where our own theme providers are not used.
        // Using createElement also allows the file to be pure ts rather than tsx.
        React.createElement(() => Toast({ ...rest, ...props })),
    })
}
