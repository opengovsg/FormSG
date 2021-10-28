import { BiLeftArrowAlt, BiShow, BiUserPlus } from 'react-icons/bi'
import { Box, ButtonGroup, Flex } from '@chakra-ui/react'

import { AdminFormDto } from '~shared/types/form/form'

import Button from '~components/Button'
import IconButton from '~components/IconButton'
import { TabList } from '~components/Tabs'
import { Tab } from '~components/Tabs/Tab'

import { AdminFormNavbarDetails } from './AdminFormNavbarDetails'

export interface AdminFormNavbarProps {
  /**
   * Minimum form info needed to render the navbar.
   * If not provided, the navbar will be in a loading state.
   */
  formInfo?: Pick<AdminFormDto, 'title' | 'lastModified'>

  handleBackButtonClick: () => void
  handleAddCollabButtonClick: () => void
  handlePreviewFormButtonClick: () => void
  handleShareButtonClick: () => void
}

/**
 * @precondition Must have AdminFormTabProvider parent due to usage of TabList and Tab.
 */
export const AdminFormNavbar = ({
  formInfo,
  handleAddCollabButtonClick,
  handleBackButtonClick,
  handlePreviewFormButtonClick,
  handleShareButtonClick,
}: AdminFormNavbarProps): JSX.Element => {
  return (
    <Flex py="0.625rem" px="2rem" justify="space-between" align="center">
      <Flex flex={1} align="center">
        <Box>
          <IconButton
            mr="0.5rem"
            aria-label="Go back to dashboard"
            variant="clear"
            colorScheme="secondary"
            onClick={handleBackButtonClick}
            icon={<BiLeftArrowAlt />}
          />
        </Box>
        <AdminFormNavbarDetails formInfo={formInfo} />
      </Flex>
      <TabList mt="-1.125rem" mb="-0.25rem" borderBottom="none">
        <Tab isDisabled={!formInfo}>Create</Tab>
        <Tab isDisabled={!formInfo}>Settings</Tab>
        <Tab isDisabled={!formInfo}>Results</Tab>
      </TabList>
      <ButtonGroup
        spacing="0.5rem"
        flex={1}
        justifyContent="flex-end"
        isDisabled={!formInfo}
      >
        <IconButton
          aria-label="Add collaborators to form"
          variant="outline"
          onClick={handleAddCollabButtonClick}
          icon={<BiUserPlus />}
        />
        <IconButton
          aria-label="Preview form"
          variant="outline"
          onClick={handlePreviewFormButtonClick}
          icon={<BiShow />}
        />
        <Button onClick={handleShareButtonClick}>Share</Button>
      </ButtonGroup>
    </Flex>
  )
}
