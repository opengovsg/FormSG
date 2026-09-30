import { useRef } from 'react'
import { useDisclosure, useOutsideClick } from '@chakra-ui/react'

const PORTAL_SELECTOR = '.chakra-portal'

export const useToolbarMenuDisclosure = ({
  onClose,
}: { onClose?: () => void } = {}) => {
  const disclosure = useDisclosure({ onClose })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useOutsideClick({
    ref: listRef,
    enabled: disclosure.isOpen,
    handler: (event) => {
      const target = event.target as Element
      if (buttonRef.current?.contains(target)) return
      if (target.closest(PORTAL_SELECTOR)) return
      disclosure.onClose()
    },
  })

  return { ...disclosure, buttonRef, listRef }
}
