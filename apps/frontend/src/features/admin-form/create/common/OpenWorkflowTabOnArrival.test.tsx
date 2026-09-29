import { MemoryRouter } from 'react-router-dom'
import { act, render } from '@testing-library/react'

import { useAdminWorkflowStore } from '../workflow/adminWorkflowStore'
import { AdminEditWorkflowState } from '../workflow/types'

import {
  getOpenWorkflowTabState,
  OpenWorkflowTabOnArrival,
} from './OpenWorkflowTabOnArrival'

const handleWorkflowClick = vi.fn()
vi.mock('./CreatePageSidebarContext', () => ({
  useCreatePageSidebar: () => ({ handleWorkflowClick }),
}))

const arriveWith = (state: unknown) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/12345', state }]}>
      <OpenWorkflowTabOnArrival />
    </MemoryRouter>,
  )

describe('OpenWorkflowTabOnArrival', () => {
  afterEach(() => {
    handleWorkflowClick.mockClear()
    act(() => useAdminWorkflowStore.getState().reset())
  })

  it('opens the Workflow tab with a step in edit mode', () => {
    arriveWith(getOpenWorkflowTabState(2))

    expect(handleWorkflowClick).toHaveBeenCalledWith(false)
    expect(useAdminWorkflowStore.getState().createOrEditData).toEqual({
      state: AdminEditWorkflowState.EditingStep,
      stepNumber: 2,
    })
  })

  it('opens the Workflow tab without editing when no step is given', () => {
    arriveWith(getOpenWorkflowTabState())

    expect(handleWorkflowClick).toHaveBeenCalledWith(false)
    expect(useAdminWorkflowStore.getState().createOrEditData).toBeNull()
  })

  it('does nothing without the arrival state', () => {
    arriveWith(null)

    expect(handleWorkflowClick).not.toHaveBeenCalled()
  })
})
