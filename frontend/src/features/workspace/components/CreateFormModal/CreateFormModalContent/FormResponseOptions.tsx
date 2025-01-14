import { BiLockAlt, BiMailSend } from 'react-icons/bi'
import { forwardRef, Stack, UnorderedList } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form/form'

import { MultiParty } from '~assets/icons'
import Badge from '~components/Badge'
import Tile from '~components/Tile'

export interface FormResponseOptionsProps {
  onChange: (option: FormResponseMode) => void
  value: FormResponseMode
  isSingpass: boolean
}

interface optionDescriptionIem {
  text: string
  badge?: string
  badgeColorScheme?: string
}

const OptionDescription = ({
  listItems = [],
}: {
  listItems: optionDescriptionIem[]
}) => {
  return (
    <>
      <UnorderedList color="secondary.400" ml="1.5rem">
        {listItems.map(
          ({ text, badge, badgeColorScheme = 'success' }, index) => (
            <Tile.ListItem key={index} textStyle="body-2" textAlign="left">
              {text}
              {badge && (
                <Badge size="xs" ml="0.2rem" colorScheme={badgeColorScheme}>
                  {badge}
                </Badge>
              )}
            </Tile.ListItem>
          ),
        )}
      </UnorderedList>
    </>
  )
}

export const FormResponseOptions = forwardRef<
  FormResponseOptionsProps,
  'button'
>(({ value, onChange, isSingpass }, ref) => {
  return (
    <Stack spacing="1rem" w="100%" direction={{ base: 'column', md: 'row' }}>
      <Tile
        variant="complex"
        icon={BiLockAlt}
        isActive={value === FormResponseMode.Encrypt}
        onClick={() => onChange(FormResponseMode.Encrypt)}
        flex={1}
      >
        <Tile.Title>Storage mode form</Tile.Title>
        <Tile.Subtitle>
          View and download responses in FormSG or receive responses in your
          inbox
        </Tile.Subtitle>
        <OptionDescription
          listItems={[
            { text: 'Supports webhooks for responses' },
            { text: 'Supports payments' },
            { text: 'Up to Restricted and Sensitive (Normal) data' },
          ]}
        />
      </Tile>
      <Tile
        ref={ref}
        variant="complex"
        icon={MultiParty}
        isActive={value === FormResponseMode.Multirespondent}
        onClick={() => onChange(FormResponseMode.Multirespondent)}
        flex={1}
        isDisabled={isSingpass}
      >
        <Tile.Title>Multi-respondent form</Tile.Title>
        <Tile.Subtitle>
          Collect responses from multiple people by adding a workflow to your
          form and assigning fields to each person
        </Tile.Subtitle>
        <OptionDescription
          listItems={[
            { text: 'Supports approvals', badge: 'New' },
            { text: 'Up to Restricted and Sensitive (Normal) data' },
          ]}
        />
      </Tile>
      <Tile
        ref={ref}
        variant="complex"
        icon={BiMailSend}
        isActive={value === FormResponseMode.Email}
        onClick={() => onChange(FormResponseMode.Email)}
        flex={1}
      >
        <Tile.Title>Email mode form</Tile.Title>
        <Tile.Subtitle>Receive responses in your inbox only</Tile.Subtitle>
        <OptionDescription
          listItems={[{ text: 'Up to Restricted and Sensitive (High) data' }]}
        />
      </Tile>
    </Stack>
  )
})
