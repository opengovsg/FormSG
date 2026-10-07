import { screen } from '@testing-library/react'

import { WorkflowStatus } from 'formsg-shared/types'

import { render } from '~/test-utils'

import { TimelineRunSteps } from '../TimelineRunSteps'

describe('TimelineRunSteps', () => {
  it('shows the step a workflow was stopped at as Stopped', () => {
    render(
      <>
        {TimelineRunSteps({
          steps: [
            {
              name: 'Applicant',
              stepNumber: 1,
              timestamp: '2026-10-07T07:00:00.000Z',
              workflowStatus: WorkflowStatus.COMPLETED,
            },
            {
              name: 'Approver',
              stepNumber: 2,
              workflowStatus: WorkflowStatus.PENDING,
              stoppedAt: '2026-10-07T08:00:00.000Z',
            },
          ],
        })}
      </>,
    )

    expect(screen.getByText('Stopped')).toBeInTheDocument()
    expect(screen.queryByText('Pending')).not.toBeInTheDocument()
  })
})
