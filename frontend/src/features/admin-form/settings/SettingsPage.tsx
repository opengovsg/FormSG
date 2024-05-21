import { useEffect, useMemo, useState } from 'react'
import { BiCodeBlock, BiCog, BiDollar, BiKey, BiMessage } from 'react-icons/bi'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Flex,
  Spacer,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react'

import { LanguageTranslation } from '~assets/icons/LanguageTranslation'
import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'
import { useDraggable } from '~hooks/useDraggable'

import { useAdminFormCollaborators } from '../common/queries'

import { MultiLanguageSection } from './components/MultiLanguageSection/MultiLangugageSection'
import { TranslationListSection } from './components/MultiLanguageSection/TranslationListSection'
import { TranslationSection } from './components/MultiLanguageSection/TranslationSection'
import { SettingsTab } from './components/SettingsTab'
import { SettingsAuthPage } from './SettingsAuthPage'
import { SettingsGeneralPage } from './SettingsGeneralPage'
import { SettingsPaymentsPage } from './SettingsPaymentsPage'
import { SettingsTwilioPage } from './SettingsTwilioPage'
import { SettingsWebhooksPage } from './SettingsWebhooksPage'

const settingsTabsOrder = [
  'general',
  'singpass',
  'twilio',
  'webhooks',
  'payments',
  'multi-language',
]

export const SettingsPage = (): JSX.Element => {
  const { formId, settingsTab, language } = useParams()
  const { state } = useLocation()

  const translationParams = state as {
    isTranslation: boolean
    formFieldNum: number
    isStartPage: boolean
    isEndPage: boolean
  }

  if (!formId) throw new Error('No formId provided')

  const { hasEditAccess, isLoading: isCollabLoading } =
    useAdminFormCollaborators(formId)
  const navigate = useNavigate()

  // Redirect view-only collaborators to results screen.
  useEffect(() => {
    if (!isCollabLoading && !hasEditAccess)
      navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}`)
  }, [formId, hasEditAccess, isCollabLoading, navigate])

  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()

  const [tabIndex, setTabIndex] = useState(
    settingsTabsOrder.indexOf(settingsTab ?? ''),
  )

  const startPageTranslations = useMemo(() => {
    return translationParams?.isStartPage
  }, [translationParams?.isStartPage])

  const endPageTranslations = useMemo(() => {
    return translationParams?.isEndPage
  }, [translationParams?.isEndPage])

  const currentIsTranslation = useMemo(() => {
    return translationParams?.isTranslation
  }, [translationParams?.isTranslation])

  const formFieldNumToBeTranslated = useMemo(() => {
    return (state as { isTranslation?: boolean; formFieldNum: number })
      ?.formFieldNum
  }, [state])

  const handleTabChange = (index: number) => {
    setTabIndex(index)
    navigate(
      `${ADMINFORM_ROUTE}/${formId}/settings/${settingsTabsOrder[index]}`,
    )
  }

  return (
    <Box overflow="auto" flex={1}>
      <Tabs
        isLazy
        isManual
        orientation="vertical"
        variant="line"
        py={{ base: '2.5rem', lg: '3.125rem' }}
        px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
        index={tabIndex === -1 ? 0 : tabIndex}
        onChange={handleTabChange}
      >
        <Flex
          h="max-content"
          flex={1}
          flexShrink={0}
          ref={ref}
          onMouseDown={onMouseDown}
          position="sticky"
          zIndex={0}
          top={{ base: '2.5rem', lg: '3.125rem' }}
          borderTopColor="neutral.300"
          w={{ base: 'auto', lg: '21rem' }}
          __css={{
            scrollbarWidth: 0,
            /* Scrollbar for Chrome, Safari, Opera and Microsoft Edge */
            '&::-webkit-scrollbar': {
              width: 0,
              height: 0,
            },
          }}
        >
          <TabList
            overflowX="initial"
            display="inline-flex"
            w="max-content"
            mr={{ base: '1.5rem', md: '4rem', lg: '2rem' }}
            mb="calc(0.5rem - 2px)"
          >
            <SettingsTab label="General" icon={BiCog} />
            <SettingsTab label="Singpass" icon={BiKey} />
            <SettingsTab label="Twilio credentials" icon={BiMessage} />
            <SettingsTab label="Webhooks" icon={BiCodeBlock} />
            <SettingsTab label="Payments" icon={BiDollar} />
            <SettingsTab label="Multi-language" icon={LanguageTranslation} />
          </TabList>
        </Flex>
        <TabPanels
          maxW="42.5rem"
          // Offset start of tabpanel text from tablist.
          mt={{ md: '1rem' }}
        >
          <TabPanel>
            <SettingsGeneralPage />
          </TabPanel>
          <TabPanel>
            <SettingsAuthPage />
          </TabPanel>
          <TabPanel>
            <SettingsTwilioPage />
          </TabPanel>
          <TabPanel>
            <SettingsWebhooksPage />
          </TabPanel>
          <TabPanel>
            <SettingsPaymentsPage />
          </TabPanel>
          <TabPanel>
            {!language && !currentIsTranslation && <MultiLanguageSection />}
            {language && !currentIsTranslation && (
              <TranslationListSection language={language} />
            )}
            {language && currentIsTranslation && (
              <TranslationSection
                language={language}
                formFieldNumToBeTranslated={formFieldNumToBeTranslated}
                isFormField={formFieldNumToBeTranslated !== -1}
                isStartPageTranslations={startPageTranslations}
                isEndPageTranslations={endPageTranslations}
              />
            )}
          </TabPanel>
        </TabPanels>
        <Spacer />
      </Tabs>
    </Box>
  )
}
