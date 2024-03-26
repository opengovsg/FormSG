import { BiLockAlt, BiMailSend } from 'react-icons/bi'
import { forwardRef, Stack, UnorderedList } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form/form'

import { MultiParty } from '~assets/icons'
import Badge from '~components/Badge'
import Tile from '~components/Tile'

export interface FormResponseOptionsProps {
  onChange: (option: FormResponseMode) => void
  value: FormResponseMode
  showMrf: boolean
  isSingpass: boolean
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
>(({ value, onChange, showMrf, isSingpass }, ref) => {
  return (
    <Stack spacing="1rem" w="100%" direction={{ base: 'column', md: 'row' }}>
      <Tile
        variant="complex"
        icon={BiLockAlt}
        badge={
          <Badge colorScheme={showMrf ? 'neutral' : 'success'}>
            Recommended
          </Badge>
        }
        isActive={value === FormResponseMode.Encrypt}
        onClick={() => onChange(FormResponseMode.Encrypt)}
        isFullWidth
        flex={1}
      >
        <Tile.Title>Storage mode form</Tile.Title>
        <Tile.Subtitle>View or download responses in FormSG</Tile.Subtitle>
        <OptionDescription
          listItems={[
            'Attachments: up to 20MB per form',
            'Up to Restricted and Sensitive (Normal) data',
            'Supports webhooks for responses',
            'Supports payments',
          ]}
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
        <Tile.Title>Email mode form</Tile.Title>
        <Tile.Subtitle>Receive responses in your inbox</Tile.Subtitle>
        <OptionDescription
          listItems={[
            'Supported by Checkpoint, an approval workflow tool',
            'Attachments: up to 7MB per form',
            'Up to Restricted and Sensitive (High) data',
          ]}
        />
      </Tile>
      {showMrf && (
        <Tile
          ref={ref}
          variant="complex"
          icon={MultiParty}
          badge={<Badge colorScheme="success">New</Badge>}
          isActive={value === FormResponseMode.Multirespondent}
          onClick={() => onChange(FormResponseMode.Multirespondent)}
          isFullWidth
          flex={1}
          isDisabled={isSingpass}
        >
          <Tile.Title>Multi-respondent form</Tile.Title>
          <Tile.Subtitle>
            Create a workflow to collect responses from multiple respondents
          </Tile.Subtitle>
          <OptionDescription
            listItems={[
              'Route form to respondents according to a sequence',
              'Specify up to two respondents to route form to for filling',
            ]}
          />
        </Tile>
      )}
    </Stack>
  )
})
