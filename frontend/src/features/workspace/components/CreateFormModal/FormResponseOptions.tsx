import { BiLockAlt, BiMailSend } from 'react-icons/bi'
import { forwardRef, Stack, UnorderedList } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form/form'

import Badge from '~components/Badge'
import Tile from '~components/Tile'

export interface FormResponseOptionsProps {
  onChange: (option: FormResponseMode) => void
  value: FormResponseMode
}

const OptionDescription = ({
  listTitle,
  listItems = [],
}: {
  listTitle: string
  listItems: string[]
}) => {
  return (
    <>
      <Tile.Text textStyle="subhead-2">{listTitle}</Tile.Text>
      <UnorderedList color="secondary.400" ml="1.5rem">
        {listItems.map((text, index) => (
          <Tile.ListItem key={index} textStyle="body-2" textAlign="left">
            {text}
          </Tile.ListItem>
        ))}
      </UnorderedList>
    </>
  )
}

export const FormResponseOptions = forwardRef<
  FormResponseOptionsProps,
  'button'
>(({ value, onChange }, ref) => {
  return (
    <Stack spacing="1rem" w="100%" direction={{ base: 'column', md: 'row' }}>
      <Tile
        variant="complex"
        icon={BiLockAlt}
        badge={<Badge colorScheme="success">recommended</Badge>}
        isActive={value === FormResponseMode.Encrypt}
        onClick={() => onChange(FormResponseMode.Encrypt)}
        isFullWidth
        flex={1}
      >
        <Tile.Title>Storage Mode</Tile.Title>
        <Tile.Subtitle>Receive responses in Form</Tile.Subtitle>
        <OptionDescription
          listTitle="Benefits"
          listItems={['20 mb limit for attachments', 'End to end encryption']}
        />
      </Tile>
      <Tile
        ref={ref}
        variant="complex"
        icon={BiMailSend}
        isActive={value === FormResponseMode.Email}
        onClick={() => onChange(FormResponseMode.Email)}
        isFullWidth
        flex={1}
      >
        <Tile.Title>Email Mode</Tile.Title>
        <Tile.Subtitle>Receive responses in your inbox</Tile.Subtitle>
        <OptionDescription
          listTitle="Benefits"
          listItems={[
            'Users can receive emailed copy of response',
            'MyInfo fields',
          ]}
        />
      </Tile>
    </Stack>
  )
})
