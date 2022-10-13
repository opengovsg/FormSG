import { useMemo } from 'react'
import { Box, ButtonProps, chakra, Flex, Text } from '@chakra-ui/react'
import dayjs from 'dayjs'

import { AdminDashboardFormMetaDto, FormStatus } from '~shared/types/form/form'

import { useRowAction } from './RowActions/useRowAction'
import { FormStatusLabel } from './FormStatusLabel'
import { RowActions } from './RowActions'

export interface WorkspaceFormRowProps extends ButtonProps {
  formMeta: AdminDashboardFormMetaDto
}

const RELATIVE_DATE_FORMAT = {
  sameDay: '[today,] D MMM h:mma', // today, 16 Jun 9:30am
  nextDay: '[tomorrow,] D MMM h:mma', // tomorrow, 16 Jun 9:30am
  lastDay: '[yesterday,] D MMM h:mma', // yesterday, 16 Jun 9:30am
  nextWeek: 'ddd, D MMM YYYY h:mma', // Tue, 17 Oct 2021 9:30pm
  lastWeek: 'ddd, D MMM YYYY h:mma', // Tue, 17 Oct 2021 9:30pm
  sameElse: 'D MMM YYYY h:mma', // 6 Oct 2021 9:30pm
}

export const WorkspaceFormRow = ({
  formMeta,
  ...buttonProps
}: WorkspaceFormRowProps): JSX.Element => {
  const prettyLastModified = useMemo(() => {
    return dayjs(formMeta.lastModified).calendar(null, RELATIVE_DATE_FORMAT)
  }, [formMeta.lastModified])

  const { handleEditForm } = useRowAction(formMeta)

  return (
    <Box pos="relative">
      <chakra.button
        transitionProperty="common"
        transitionDuration="normal"
        onClick={handleEditForm}
        w="100%"
        py="1.5rem"
        display="grid"
        justifyContent="space-between"
        gridTemplateColumns={{
          base: '1fr 2.75rem',
          md: '1fr 4rem 8rem',
        }}
        gridTemplateRows={{ base: 'auto 2.75rem', md: 'auto' }}
        gridTemplateAreas={{
          base: "'title title' 'status actions'",
          md: "'title status actions'",
        }}
        gridGap={{ base: '0.5rem', md: '1.5rem' }}
        _hover={{
          bg: 'primary.100',
        }}
        _active={{
          bg: 'primary.200',
        }}
        _focus={{
          boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)',
        }}
        {...buttonProps}
      >
        <Flex
          flexDir="column"
          gridArea="title"
          textAlign="initial"
          overflow="auto"
          opacity={formMeta.status !== FormStatus.Public ? '30%' : '100%'}
        >
          <Text
            noOfLines={{ base: 0, md: 1 }}
            title={formMeta.title}
            textStyle="subhead-1"
            color="secondary.700"
          >
            {formMeta.title}
          </Text>
          <Text textStyle="body-2" color="secondary.400">
            Edited {prettyLastModified}
          </Text>
        </Flex>
        <Box gridArea="status" alignSelf="center">
          <FormStatusLabel status={formMeta.status} />
        </Box>
        {/* Blank spacing for absolutely positioned RowActions component */}
        <Box gridArea="actions" />
      </chakra.button>
      <RowActions formMeta={formMeta} />
    </Box>
  )
}
