import { delay as MswDelay, http, HttpResponse } from 'msw'

import { UserId } from '~shared/types'
import { WorkspaceDto, WorkspaceId } from '~shared/types/workspace'

import { WithDelayProps } from './types'

const MOCK_WORKSPACES = [
  {
    _id: '' as WorkspaceId,
    title: 'All forms',
    admin: '' as UserId,
    formIds: Array(531925).fill(''),
  },
  {
    _id: '2' as WorkspaceId,
    title: 'Product feedback',
    admin: '' as UserId,
    formIds: Array(35002).fill(''),
  },
  {
    _id: '3' as WorkspaceId,
    title: 'Public sentiment',
    admin: '' as UserId,
    formIds: Array(12).fill(''),
  },
  {
    _id: '4' as WorkspaceId,
    title: 'Very long number of forms',
    admin: '' as UserId,
    formIds: Array(592421).fill(''),
  },
]

export const getWorkspaces = ({
  delay,
  mockWorkspaces = MOCK_WORKSPACES,
}: {
  mockWorkspaces?: WorkspaceDto[]
} & WithDelayProps = {}) => {
  return http.get<never, never, WorkspaceDto[]>(
    '/api/v3/admin/workspaces',
    async () => {
      await MswDelay(delay)
      return HttpResponse.json(mockWorkspaces, { status: 200 })
    },
  )
}

export const workspaceHandlers = (props: WithDelayProps = {}) => [
  getWorkspaces(props),
]
