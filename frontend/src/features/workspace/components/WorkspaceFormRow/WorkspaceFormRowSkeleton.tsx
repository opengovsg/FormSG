import { BiDotsHorizontalRounded } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  Flex,
  Grid,
  Skeleton,
  SkeletonCircle,
  Text,
} from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import IconButton from '~components/IconButton'

const RowDropdownButtonSkeleton = () => {
  return (
    <ButtonGroup isAttached variant="outline" colorScheme="secondary">
      <Button px="1.5rem" mr="-1px" isDisabled>
        Edit
      </Button>
      <IconButton isDisabled aria-label="Loading" icon={<BxsChevronDown />} />
    </ButtonGroup>
  )
}

const RowDrawerButtonSkeleton = () => {
  return (
    <IconButton
      variant="clear"
      isDisabled
      aria-label="Loading"
      icon={<BiDotsHorizontalRounded fontSize="1.25rem" />}
    />
  )
}

export const WorkspaceFormRowSkeleton = (): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <Grid
      py="1.5rem"
      px="2rem"
      templateColumns={{
        base: '1fr min-content',
        md: '1fr min-content min-content',
      }}
      templateAreas={{
        base: "'title title' 'status actions'",
        md: "'title status actions'",
      }}
      templateRows={{ base: 'auto', md: 'auto' }}
      gap={{ base: '0.5rem', md: '3.75rem' }}
    >
      <Flex flexDir="column" gridArea="title">
        <Box
          textDecorationLine="unset"
          display="inline-flex"
          alignItems="flex-start"
          flexDir="column"
          w="fit-content"
        >
          <Skeleton>
            <Text textStyle="subhead-1" color="secondary.700">
              Loading title... Loading title...
            </Text>
          </Skeleton>
          <Skeleton>
            <Text textStyle="body-2" color="secondary.400">
              Also loading metadata...
            </Text>
          </Skeleton>
        </Box>
      </Flex>
      <Box gridArea="status" alignSelf="center">
        <Flex align="center">
          <SkeletonCircle size="0.5rem" mr="0.5rem" />
          <Skeleton>
            <Text textStyle="body-2">Loading</Text>
          </Skeleton>
        </Flex>
      </Box>
      <Box gridArea="actions" alignSelf="center">
        {isMobile ? <RowDrawerButtonSkeleton /> : <RowDropdownButtonSkeleton />}
      </Box>
    </Grid>
  )
}
