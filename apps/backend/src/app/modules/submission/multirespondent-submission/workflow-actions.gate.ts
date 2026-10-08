import { GrowthBook } from '@growthbook/growthbook'
import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types'
import { isWorkflowActionsEligible } from 'formsg-shared/utils/workflow-actions'
import { errAsync, okAsync } from 'neverthrow'

import * as AuthService from '../../auth/auth.service'
import { PermissionLevel } from '../../form/admin-form/admin-form.types'
import { FormInvalidResponseModeError } from '../../form/form.errors'
import * as UserService from '../../user/user.service'
import { MrfWorkflowActionsUnavailableError } from '../submission.errors'

import { getMultirespondentSubmission } from './multirespondent-submission.service'

export const checkWorkflowActionAllowed = ({
  userId,
  formId,
  submissionId,
  growthbook,
}: {
  userId: string
  formId: string
  submissionId: string
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
    .andThen(({ form, user }) =>
      getMultirespondentSubmission(submissionId).andThen((submission) =>
        isWorkflowActionsEligible(submission.created)
          ? okAsync({ form, user })
          : errAsync(new MrfWorkflowActionsUnavailableError()),
      ),
    )
