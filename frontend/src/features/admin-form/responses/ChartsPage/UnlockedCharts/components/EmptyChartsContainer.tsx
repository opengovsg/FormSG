import { Box, Container, Divider, Stack, Text } from '@chakra-ui/react'

import { ChartsSvgr } from '../assets/svgr/ChartsSvgr'

import { ChartsSupportedFieldsInfoBox } from './ChartsSupportedFieldsInfoBox'

export const EmptyChartsContainer = ({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}): JSX.Element => {
  return (
    <Container p={0} maxW="42.5rem">
      <Stack spacing="1rem" align="center">
        <Text as="h2" color="primary.500" textStyle="h4" whiteSpace="pre-wrap">
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
