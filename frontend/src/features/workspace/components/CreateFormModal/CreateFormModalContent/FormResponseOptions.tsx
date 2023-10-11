import { BiHappyHeartEyes, BiLockAlt, BiMailSend } from 'react-icons/bi'
import { forwardRef, Stack, UnorderedList } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form/form'

import Badge from '~components/Badge'
import Tile from '~components/Tile'

export interface FormResponseOptionsProps {
  containsMyInfoFields: boolean
  onChange: (option: FormResponseMode) => void
  value: FormResponseMode
}

const OptionDescription = ({ listItems = [] }: { listItems: string[] }) => {
  return (
    <>
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
>(({ value, onChange, containsMyInfoFields }, ref) => {
  return (
    <Stack spacing="1rem" w="100%" direction={{ base: 'column', md: 'row' }}>
      <Tile
        variant="complex"
        icon={BiHappyHeartEyes}
        badge={<Badge colorScheme="success">Recommended</Badge>}
        isActive={value === FormResponseMode.Encrypt}
        isDisabled={containsMyInfoFields}
        onClick={() => onChange(FormResponseMode.Encrypt)}
        isFullWidth
        flex={1}
      >
        <Tile.Title>Public Mode</Tile.Title>
        <Tile.Subtitle>
          Anyone with the link would be able to view the directory listing
        </Tile.Subtitle>
        {/* <OptionDescription
          listItems={[
            'Attachments: up to 20MB per form',
            'Up to Restricted and Sensitive (Normal) data',
            'Supports webhooks for responses',
            'Supports payments',
          ]}
        /> */}
      </Tile>
      <Tile
        ref={ref}
        variant="complex"
        icon={BiLockAlt}
        isActive={value === FormResponseMode.Email}
        onClick={() => onChange(FormResponseMode.Email)}
        isFullWidth
        flex={1}
      >
        <Tile.Title>Private Mode</Tile.Title>
        <Tile.Subtitle>
          Only users who are logged in with your agency domain can view the
          directory listing
        </Tile.Subtitle>
        {/* <OptionDescription
          listItems={[
            'Attachments: up to 7MB per form',
            'Up to Restricted and Sensitive (High) data',
            'Supports MyInfo fields',
          ]}
        /> */}
      </Tile>
    </Stack>
  )
})
