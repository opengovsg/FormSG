import { useBreakpointValue } from '@chakra-ui/media-query'
import { ThemingProps } from '@chakra-ui/react'

type ModalSize = ThemingProps<'Modal'>['size']

export const useModalSize = ({
  base = 'mobile',
  xs = 'mobile',
  md = 'md',
  ...rest
}: Partial<Record<string, ModalSize>> = {}): ThemingProps<'Modal'>['size'] => {
  const modalSize = useBreakpointValue<ThemingProps<'Modal'>['size']>(
    {
      base,
      xs,
      md,
      ...rest,
    },
    { ssr: false },
  )

  return modalSize
}
