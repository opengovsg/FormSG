import { useMemo } from 'react'
import { Box, Flex, Grid, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import { useFormResponses } from '../../../queries'

import { DownloadButton } from './DownloadButton'

export const UnlockedResponses = (): JSX.Element => {
  const { data: { count } = {} } = useFormResponses()

  const prettifiedResponsesCount = useMemo(() => {
    if (!count) return
    return simplur` ${[count]}response[|s] to date`
  }, [count])

  return (
    <Flex flexDir="column" h="100%">
      <Grid
        mb="1rem"
        alignItems="end"
        color="secondary.500"
        gridTemplateColumns={{ base: 'auto', md: 'auto 1fr' }}
        gridGap={{ base: '0.5rem', md: '1.5rem' }}
        gridTemplateAreas={{
          base: "'submissions submissions' 'export'",
          md: "'submissions export'",
        }}
      >
        <Box gridArea="submissions">
          <Text textStyle="h4">
            <Text as="span" color="primary.500">
              {count?.toLocaleString()}
            </Text>
            {prettifiedResponsesCount}
          </Text>
        </Box>
        <DownloadButton />
      </Grid>
    </Flex>
  )
}
