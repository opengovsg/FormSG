import { useTranslation } from 'react-i18next'
import { BiLockAlt, BiMailSend, BiRightArrowAlt } from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import {
  Accordion,
  Box,
  Flex,
  Icon,
  Image,
  ListItem,
  OrderedList,
  SimpleGrid,
  Stack,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VisuallyHidden,
  Wrap,
} from '@chakra-ui/react'
import dedent from 'dedent'

import { AppFooter } from '~/app/AppFooter'
import { AppPublicHeader } from '~/app/AppPublicHeader'
import FormBrandLogo from '~/assets/svgs/brand/brand-mark-colour.svg'

import { BxlGithub } from '~assets/icons/BxlGithub'
import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import {
  CONTACT_US,
  FORM_GUIDE,
  GUIDE_ATTACHMENT_SIZE_LIMIT,
  GUIDE_DATA_CLASSIFICATION,
  GUIDE_E2EE,
  GUIDE_SECRET_KEY_LOSS,
  GUIDE_TRANSFER_OWNERSHIP,
  LANDING_PAGE_EXAMPLE_FORMS,
  OGP_ALL_PRODUCTS,
  OGP_FORMSG_REPO,
} from '~constants/links'
import { LOGIN_ROUTE } from '~constants/routes'
import { useIsMobile } from '~hooks/useIsMobile'
import { useMdComponents } from '~hooks/useMdComponents'
import Button from '~components/Button'
import { MarkdownText } from '~components/MarkdownText'
import { Tab } from '~components/Tabs'
import { LottieAnimation } from '~templates/LottieAnimation'

import { ExternalFormLink } from '../components/ExternalFormLink'
import { FeatureGridItem } from '../components/FeatureGridItem'
import { FeatureLink } from '../components/FeatureLink'
import { FeatureSection } from '../components/FeatureSection'
import { HelpAccordionItem } from '../components/HelpAccordionItem'
import { LandingSection } from '../components/LandingSection'
import { OrderedListIcon } from '../components/OrderedListIcon'
import { SectionBodyText } from '../components/SectionBodyText'
import { SectionTitleText } from '../components/SectionTitleText'
import { StatsItem } from '../components/StatsItem'

import formsHeroAnimation from './assets/images/animation-hero.json'
import howFormsWorksAnimation from './assets/images/animation-mode.json'
import enterEmailAnimation from './assets/images/animation-typing.json'
import helpCenterImg from './assets/images/help_center.svg'
import featureDndImg from './assets/images/icon_dnd.svg'
import featureEmailImg from './assets/images/icon_email.svg'
import featureIntegrationsImg from './assets/images/icon_integrations.svg'
import featureLogicImg from './assets/images/icon_logic.svg'
import featurePrefillImg from './assets/images/icon_prefill.svg'
import featureWebhooksImg from './assets/images/icon_webhooks.svg'
import meetingCollaborationImg from './assets/images/meeting_collaboration.svg'
import ogpSuiteImg from './assets/images/ogp_suite.svg'
import openSourceImg from './assets/images/open_source.svg'
import restrictedIcaLogo from './assets/images/restricted__ica.png'
import restrictedMfaLogo from './assets/images/restricted__mfa.png'
import restrictedMoeLogo from './assets/images/restricted__moe.png'
import restrictedMohLogo from './assets/images/restricted__moh.png'
import restrictedMomLogo from './assets/images/restricted__mom.png'
import restrictedMsfLogo from './assets/images/restricted__msf.png'
import restrictedNparksLogo from './assets/images/restricted__nparks.png'
import restrictedPaLogo from './assets/images/restricted__pa.png'
import storageModeImg from './assets/images/storage_mode.svg'
import { useLanding } from './queries'

