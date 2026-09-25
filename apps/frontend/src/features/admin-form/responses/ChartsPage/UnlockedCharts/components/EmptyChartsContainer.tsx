import { Box, Container, Divider, Flex, Stack, Text } from '@chakra-ui/react'

import { resultsNavBleed } from '../../../components/FormResultsNavbar'
import { useIsDelightfulDashboard } from '../../../hooks'
import { ChartsSvgr } from '../assets/svgr/ChartsSvgr'

import { ChartsSupportedFieldsInfoBox } from './ChartsSupportedFieldsInfoBox'

export const EmptyChartsContainer = ({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}): JSX.Element => {
  const isDelightfulDashboard = useIsDelightfulDashboard()

  if (!isDelightfulDashboard)
    return <LegacyEmptyChartsContainer title={title} subtitle={subtitle} />

  return (
    <Flex
      flexDir="column"
      align="center"
      py="4rem"
      px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
      {...resultsNavBleed}
    >
      <Stack spacing="1rem" align="center">
        <Text as="h2" color="primary.500" textStyle="h2" whiteSpace="pre-wrap">
          {title}
        </Text>
        <Text textStyle="body-1" color="secondary.500" mb="0.5rem">
          {subtitle}
        </Text>
        <Box pb="2.5rem" pt="0.5rem">
          <ChartsSvgr />
        </Box>
        <Divider />
        <ChartsSupportedFieldsInfoBox />
      </Stack>
    </Flex>
  )
}

const LegacyEmptyChartsContainer = ({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}): JSX.Element => {
  return (
    <Container p={0} maxW="42.5rem">
      <Stack spacing="1rem" align="center">
        <Text as="h2" color="primary.500" textStyle="h2" whiteSpace="pre-wrap">
          {title}
        </Text>
        <Text textStyle="body-1" color="secondary.500" mb="0.5rem">
          {subtitle}
        </Text>
        <Box pb="2.5rem" pt="0.5rem">
          <ChartsSvgr />
        </Box>
        <Divider />
        <ChartsSupportedFieldsInfoBox />
      </Stack>
    </Container>
  )
}
