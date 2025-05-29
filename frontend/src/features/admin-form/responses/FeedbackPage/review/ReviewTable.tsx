import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Column } from 'react-table'

import { DateCell } from '~features/admin-form/responses/FeedbackPage/DateCell'

export const useReviewTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    (): Column[] => [
      {
        Header: '#',
        accessor: (_row, i) => i + 1,
        sortType: 'number',
        minWidth: 50, // minWidth is only used as a limit for resizing
        width: 50, // width is used for both the flex-basis and flex-grow
        maxWidth: 100, // maxWidth is only used as a limit for resizing
      },
      {
        Header: t('features.adminForm.feedback.reviewTable.dateHeader'),
        accessor: 'timestamp',
        sortType: 'number',
        Cell: DateCell,
        minWidth: 80, // minWidth is only used as a limit for resizing
        width: 80, // width is used for both the flex-basis and flex-grow
        maxWidth: 120, // maxWidth is only used as a limit for resizing
      },
      {
        Header: t('features.adminForm.feedback.reviewTable.feedbackHeader'),
        accessor: 'comment',
        sortType: 'basic',
        minWidth: 200,
        width: 300,
        maxWidth: 600,
      },
      {
        Header: t('features.adminForm.feedback.reviewTable.ratingHeader'),
        accessor: 'rating',
        sortType: 'number',
        minWidth: 90,
        width: 90,
        disableResizing: true,
      },
    ],
    [t],
  )
}
