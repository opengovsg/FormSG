import { Column } from 'react-table'

import { DateCell } from '~features/admin-form/responses/FeedbackPage/DateCell'

export const REVIEW_TABLE_COLUMNS: Column[] = [
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
    Header: 'Feedback',
    accessor: 'comment',
    sortType: 'basic',
    minWidth: 200,
    width: 300,
    maxWidth: 600,
  },
  {
    Header: 'Rating',
    accessor: 'rating',
    sortType: 'number',
    minWidth: 90,
    width: 90,
    disableResizing: true,
  },
]
