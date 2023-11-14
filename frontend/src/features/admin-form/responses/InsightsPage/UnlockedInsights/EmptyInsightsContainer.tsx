import {
  Container,
  List,
  ListIcon,
  ListItem,
  Stack,
  Text,
} from '@chakra-ui/react'

import { BxCheck } from '~assets/icons'

import { EmailResponsesSvgr } from './assets/NoChartsSvgr'

const ListWithIcon = ({ children }: { children: React.ReactNode }) => (
  <ListItem>
    <ListIcon as={BxCheck} color="green.500" />
    {children}
  </ListItem>
)

export const EmptyInsightsContainer = (): JSX.Element => {
  return (
    <Container p={0} maxW="42.5rem">
      <Stack spacing="2rem">
        <EmailResponsesSvgr />
        <Text as="h2" textStyle="h2" whiteSpace="pre-wrap">
          No charts available.
        </Text>
        <Text textStyle="body-1">
          We can support charts for fields that are of type:
          <List>
            <ListWithIcon>Short Text</ListWithIcon>
            <ListWithIcon>Long Text</ListWithIcon>
            <ListWithIcon>Rating</ListWithIcon>
            <ListWithIcon>Radio</ListWithIcon>
            <ListWithIcon>Checkbox</ListWithIcon>
            <ListWithIcon>Dropdown</ListWithIcon>
            <ListWithIcon>Country Region</ListWithIcon>
            <ListWithIcon>Yes / No</ListWithIcon>
          </List>
        </Text>
      </Stack>
    </Container>
  )
}
