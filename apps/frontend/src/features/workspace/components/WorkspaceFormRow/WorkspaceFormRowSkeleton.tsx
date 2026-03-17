import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  return (
    <ButtonGroup isAttached variant="outline" colorScheme="secondary">
      <Button px="1.5rem" mr="-1px" isDisabled>
        {t('features.common.edit')}
      </Button>
      <IconButton
        isDisabled
        aria-label={t('features.common.loading')}
        icon={<BxsChevronDown />}
      />
    </ButtonGroup>
  )
}

const RowDrawerButtonSkeleton = () => {
  const { t } = useTranslation()
  return (
    <IconButton
      variant="clear"
      isDisabled
      aria-label={t('features.common.loading')}
      icon={<BiDotsHorizontalRounded fontSize="1.25rem" />}
    />
  )
}

export const WorkspaceFormRowSkeleton = (): JSX.Element => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const { title, metadata } = t('features.workspace.skeleton', {
    returnObjects: true,
  })
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
              {title}
            </Text>
          </Skeleton>
          <Skeleton mt="0.5rem">
            <Text textStyle="body-2" color="secondary.400">
              {metadata}
            </Text>
          </Skeleton>
        </Box>
      </Flex>
      <Box gridArea="status" alignSelf="center">
        <Flex align="center">
          <SkeletonCircle size="0.5rem" mr="0.5rem" />
          <Skeleton>
            <Text textStyle="body-2">{t('features.common.loading')}</Text>
          </Skeleton>
        </Flex>
      </Box>
      <Box gridArea="actions" alignSelf="center">
        {isMobile ? <RowDrawerButtonSkeleton /> : <RowDropdownButtonSkeleton />}
      </Box>
    </Grid>
  )
}
