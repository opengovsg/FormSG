import { useState } from 'react'
import { Icon, Skeleton } from '@chakra-ui/react'

import { BxsInfoCircle } from '~assets/icons'
import Toggle from '~components/Toggle'
import Tooltip from '~components/Tooltip'

export const FormNricMaskingToggle = (): JSX.Element => {
  const [isNricMaskingChecked, setIsNricMaskingChecked] = useState(false)

  const handleToggleNricMasking = () => {
    setIsNricMaskingChecked(!isNricMaskingChecked)
  }

  return (
    <Skeleton isLoaded={true}>
      <Toggle
        isLoading={false}
        isChecked={isNricMaskingChecked}
        label="Enable NRIC masking"
        labelComponentRight={
          <Tooltip
            placement="top"
            label="Enabling this will apply NRIC masking to the entire form and all collected data"
          >
            <Icon as={BxsInfoCircle} marginLeft="0.5rem" />
          </Tooltip>
        }
        description="NRIC numbers are masked by default; only the last 4 characters will be displayed and collected (e.g. S7914578N appears as *****578N)"
        onChange={handleToggleNricMasking}
      />
    </Skeleton>
  )
}
