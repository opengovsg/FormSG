import { useMemo } from 'react'
import { Flex, Grid, GridProps, Text } from '@chakra-ui/layout'
import dayjs from 'dayjs'

import { AdminDashboardFormMetaDto } from '~shared/types/form/form'

import { FormStatusLabel } from './FormStatusLabel'
import { RowActionDropdown } from './RowActionDropdown'

export interface WorkspaceFormRowProps extends GridProps {
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
  ...gridProps
}: WorkspaceFormRowProps): JSX.Element => {
  const prettyLastModified = useMemo(() => {
    return dayjs(formMeta.lastModified).calendar(null, RELATIVE_DATE_FORMAT)
  }, [formMeta.lastModified])

  return (
    <Grid
      py="1.5rem"
      justify="space-between"
      templateColumns="1fr min-content min-content"
      gap="3.75rem"
      {...gridProps}
    >
      <Flex flexDir="column" flex={1}>
        <Text
          isTruncated
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
      <FormStatusLabel status={formMeta.status} />
      <RowActionDropdown formId={formMeta._id} />
    </Grid>
  )
}
