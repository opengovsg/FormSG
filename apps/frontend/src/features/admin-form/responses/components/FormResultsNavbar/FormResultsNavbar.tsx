import { TabList } from '@chakra-ui/react'

import { noPrintCss } from '~utils/noPrintCss'

import {
  AdminFormSideNav,
  AdminFormSideNavTab,
  SideNavCollapseControl,
} from '../../../common/AdminFormSideNav/AdminFormSideNav'

import { ResultsTabEntry } from './useResultsTabs'

export const FormResultsNavbar = ({
  tabs,
  isCollapsed = false,
  isMobile = false,
  onToggle = () => undefined,
}: {
  tabs: ResultsTabEntry[]
  isCollapsed?: boolean
  isMobile?: boolean
  onToggle?: () => void
}): JSX.Element => {
  if (isCollapsed)
    return (
      <SideNavCollapseControl
        isCollapsed
        onClick={onToggle}
        trackingLabel="results.sidebar.toggle_collapse"
      />
    )
  return (
    <AdminFormSideNav
      sx={noPrintCss}
      footer={
        isMobile ? (
          <SideNavCollapseControl
            isCollapsed={false}
            onClick={onToggle}
            trackingLabel="results.sidebar.toggle_collapse"
          />
        ) : undefined
      }
    >
      <TabList border={0} m={0} p={0} overflow="visible" gap="1rem">
        {tabs.map((tab) => (
          <AdminFormSideNavTab
            key={tab.path}
            label={tab.label}
            icon={<tab.icon fontSize="1.5rem" />}
            badgeText={tab.badgeText}
          />
        ))}
      </TabList>
    </AdminFormSideNav>
  )
}
