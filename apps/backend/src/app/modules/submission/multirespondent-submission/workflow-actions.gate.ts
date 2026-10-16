import { GrowthBook } from '@growthbook/growthbook'
import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types'
import { errAsync, okAsync } from 'neverthrow'

import * as AuthService from '../../auth/auth.service'
import { PermissionLevel } from '../../form/admin-form/admin-form.types'
import { FormInvalidResponseModeError } from '../../form/form.errors'
import * as UserService from '../../user/user.service'
import { MrfWorkflowActionsUnavailableError } from '../submission.errors'

export const checkWorkflowActionAllowed = ({
  userId,
  formId,
  growthbook,
}: {
  userId: string
  formId: string
  growthbook?: GrowthBook
}) =>
  UserService.findUserById(userId)
    .andThen((user) =>
      AuthService.getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Write,
      }).map((form) => ({ form, user })),
    )
    .andThen(({ form, user }) => {
      if (form.responseMode !== FormResponseMode.Multirespondent) {
        return errAsync(new FormInvalidResponseModeError())
      }
      if (!growthbook?.isOn(featureFlags.workflowActions)) {
        return errAsync(new MrfWorkflowActionsUnavailableError())
      }
      return okAsync({ form, user })
    })
