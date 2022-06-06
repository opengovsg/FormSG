import { FC } from 'react'
import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Text,
} from '@chakra-ui/react'

interface HelpAccordionItemProps {
  title: string
}

export const HelpAccordionItem: FC<HelpAccordionItemProps> = ({
  title,
  children,
}) => {
  return (
    <AccordionItem>
      <AccordionButton>
        <Text textStyle="subhead-1" flex="1" textAlign="left">
          {title}
        </Text>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel pb={4}>{children}</AccordionPanel>
    </AccordionItem>
  )
}
