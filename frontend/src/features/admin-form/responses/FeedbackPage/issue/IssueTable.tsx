import { Column } from 'react-table'

import { DateCell } from '~features/admin-form/responses/FeedbackPage/DateCell'

export const ISSUE_TABLE_COLUMNS: Column[] = [
  {
    Header: '#',
    accessor: (_row, i) => i + 1,
    sortType: 'number',
    minWidth: 50, // minWidth is only used as a limit for resizing
    width: 50, // width is used for both the flex-basis and flex-grow
    maxWidth: 100, // maxWidth is only used as a limit for resizing
  },
  {
    Header: 'Date',
    accessor: 'timestamp',
    sortType: 'number',
    Cell: DateCell,
    minWidth: 80, // minWidth is only used as a limit for resizing
    width: 80, // width is used for both the flex-basis and flex-grow
    maxWidth: 120, // maxWidth is only used as a limit for resizing
  },
  {
    Header: 'Issue',
    accessor: 'issue',
    sortType: 'basic',
    minWidth: 200,
    width: 300,
    maxWidth: 600,
  },
  {
    Header: 'Contact',
    accessor: 'email',
    sortType: 'basic',
    minWidth: 120,
    width: 120,
    maxWidth: 300,
  },
]
