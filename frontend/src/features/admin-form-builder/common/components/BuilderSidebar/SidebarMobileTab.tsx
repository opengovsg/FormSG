import { As, Icon } from '@chakra-ui/react'

import { Tab } from '~components/Tabs'
import Tooltip from '~components/Tooltip'

export interface MobileSidebarTabProps {
  label: string
  icon: As
}
export const MobileSidebarTab = ({
  label,
  icon,
}: MobileSidebarTabProps): JSX.Element => {
  return (
    <Tooltip label={label} placement="top">
      <Tab justifyContent="center" p="1rem" w="5.5rem">
        <Icon
          as={icon}
          color="currentcolor"
          fontSize="1.5rem"
          aria-label={label}
        />
      </Tab>
    </Tooltip>
  )
}
