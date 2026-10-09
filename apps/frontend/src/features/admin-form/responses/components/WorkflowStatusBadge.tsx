import { useTranslation } from 'react-i18next'
import { BadgeProps } from '@chakra-ui/react'

import Badge from '~components/Badge'

import { MRF_STATUS } from '../common/utils/mrfSubmissionView'

const BADGE_STYLES = {
  [MRF_STATUS.PENDING]: {
    textColor: 'warning.700',
    backgroundColor: 'warning.100',
    i18nKey: 'features.common.pending',
  },
  [MRF_STATUS.COMPLETED]: {
    textColor: 'success.700',
    backgroundColor: 'success.100',
    i18nKey: 'features.common.completed',
  },
  [MRF_STATUS.APPROVED]: {
    textColor: 'success.700',
    backgroundColor: 'success.100',
    i18nKey: 'features.common.approved',
  },
  [MRF_STATUS.REJECTED]: {
    textColor: 'danger.700',
    backgroundColor: 'danger.100',
    i18nKey: 'features.common.notApproved',
  },
  [MRF_STATUS.STOPPED]: {
    textColor: 'danger.700',
    backgroundColor: 'danger.100',
    i18nKey: 'features.common.stopped',
  },
} as const satisfies Record<
  MRF_STATUS,
  {
    textColor: BadgeProps['textColor']
    backgroundColor: BadgeProps['backgroundColor']
    i18nKey: string
  }
>

export const WorkflowStatusBadge = ({
  status,
}: {
  status: MRF_STATUS
}): JSX.Element => {
  const { t } = useTranslation()
  const { textColor, backgroundColor, i18nKey } = BADGE_STYLES[status]
  return (
    <Badge
      width="fit-content"
      display="flex"
      textColor={textColor}
      textStyle="caption-1"
      backgroundColor={backgroundColor}
    >
      {t(i18nKey)}
    </Badge>
  )
}