export const LandingPage = (): JSX.Element => {
  const { data } = useLanding()
  const isMobile = useIsMobile()
  const mdComponents = useMdComponents({
    styles: {
      text: { whiteSpace: 'initial' },
      listItem: { marginBottom: '1rem' },
    },
  })
  const { t } = useTranslation()

  return (
    <>
      {/* <FeatureBanner
        title="Introducing Payments"
        body="Respondents can now pay for fees and services directly on your form!"
        learnMoreLink={LANDING_PAYMENTS_ROUTE}
      /> */}
      <AppPublicHeader />
      <LandingSection bg="primary.100" pt={{ base: '2rem', md: 0 }} px="0">
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          align="center"
          spacing={{ base: '1.5rem', md: '3.125rem', lg: '7.5rem' }}
          pl={{ base: '1.5rem', md: '5.5rem', lg: '9.25rem' }}
        >
          <Flex
            flexDir="column"
            flex={1}
            pr={{ base: '1.5rem', md: '5.5rem', lg: '0' }}
          >
            <Text
              as="h1"
              textStyle={{ base: 'display-1-mobile', md: 'display-1' }}
              color="secondary.700"
            >
              {t('features.landingPage.hero.title')}
            </Text>
            <SectionBodyText mt="1rem">
              {t('features.landingPage.hero.subtitle')}
            </SectionBodyText>
            <Box mt="2.5rem">
              <Button
                isFullWidth={isMobile}
                as={ReactLink}
                to={LOGIN_ROUTE}
                rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              >
                {t('features.landingPage.hero.ctaButtonLabel')}
              </Button>
            </Box>
          </Flex>
          <Flex flex={1} aria-hidden justify="right">
            <LottieAnimation animationData={formsHeroAnimation} />
          </Flex>
        </Stack>
      </LandingSection>
      <LandingSection>
        <SectionTitleText maxW="37.5rem">
          {t('features.landingPage.featureSection.title')}
        </SectionTitleText>
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 3 }}
          spacingX="2.5rem"
          spacingY="4rem"
          mt="4rem"
        >
          <FeatureGridItem
            image={featureDndImg}
            title={t(
              'features.landingPage.featureSection.features.dragDropBuilder.title',
            )}
            description={t(
              'features.landingPage.featureSection.features.dragDropBuilder.description',
            )}
          />
          <FeatureGridItem
            image={featureIntegrationsImg}
            title={t(
              'features.landingPage.featureSection.features.singpassAndMyinfo.title',
            )}
            description={t(
              'features.landingPage.featureSection.features.singpassAndMyinfo.description',
            )}
          />
          <FeatureGridItem
            image={featureLogicImg}
            title={t(
              'features.landingPage.featureSection.features.conditionalLogic.title',
            )}
            description={t(
              'features.landingPage.featureSection.features.conditionalLogic.description',
            )}
          />
          <FeatureGridItem
            image={featureEmailImg}
            title={t(
              'features.landingPage.featureSection.features.emailConfirmation.title',
            )}
            description={t(
              'features.landingPage.featureSection.features.emailConfirmation.description',
            )}
          />
          <FeatureGridItem
            image={featurePrefillImg}
            title={t(
              'features.landingPage.featureSection.features.prefill.title',
            )}
            description={t(
              'features.landingPage.featureSection.features.prefill.description',
            )}
          />
          <FeatureGridItem
            image={featureWebhooksImg}
            title={t(
              'features.landingPage.featureSection.features.webhooks.title',
            )}
            description={t(
              'features.landingPage.featureSection.features.webhooks.description',
            )}
          />
        </SimpleGrid>
      </LandingSection>
      <LandingSection bg="primary.100">
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          align="center"
          spacing={{ base: '1.5rem', md: '3.125rem', lg: '7.5rem' }}
        >
          <Flex flexDir="column" flex={1}>
            <SectionTitleText>
              {t('features.landingPage.getStartedSection.title')}
            </SectionTitleText>
            <SectionBodyText mt="1rem">
              {t('features.landingPage.getStartedSection.subtitle')}
            </SectionBodyText>
            <Box mt="2.5rem">
              <Button as={ReactLink} to={LOGIN_ROUTE}>
                {t('features.landingPage.getStartedSection.ctaButtonLabel')}
              </Button>
            </Box>
          </Flex>
          <Box flex={1} aria-hidden>
            <LottieAnimation
              animationData={enterEmailAnimation}
              preserveAspectRatio="xMidYMax slice"
            />
          </Box>
        </Stack>
      </LandingSection>
      <LandingSection>
        <SectionTitleText>
          {t('features.landingPage.usedByAgenciesSection.title')}
        </SectionTitleText>
        <Wrap shouldWrapChildren spacingX="3rem" mt="2.5rem" spacingY="2.5rem">
          <StatsItem
            stat={data?.formCount}
            description={t(
              'features.landingPage.usedByAgenciesSection.formsLaunched',
            )}
          />
          <StatsItem
            stat={data?.submissionCount}
            description={t(
              'features.landingPage.usedByAgenciesSection.submissionsReceived',
            )}
          />
          <StatsItem
            stat={data?.userCount}
            description={t(
              'features.landingPage.usedByAgenciesSection.publicOfficersOnboard',
            )}
          />
          <StatsItem
            stat={data?.agencyCount}
            description={t(
              'features.landingPage.usedByAgenciesSection.governmentAgencies',
            )}
          />
        </Wrap>
        <VisuallyHidden>
          {t('features.landingPage.usedByAgenciesSection.exampleUserTitle')}
        </VisuallyHidden>
        <Wrap
          shouldWrapChildren
          mt="4rem"
          spacing={{ base: '2.5rem', md: '4.5rem' }}
        >
          <Image
            alt="Immigration and Checkpoints Authority"
            src={restrictedIcaLogo}
          />
          <Image alt="Ministry of Education" src={restrictedMoeLogo} />
          <Image alt="Ministry of Manpower" src={restrictedMomLogo} />
          <Image alt="National Parks Board" src={restrictedNparksLogo} />
          <Image alt="Ministry of Health" src={restrictedMohLogo} />
          <Image alt="People's Association" src={restrictedPaLogo} />
          <Image alt="Ministry of Foreign Affairs" src={restrictedMfaLogo} />
          <Image
            alt="Ministry of Social and Family Development"
            src={restrictedMsfLogo}
          />
        </Wrap>
      </LandingSection>
      <LandingSection bg="primary.100" align="center">
        <SectionTitleText>
          {t('features.landingPage.useCaseSection.title')}
        </SectionTitleText>
        <SectionBodyText textAlign={{ lg: 'center' }} mt="1rem">
          {t('features.landingPage.useCaseSection.subtitle')}
        </SectionBodyText>
        <SimpleGrid
          w="full"
          columns={{ base: 1, lg: 3 }}
          spacingX="5rem"
          spacingY="1rem"
          mt="2.5rem"
        >
          {LANDING_PAGE_EXAMPLE_FORMS.map((example, index) => (
            <ExternalFormLink key={index} {...example} />
          ))}
        </SimpleGrid>
        <Image src={meetingCollaborationImg} aria-hidden mt="5rem" />
      </LandingSection>
      <FeatureSection
        direction={{ base: 'column', lg: 'row' }}
        title={t('features.landingPage.storageModeSection.title')}
        imgSrc={storageModeImg}
      >
        <SectionBodyText mt="1rem">
          {t('features.landingPage.storageModeSection.subtitle')}
        </SectionBodyText>
        <SimpleGrid
          columns={2}
          mt="2.5rem"
          w="fit-content"
          spacingX="1.5rem"
          spacingY="0.75rem"
          color="secondary.500"
        >
          <Flex align="center">
            <Text textStyle="subhead-3">
              {t(
                'features.landingPage.storageModeSection.modes.security.title',
              )}
            </Text>
          </Flex>
          <SectionBodyText mt={0}>
            {t(
              'features.landingPage.storageModeSection.modes.security.description',
            )}
          </SectionBodyText>
          <Flex align="center">
            <Text textStyle="subhead-3">
              {t(
                'features.landingPage.storageModeSection.modes.sensitivity.title',
              )}
            </Text>
          </Flex>
          <SectionBodyText mt={0}>
            {t(
              'features.landingPage.storageModeSection.modes.sensitivity.description',
            )}
          </SectionBodyText>
        </SimpleGrid>
        <FeatureLink
          href={GUIDE_DATA_CLASSIFICATION}
          externalLinkIcon={
            <Icon as={BiRightArrowAlt} ml="0.5rem" fontSize="1.5rem" />
          }
        >
          {t('features.landingPage.storageModeSection.guideCtaLabel')}
        </FeatureLink>
      </FeatureSection>
      <FeatureSection
        title={t('features.landingPage.opensourceSection.title')}
        imgSrc={openSourceImg}
        direction={{ base: 'column', lg: 'row-reverse' }}
      >
        <SectionBodyText mt="1rem">
          {t('features.landingPage.opensourceSection.subtitle')}
        </SectionBodyText>
        <FeatureLink
          href={OGP_FORMSG_REPO}
          externalLinkIcon={<BxlGithub ml="0.5rem" fontSize="1.5rem" />}
        >
          {t('features.landingPage.opensourceSection.forkItCtaLabel')}
        </FeatureLink>
      </FeatureSection>
      <FeatureSection
        title={t('features.landingPage.helpCenterSection.title')}
        imgSrc={helpCenterImg}
        direction={{ base: 'column', lg: 'row' }}
      >
        <Box>
          <SectionBodyText mt="1rem">
            {t('features.landingPage.helpCenterSection.subtitle')}
          </SectionBodyText>
          <Accordion
            variant="medium"
            mt="1rem"
            color="secondary.500"
            allowToggle
            whiteSpace="pre-wrap"
          >
            <HelpAccordionItem
              title={t(
                'features.landingPage.helpCenterSection.qnaAccordionItem.loseSecretKey.question',
              )}
            >
              <MarkdownText components={mdComponents}>
                {dedent(
                  t(
                    'features.landingPage.helpCenterSection.qnaAccordionItem.loseSecretKey.answer',
                    {
                      CONTACT_US,
                    },
                  ),
                )}
              </MarkdownText>
              <FeatureLink mt="1rem" href={GUIDE_SECRET_KEY_LOSS}>
                {t(
                  'features.landingPage.helpCenterSection.common.sourceLinkLabel',
                )}
              </FeatureLink>
            </HelpAccordionItem>
            <HelpAccordionItem
              title={t(
                'features.landingPage.helpCenterSection.qnaAccordionItem.increaseAttachmentSizeLimit.question',
              )}
            >
              <MarkdownText components={mdComponents}>
                {dedent(
                  t(
                    'features.landingPage.helpCenterSection.qnaAccordionItem.increaseAttachmentSizeLimit.answer',
                  ),
                )}
              </MarkdownText>
              <FeatureLink mt="1rem" href={GUIDE_ATTACHMENT_SIZE_LIMIT}>
                {t(
                  'features.landingPage.helpCenterSection.common.sourceLinkLabel',
                )}
              </FeatureLink>
            </HelpAccordionItem>
            <HelpAccordionItem
              title={t(
                'features.landingPage.helpCenterSection.qnaAccordionItem.howDoesE2eWork.question',
              )}
            >
              <MarkdownText components={mdComponents}>
                {dedent(
                  t(
                    'features.landingPage.helpCenterSection.qnaAccordionItem.howDoesE2eWork.answer',
                  ),
                )}
              </MarkdownText>
              <FeatureLink mt="1rem" href={GUIDE_E2EE}>
                {t(
                  'features.landingPage.helpCenterSection.common.sourceLinkLabel',
                )}
              </FeatureLink>
            </HelpAccordionItem>
            <HelpAccordionItem
              title={t(
                'features.landingPage.helpCenterSection.qnaAccordionItem.howToTransferOwnership.question',
              )}
            >
              <MarkdownText components={mdComponents}>
                {dedent(
                  t(
                    'features.landingPage.helpCenterSection.qnaAccordionItem.howToTransferOwnership.answer',
                  ),
                )}
              </MarkdownText>
              <FeatureLink mt="1rem" href={GUIDE_TRANSFER_OWNERSHIP}>
                {t(
                  'features.landingPage.helpCenterSection.common.sourceLinkLabel',
                )}
              </FeatureLink>
            </HelpAccordionItem>
          </Accordion>
        </Box>
        <FeatureLink
          href={FORM_GUIDE}
          externalLinkIcon={
            <Icon as={BxsHelpCircle} ml="0.5rem" fontSize="1.5rem" />
          }
        >
          {t('features.landingPage.helpCenterSection.visitHelpCenterCtaLabel')}
        </FeatureLink>
      </FeatureSection>
      <FeatureSection
        align="start"
        direction={{ base: 'column', lg: 'row' }}
        bg="primary.100"
        title={t('features.landingPage.howItWorksSection.title')}
        animationSrc={howFormsWorksAnimation}
      >
        <Tabs mt="2.5rem">
          <TabList>
            <Tab>
              {t('features.landingPage.howItWorksSection.modes.storage.tab')}
            </Tab>
            <Tab>
              {t('features.landingPage.howItWorksSection.modes.mrf.tab')}
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <SectionBodyText mt="1.5rem">
                {t(
                  'features.landingPage.howItWorksSection.modes.storage.description',
                )}
              </SectionBodyText>
              <OrderedList
                spacing="1rem"
                mt="2.5rem"
                listStyleType="none"
                ml="2.5rem"
                color="secondary.500"
              >
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={1} />
                  {t(
                    'features.landingPage.howItWorksSection.modes.storage.steps.one',
                  )}
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={2} />
                  {t(
                    'features.landingPage.howItWorksSection.modes.storage.steps.two',
                  )}
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={3} />
                  {t(
                    'features.landingPage.howItWorksSection.modes.storage.steps.three',
                  )}
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={4} />
                  {t(
                    'features.landingPage.howItWorksSection.modes.storage.steps.four',
                  )}
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={5} />
                  {t(
                    'features.landingPage.howItWorksSection.modes.storage.steps.five',
                  )}
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={6} />
                  {t(
                    'features.landingPage.howItWorksSection.modes.storage.steps.six',
                  )}
                </ListItem>
              </OrderedList>
            </TabPanel>
            <TabPanel>
              <SectionBodyText mt="1.5rem">
                {t(
                  'features.landingPage.howItWorksSection.modes.mrf.description',
                )}
              </SectionBodyText>
              <OrderedList
                spacing="1rem"
                mt="2.5rem"
                listStyleType="none"
                ml="2.5rem"
                color="secondary.500"
              >
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={1} />
                  {t(
                    'features.landingPage.howItWorksSection.modes.mrf.steps.one',
                  )}
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={2} />
                  {t(
                    'features.landingPage.howItWorksSection.modes.mrf.steps.two',
                  )}
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={3} />
                  {t(
                    'features.landingPage.howItWorksSection.modes.mrf.steps.three',
                  )}
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={4} />
                  {t(
                    'features.landingPage.howItWorksSection.modes.mrf.steps.four',
                  )}
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={5} />
                  {t(
                    'features.landingPage.howItWorksSection.modes.mrf.steps.five',
                  )}
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={6} />
                  {t(
                    'features.landingPage.howItWorksSection.modes.mrf.steps.six',
                  )}
                </ListItem>
              </OrderedList>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </FeatureSection>
      <FeatureSection
        title={t('features.landingPage.ogpProductSuiteSection.title')}
        imgSrc={ogpSuiteImg}
        direction={{ base: 'column', lg: 'row' }}
      >
        <SectionBodyText mt="1rem">
          {t('features.landingPage.ogpProductSuiteSection.subtitle')}
        </SectionBodyText>
        <FeatureLink
          href={OGP_ALL_PRODUCTS}
          externalLinkIcon={
            <Icon as={BiRightArrowAlt} ml="0.5rem" fontSize="1.5rem" />
          }
        >
          {t('features.landingPage.ogpProductSuiteSection.ctaLinkLabel')}
        </FeatureLink>
      </FeatureSection>
      <LandingSection bg="secondary.700" align="center">
        <Image src={FormBrandLogo} aria-hidden h="3.5rem" />
        <Text
          textAlign="center"
          textStyle={{ base: 'display-2-mobile', md: 'display-2' }}
          color="white"
          mt="2rem"
        >
          {t('features.landingPage.ctaSection.title')}
        </Text>
        <Box mt="2rem">
          <Button as={ReactLink} to={LOGIN_ROUTE}>
            {t('features.landingPage.ctaSection.ctaButtonLabel')}
          </Button>
        </Box>
      </LandingSection>
      <AppFooter />
    </>
  )
}
