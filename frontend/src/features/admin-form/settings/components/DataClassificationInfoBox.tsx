import { BiSolidInfoCircle } from 'react-icons/bi'
import { Flex, Icon } from '@chakra-ui/react'

import { useMdComponents } from '~hooks/useMdComponents'
import { MarkdownText } from '~components/MarkdownText'

export default function DataClassificationInfoBox() {
  const mdComponents = useMdComponents({})

  return (
    <Flex bg="primary.100" p="1rem" marginBottom="40px" borderRadius="4px">
      <Icon
        as={BiSolidInfoCircle}
        color="primary.500"
        fontSize="1.5rem"
        mr="0.5rem"
      />
      <MarkdownText
        components={mdComponents}
      >{`All forms support up to Confidential (Cloud-Eligible) and Sensitive (High) data.`}</MarkdownText>
    </Flex>
  )
}
