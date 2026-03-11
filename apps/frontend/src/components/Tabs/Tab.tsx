import { useRef } from 'react'
import { Tab as ChakraTab, TabProps } from '@chakra-ui/react'

export const Tab = (props: TabProps): JSX.Element => {
  const tabRef = useRef<HTMLButtonElement>(null)

  // Ensures that when navigating horizontally through tabs,
  // the focused tab is scrolled horizontally into view
  const handleFocus = () => {
    tabRef.current?.scrollIntoView({
      // prevent unnecessary vertical scrolling
      block: 'nearest',
    })
  }
  return <ChakraTab {...props} ref={tabRef} onFocus={handleFocus} />
}
