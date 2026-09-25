import { useTranslation } from 'react-i18next'
import { Flex } from '@chakra-ui/react'

import Button from '~components/Button'

export interface SavedResponseView {
  id: string
  name: string
}

const ALL_RESPONSES_TAB_ID = 'all-responses'

export const ResponseViewTabs = ({
  views = [],
  selectedViewId = ALL_RESPONSES_TAB_ID,
  onSelectView,
}: {
  views?: SavedResponseView[]
  selectedViewId?: string
  onSelectView?: (viewId: string) => void
}): JSX.Element => {
  const { t } = useTranslation()
  const { allResponses } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.views',
    { returnObjects: true },
  )

  const tabs = [{ id: ALL_RESPONSES_TAB_ID, name: allResponses }, ...views]

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
        scrollbarWidth: 0,
        '&::-webkit-scrollbar': { width: 0, height: 0 },
      }}
    >
      {tabs.map(({ id, name }) => {
        const isActive = id === selectedViewId
        return (
          <Button
            key={id}
            variant="clear"
            colorScheme="secondary"
            aria-selected={isActive}
            role="tab"
            flexShrink={0}
            borderRadius={0}
            px="1rem"
            borderBottom="2px solid"
            borderBottomColor={isActive ? 'primary.500' : 'transparent'}
            color={isActive ? 'primary.500' : 'secondary.500'}
            textStyle={isActive ? 'subhead-1' : 'body-1'}
            _hover={{ color: 'primary.500', bg: 'neutral.100' }}
            onClick={() => onSelectView?.(id)}
          >
            {name}
          </Button>
        )
      })}
    </Flex>
  )
}
