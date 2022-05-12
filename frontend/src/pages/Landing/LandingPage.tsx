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

import { AppFooter } from '~/app/AppFooter'
import { AppPublicHeader } from '~/app/AppPublicHeader'
import FormBrandLogo from '~/assets/svgs/brand/brand-mark-colour.svg'

import { BxlGithub } from '~assets/icons/BxlGithub'
import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { LOGIN_ROUTE } from '~constants/routes'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import GovtMasthead from '~components/GovtMasthead'
import Link from '~components/Link'
import { Tab } from '~components/Tabs'

import helpCenterImg from './assets/images/help_center.svg'
import howFormWorksImg from './assets/images/how_form_works.svg'
import featureA11yImg from './assets/images/icon_a11y.svg'
import featureDndImg from './assets/images/icon_dnd.svg'
import featureEmailImg from './assets/images/icon_email.svg'
import featureIntegrationsImg from './assets/images/icon_integrations.svg'
import featureLogicImg from './assets/images/icon_logic.svg'
import featurePrefillImg from './assets/images/icon_prefill.svg'
import featureSectionsImg from './assets/images/icon_sections.svg'
import featureWebhooksImg from './assets/images/icon_webhooks.svg'
import meetingCollaborationImg from './assets/images/meeting_collaboration.svg'
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
import { FeatureGridItem } from './components/FeatureGridItem'
import { FeatureSection } from './components/FeatureSection'
import { HelpAccordionItem } from './components/HelpAccordionItem'
import { LandingSection } from './components/LandingSection'
import { OrderedListIcon } from './components/OrderedListIcon'
import { SectionBodyText } from './components/SectionBodyText'
import { SectionTitleText } from './components/SectionTitleText'
import { StatsItem } from './components/StatsItem'
import { useLanding } from './queries'

