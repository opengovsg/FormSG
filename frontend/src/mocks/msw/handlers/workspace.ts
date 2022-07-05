import { rest } from 'msw'

import { UserId } from '~shared/types'
import { WorkspaceDto, WorkspaceId } from '~shared/types/workspace'

import { DefaultRequestReturn, WithDelayProps } from './types'

const MOCK_WORKSPACES = [
  {
    _id: '' as WorkspaceId,
    title: 'All forms',
    numForms: 531159249035,
    admin: '' as UserId,
    formIds: [],
  },
  {
    _id: '2' as WorkspaceId,
    title: 'Product feedback',
    numForms: 35002,
    admin: '' as UserId,
    formIds: [],
  },
  {
    _id: '3' as WorkspaceId,
    title: 'Public sentiment',
    numForms: 12,
    admin: '' as UserId,
    formIds: [],
  },
  {
    _id: '4' as WorkspaceId,
    title: 'Very long number of forms',
    numForms: 531159214021,
    admin: '' as UserId,
    formIds: [],
  },
]

export const getWorkspaces = ({
  delay,
  mockWorkspaces = MOCK_WORKSPACES,
}: {
  mockWorkspaces?: WorkspaceDto[]
} & WithDelayProps = {}): DefaultRequestReturn => {
  return rest.get<never, never, WorkspaceDto[]>(
    '/api/v3/admin/workspaces',
    (_req, res, ctx) => {
      return res(ctx.delay(delay), ctx.status(200), ctx.json(mockWorkspaces))
    },
  )
}

export const workspaceHandlers = (
  props: WithDelayProps = {},
): DefaultRequestReturn[] => [getWorkspaces(props)]
