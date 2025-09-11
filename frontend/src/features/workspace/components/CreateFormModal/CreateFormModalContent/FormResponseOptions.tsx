import { useTranslation } from 'react-i18next'
import { Flex, forwardRef, Stack, UnorderedList } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form/form'

import Badge from '~components/Badge'
import Tile from '~components/Tile'

import MultiRespondentIllustration from '~features/workspace/components/CreateFormModal/CreateFormModalContent/MultiRespondentIllustration'
import SingleRespondentIllustration from '~features/workspace/components/CreateFormModal/CreateFormModalContent/SingleRespondentIllustration'

export interface FormResponseOptionsProps {
  onChange: (option: FormResponseMode) => void
  handleEmailButtonPress: () => void
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
  const { t } = useTranslation()
  const { storage, mrf } = t(
    'features.workspace.modals.forms.create.details.type',
    {
      returnObjects: true,
    },
  )
  return (
    <>
      <Stack spacing="1rem" w="100%" direction={{ base: 'column', md: 'row' }}>
        <Tile
          variant="complex"
          icon={SingleRespondentIllustration}
          isActive={value === FormResponseMode.Encrypt}
          onClick={() => onChange(FormResponseMode.Encrypt)}
          flex={1}
        >
          <Tile.Title>{storage.title}</Tile.Title>
          <Tile.Subtitle>{storage.subtitle}</Tile.Subtitle>
          <OptionDescription
            listItems={[
              { text: storage.optionDescriptionItems.supportSingpassMyinfo },
              { text: storage.optionDescriptionItems.supportWebhooks },
            ]}
          />
          <Badge
            size="md"
            variant="subtle"
            h="1.5rem"
            mt="1.5rem"
            alignSelf="flex-start"
          >
            Storage mode form
          </Badge>
        </Tile>
        <Tile
          ref={ref}
          variant="complex"
          icon={MultiRespondentIllustration}
          isActive={value === FormResponseMode.Multirespondent}
          onClick={() => onChange(FormResponseMode.Multirespondent)}
          flex={1}
          isDisabled={isSingpass}
        >
          <Tile.Title overflowWrap="anywhere">{mrf.title}</Tile.Title>
          <Tile.Subtitle>{mrf.subtitle}</Tile.Subtitle>
          <OptionDescription
            listItems={[
              {
                text: mrf.optionDescriptionItems.supportApprovalWorkflow,
              },
              {
                text: mrf.optionDescriptionItems.supportEmailRouting,
              },
            ]}
          />
          <Badge
            size="md"
            variant="subtle"
            h="1.5rem"
            mt="1.5rem"
            alignSelf="flex-start"
          >
            Multi-respondent form
          </Badge>
        </Tile>
      </Stack>
    </>
  )
})
