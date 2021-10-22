import { BiLeftArrowAlt, BiShow, BiUserPlus } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  Flex,
  Grid,
  GridItem,
  TabList,
} from '@chakra-ui/react'

import { AdminFormDto } from '~shared/types/form/form'

import { useDraggable } from '~hooks/useDraggable'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import { Tab } from '~components/Tabs'

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
  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()

  return (
    <Grid
      w="100vw"
      overflowX="auto"
      position="sticky"
      top={0}
      flexDir="column"
      templateColumns={{
        base: '1fr',
        lg: 'repeat(3, minmax(0, 1fr))',
      }}
      templateAreas={{
        base: `'left right' 'tabs tabs'`,
        lg: `'left tabs right'`,
      }}
      boxShadow={{ lg: '0 1px 1px var(--chakra-colors-neutral-300)' }}
      bg="white"
      zIndex="docked"
      flex={1}
    >
      <GridItem
        display="flex"
        flex={1}
        alignItems="center"
        gridArea="left"
        py="0.625rem"
        pl="2rem"
        pr="1rem"
      >
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
      </GridItem>
      <TabList
        ref={ref}
        onMouseDown={onMouseDown}
        pt={{ base: '0.375rem', lg: 0 }}
        px={{ base: '1.75rem', lg: '1rem' }}
        w={{ base: '100vw', lg: 'initial' }}
        gridArea="tabs"
        borderBottom="none"
        justifyContent={{ base: 'flex-start', lg: 'center' }}
        alignSelf="center"
      >
        <Tab isDisabled={!formInfo}>Create</Tab>
        <Tab isDisabled={!formInfo}>Settings</Tab>
        <Tab isDisabled={!formInfo}>Results</Tab>
      </TabList>
      <Flex
        py="0.625rem"
        pl="1rem"
        pr="2rem"
        flex={1}
        gridArea="right"
        justifyContent="flex-end"
      >
        <ButtonGroup spacing="0.5rem" isDisabled={!formInfo}>
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
    </Grid>
  )
}
