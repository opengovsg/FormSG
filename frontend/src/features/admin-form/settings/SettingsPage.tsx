import { TabPanel, TabPanels, Tabs } from '@chakra-ui/react'

import { SettingsGeneralSidebar } from './components/SettingsGeneralSidebar'
import { SettingsGeneralPage } from './SettingsGeneralPage'

export interface SettingsPageProps {
  /**
   * Exposed for testing.
   * Default tab index to render.
   */
  _defaultIndex?: number
}

export const SettingsPage = ({
  _defaultIndex,
}: SettingsPageProps): JSX.Element => {
  return (
    <Tabs
      isLazy
      isManual
      orientation="vertical"
      variant="line"
      defaultIndex={_defaultIndex}
    >
      <SettingsGeneralSidebar />
      <TabPanels>
        <TabPanel>
          <SettingsGeneralPage />
        </TabPanel>
        <TabPanel>
          <p>two!</p>
        </TabPanel>
        <TabPanel>
          <p>3!</p>
        </TabPanel>
        <TabPanel>
          <p>4!</p>
        </TabPanel>
        <TabPanel>
          <p>5!</p>
        </TabPanel>
        <TabPanel>
          <p>6!</p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}
