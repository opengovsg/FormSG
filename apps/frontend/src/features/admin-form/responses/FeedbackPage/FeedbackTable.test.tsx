import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { FeedbackTable } from './FeedbackTable'

const columns = [{ Header: 'Timestamp', accessor: 'timestamp' }]

describe('FeedbackTable', () => {
  it('handles missing data across renders and then displays loaded rows', () => {
    const { rerender } = render(
      <FeedbackTable
        feedbackData={undefined}
        feedbackColumns={columns}
        currentPage={0}
      />,
    )
    rerender(
      <FeedbackTable
        feedbackData={undefined}
        feedbackColumns={columns}
        currentPage={0}
      />,
    )
    rerender(
      <FeedbackTable
        feedbackData={[
          {
            timestamp: 12345,
            index: 1,
            rating: 5,
            comment: 'Test review',
            date: '30 Sep 2026',
            dateShort: '30 Sep',
          },
        ]}
        feedbackColumns={columns}
        currentPage={0}
      />,
    )
    expect(screen.getByText('12345')).toBeInTheDocument()
  })
})
