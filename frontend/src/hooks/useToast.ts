import React, { useMemo } from 'react'
import {
  RenderProps,
  useToast as useChakraToast,
  UseToastOptions as ChakraUseToastOptions,
} from '@chakra-ui/react'

import { Toast, ToastProps, ToastStatus } from '~/components/Toast/Toast'

type ToastBehaviourProps = Pick<
  ChakraUseToastOptions,
  'duration' | 'position' | 'render'
>

export type UseToastProps = Omit<
  ToastBehaviourProps & ToastProps,
  // onClose is provided by the chakra hook and should not be exposed to clients.
  // ChakraToast's status is different from this custom component, hence replaced
  // with ToastStatus for type compatibility.
  'onClose' | 'status'
> & { status?: ToastStatus }

export type UseToastReturn = {
  (options: UseToastProps): string | number | undefined
  close: ReturnType<typeof useChakraToast>['close']
  closeAll: ReturnType<typeof useChakraToast>['closeAll']
  isActive: ReturnType<typeof useChakraToast>['isActive']
  update: ReturnType<typeof useChakraToast>['update']
}

export const useToast = ({
  status: initialStatus = 'success',
  ...initialProps
}: UseToastProps = {}): UseToastReturn => {
  const toast = useChakraToast(initialProps)

  const customToastImpl = useMemo(() => {
    const impl = ({
      duration = 6000,
      position = 'top',
      render,
      status,
      ...rest
    }: UseToastProps) =>
      toast({
        duration,
        position,
        ...rest,
        render: (props: RenderProps) =>
          // NOTE: Because chakra expects this to be JSX, this has to be called with createElement.
          // Omitting the createElement causes a visual bug, where our own theme providers are not used.
          // Using createElement also allows the file to be pure ts rather than tsx.
          render ??
          React.createElement(() =>
            Toast({
              status: status ?? initialStatus,
              isClosable: initialProps.isClosable,
              ...rest,
              ...props,
            }),
          ),
      })

    impl.close = toast.close
    impl.closeAll = toast.closeAll
    impl.isActive = toast.isActive
    impl.update = toast.update

    return impl
  }, [initialProps.isClosable, initialStatus, toast])

  return customToastImpl
}
