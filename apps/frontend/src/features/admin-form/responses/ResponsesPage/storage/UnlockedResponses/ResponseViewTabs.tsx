import { useTranslation } from 'react-i18next'
import { BiX } from 'react-icons/bi'
import { Flex } from '@chakra-ui/react'

import Button from '~components/Button'
import IconButton from '~components/IconButton'

export interface SavedResponseView {
  id: string
  name: string
}

const ALL_RESPONSES_TAB_ID = 'all-responses'

export const ResponseViewTabs = ({
  views = [],
  selectedViewId = ALL_RESPONSES_TAB_ID,
  onSelectView,
  onDeleteView,
}: {
  views?: SavedResponseView[]
  selectedViewId?: string
  onSelectView?: (viewId: string) => void
  onDeleteView?: (viewId: string) => void
}): JSX.Element => {
  const { t } = useTranslation()
  const { allResponses, deleteView } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.views',
    { returnObjects: true },
  )

  const tabs = [
    { id: ALL_RESPONSES_TAB_ID, name: allResponses, isSavedView: false },
    ...views.map((view) => ({ ...view, isSavedView: true })),
  ]

  return (
    <Flex
      align="flex-end"
      overflowX="auto"
      overflowY="hidden"
      w="100%"
      maxW="100%"
      mb="1rem"
      flexShrink={0}
      sx={{
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { width: 0, height: 0 },
      }}
    >
      {tabs.map(({ id, name, isSavedView }) => {
        const isActive = id === selectedViewId
        return (
          <Flex
            key={id}
            align="center"
            flexShrink={0}
            borderBottom="2px solid"
            borderBottomColor={isActive ? 'primary.500' : 'transparent'}
            _hover={{ bg: 'neutral.100' }}
          >
            <Button
              variant="clear"
              colorScheme="secondary"
              aria-current={isActive || undefined}
              borderRadius={0}
              pl="1rem"
              pr={isSavedView ? '0.5rem' : '1rem'}
              color={isActive ? 'primary.500' : 'secondary.500'}
              textStyle={isActive ? 'subhead-1' : 'body-1'}
              _hover={{ color: 'primary.500', bg: 'transparent' }}
              _focus={{ boxShadow: 'none' }}
              _focusVisible={{
                boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)',
              }}
              onClick={() => onSelectView?.(id)}
            >
              {name}
            </Button>
            {isSavedView ? (
              <IconButton
                variant="clear"
                colorScheme="secondary"
                size="xs"
                mr="0.5rem"
                icon={<BiX />}
                aria-label={deleteView.replace('{VIEW_NAME}', name)}
                color="secondary.300"
                _hover={{ color: 'primary.500', bg: 'transparent' }}
                _focus={{ boxShadow: 'none' }}
                _focusVisible={{
                  boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)',
                }}
                onClick={() => onDeleteView?.(id)}
              />
            ) : null}
          </Flex>
        )
      })}
    </Flex>
  )
}
