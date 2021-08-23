import { useRef } from 'react'
import { Tab as ChakraTab, TabProps } from '@chakra-ui/react'

export const Tab = (props: TabProps): JSX.Element => {
  const tabRef = useRef<HTMLButtonElement>(null)

  const handleFocus = () => {
    tabRef.current?.scrollIntoView({
      inline: 'center',
    })
  }
  return <ChakraTab {...props} ref={tabRef} onFocus={handleFocus} />
}