export const LandingPage = (): JSX.Element => {
  const { data } = useLanding()
  const isMobile = useIsMobile()

  return (
    <Flex minH="100vh" flexDir="column" h="100%">
      <GovtMasthead />
      <AppPublicHeader />
      <LandingSection bg="primary.100">
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          align="center"
          spacing={{ base: '1.5rem', md: '3.125rem', lg: '7.5rem' }}
        >
          <Flex flexDir="column" flex={1}>
            <Text
              as="h1"
              textStyle={{ base: 'display-1-mobile', md: 'display-1' }}
              color="secondary.700"
            >
              Build secure government forms in minutes.
            </Text>
            <SectionBodyText>
              A free, easy to use, no-code form builder with advanced features
              for public officers to securely collect classified and sensitive
              data.
            </SectionBodyText>
            <Box mt="2.5rem">
              <Button
                isFullWidth={isMobile}
                as={ReactLink}
                to={LOGIN_ROUTE}
                rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              >
                Start building your form now
              </Button>
            </Box>
          </Flex>
          <Box flex={1} aria-hidden>
            <Image src={howFormWorksImg} />
          </Box>
        </Stack>
      </LandingSection>
      <LandingSection>
        <SectionTitleText maxW="37.5rem">
          Our form building and data collection features
        </SectionTitleText>
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 3 }}
          spacingX="2.5rem"
          spacingY="4rem"
          mt="4rem"
        >
          <FeatureGridItem
            image={featureDndImg}
            title="Drag and drop builder"
            description="Create and publish forms in minutes using our user-friendly drag and drop builder, with more than over 65 field types, including attachments, dates, tables, ratings, and many more."
          />
          <FeatureGridItem
            image={featureA11yImg}
            title="Accessible"
            description="All our forms are fully responsive and aim to meet Web Content Accessibility Guidelines (WCAG 2.1), which makes web content more accessible to people with disabilities."
          />
          <FeatureGridItem
            image={featureLogicImg}
            title="Conditional logic"
            description="Create advanced logic for your forms, and show or hide fields and/or sections based on your user’s input, personalising their experience."
          />
          <FeatureGridItem
            image={featureIntegrationsImg}
            title="Government integrations"
            description="Authenticate your users with Singpass or Corppass. MyInfo fields can also be pre-filled once citizens log in through Singpass."
          />
          <FeatureGridItem
            image={featureWebhooksImg}
            title="Webhooks"
            description="Get every form submission sent straight to a compatible web app or URL as soon as it’s submitted with Webhooks."
          />
          <FeatureGridItem
            image={featureSectionsImg}
            title="Form sections"
            description="Manage long forms by sectioning it so your users enjoy a more seamless experience."
          />
          <FeatureGridItem
            image={featurePrefillImg}
            title="Prefill"
            description="Speed up the form filling process for your users by prefilling fields for them."
          />
          <FeatureGridItem
            image={featureEmailImg}
            title="Email confirmation"
            description="Send confirmation emails to your respondents along with a copy of their response."
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
              No onboarding, no fees, and no code required
            </SectionTitleText>
            <SectionBodyText>
              Sign in with your government email and start building your form
              immediately. It’s free, and no onboarding or approvals are
              required.
            </SectionBodyText>
            <Box mt="2.5rem">
              <Button as={ReactLink} to={LOGIN_ROUTE}>
                Get started
              </Button>
            </Box>
          </Flex>
          <Box flex={1} aria-hidden>
            <Image src={howFormWorksImg} />
          </Box>
        </Stack>
      </LandingSection>
      <LandingSection>
        <SectionTitleText>Used by most government agencies</SectionTitleText>
        <Wrap shouldWrapChildren spacingX="3rem" mt="2.5rem">
          <StatsItem stat={data?.formCount} description="forms deployed" />
          <StatsItem
            stat={data?.submissionCount}
            description="submissions received"
          />
          <StatsItem
            stat={data?.userCount}
            description="public officers onboard"
          />
        </Wrap>
        <VisuallyHidden>Examples of users of FormSG</VisuallyHidden>
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
          Supporting national and emergent use cases
        </SectionTitleText>
        <SectionBodyText>
          An integral part of many agency workflows, Form has been instrumental
          in data collection, especially during the COVID-19 pandemic.
        </SectionBodyText>
        <Image src={meetingCollaborationImg} aria-hidden mt="5rem" />
      </LandingSection>
      <FeatureSection
        direction={{ base: 'column', lg: 'row' }}
        title="Secure collection of responses"
        imgSrc={storageModeImg}
      >
        <SectionBodyText>
          All form responses are either encrypted end-to-end (Storage mode) or
          sent directly to your email inbox (Email mode). This means third
          parties, including Form, will not be able to access or view your form
          data.
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
            <Icon as={BiLockAlt} fontSize="1.5rem" mr="0.5rem" />
            <Text textStyle="subhead-3">Storage mode</Text>
          </Flex>
          <SectionBodyText mt={0}>Sensitive (Normal)</SectionBodyText>
          <Flex align="center">
            <Icon as={BiMailSend} fontSize="1.5rem" mr="0.5rem" />
            <Text textStyle="subhead-3">Email mode</Text>
          </Flex>
          <SectionBodyText mt={0}>Sensitive (High)</SectionBodyText>
        </SimpleGrid>
        <Link
          mt="2.5rem"
          w="fit-content"
          textStyle="subhead-1"
          isExternal
          variant="standalone"
          p={0}
          href="https://go.gov.sg/form-what-is-storage-mode"
          externalLinkIcon={
            <Icon as={BiRightArrowAlt} ml="0.5rem" fontSize="1.5rem" />
          }
        >
          Read more about Storage Mode
        </Link>
      </FeatureSection>
      <FeatureSection
        title="Open sourced"
        imgSrc={openSourceImg}
        direction={{ base: 'column', lg: 'row-reverse' }}
      >
        <SectionBodyText>
          We hope that by open-sourcing Form, others can take advantage of our
          codebase and build on it to create applications and platforms to help
          improve the product, not just in Singapore but other countries as
          well. Furthermore, there are lessons that we have learnt that we feel
          could be of benefit to the wider developer community.
        </SectionBodyText>
        <Link
          mt="2.5rem"
          w="fit-content"
          textStyle="subhead-1"
          isExternal
          variant="standalone"
          p={0}
          href="https://github.com/opengovsg/formsg"
          externalLinkIcon={<BxlGithub ml="0.5rem" fontSize="1.5rem" />}
        >
          Fork it on Github
        </Link>
      </FeatureSection>
      <FeatureSection
        title="Help Center"
        imgSrc={helpCenterImg}
        align="start"
        direction={{ base: 'column', lg: 'row' }}
      >
        <Box>
          <SectionBodyText>
            Have a question? Most answers can be found in our self service Help
            Center. Common questions include:
          </SectionBodyText>
          <Accordion
            variant="medium"
            mt="1rem"
            color="secondary.500"
            allowToggle
          >
            <HelpAccordionItem title="What happens if I lose my Secret Key?">
              Lorem ipsum 1
            </HelpAccordionItem>
            <HelpAccordionItem title="How do I increase attachment size limit?">
              Lorem ipsum 1
            </HelpAccordionItem>
            <HelpAccordionItem title="How does end-to-end encryption work?">
              Lorem ipsum 1
            </HelpAccordionItem>
            <HelpAccordionItem title="How do I transfer ownership of my forms?">
              Lorem ipsum 1
            </HelpAccordionItem>
          </Accordion>
        </Box>
        <Link
          mt="2.5rem"
          w="fit-content"
          textStyle="subhead-1"
          isExternal
          variant="standalone"
          p={0}
          href="https://guide.form.gov.sg/"
          externalLinkIcon={
            <Icon as={BxsHelpCircle} ml="0.5rem" fontSize="1.5rem" />
          }
        >
          Visit our Help Center
        </Link>
      </FeatureSection>
      <FeatureSection
        align="start"
        direction={{ base: 'column', lg: 'row' }}
        bg="primary.100"
        title="How it works"
        imgSrc={howFormWorksImg}
      >
        <Tabs mt="2.5rem">
          <TabList>
            <Tab>Storage mode</Tab>
            <Tab>Email mode</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <SectionBodyText mt="1.5rem">
                View your responses within Form. All data is end-to-end
                encrypted, which means third parties, including Form, will not
                be able to access or view your form data.
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
                  Login to FormSG via Internet or Intranet
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={2} />
                  Create a new form and choose Storage mode
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={3} />
                  Build and share form link with citizens
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={4} />
                  Upload Secret Key and view your responses
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={5} />
                  Download your responses as a CSV
                </ListItem>
              </OrderedList>
            </TabPanel>
            <TabPanel>
              <p>two!</p>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </FeatureSection>
      <LandingSection>
        <SectionTitleText>
          All the government tools you need to manage your workflow
        </SectionTitleText>
        <SectionBodyText>
          Form is part of the **Open Government Products Suite**, and as a
          public officer you can mix and match from our set of productivity and
          collaboration tools. [Full list of OGP
          products](https://www.open.gov.sg/products/overview)
        </SectionBodyText>
      </LandingSection>
      <LandingSection bg="secondary.700" align="center">
        <Image src={FormBrandLogo} aria-hidden h="3.5rem" />
        <Text
          textStyle={{ base: 'display-2-mobile', md: 'display-2' }}
          color="white"
          mt="2rem"
        >
          Start building your form now.
        </Text>
        <Box mt="2rem">
          <Button as={ReactLink} to={LOGIN_ROUTE}>
            Get started
          </Button>
        </Box>
      </LandingSection>
      <AppFooter />
    </Flex>
  )
}
