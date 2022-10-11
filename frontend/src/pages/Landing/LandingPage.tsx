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
  GUIDE_E2EE,
  GUIDE_SECRET_KEY_LOSS,
  GUIDE_STORAGE_MODE,
  GUIDE_TRANSFER_OWNERSHIP,
  LANDING_PAGE_EXAMPLE_FORMS,
  OGP_ALL_PRODUCTS,
  OGP_FORMSG_COLLATE,
  OGP_FORMSG_REPO,
} from '~constants/links'
import { LOGIN_ROUTE } from '~constants/routes'
import { useIsMobile } from '~hooks/useIsMobile'
import { useMdComponents } from '~hooks/useMdComponents'
import Button from '~components/Button'
import Link from '~components/Link'
import { MarkdownText } from '~components/MarkdownText'
import { Tab } from '~components/Tabs'
import { LottieAnimation } from '~templates/LottieAnimation'

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
import { ExternalFormLink } from './components/ExternalFormLink'
import { FeatureGridItem } from './components/FeatureGridItem'
import { FeatureLink } from './components/FeatureLink'
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
  const mdComponents = useMdComponents()

  return (
    <>
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
              Build secure government forms in minutes.
            </Text>
            <SectionBodyText>
              Instant, customisable forms with zero code or cost, to safely
              collect classified and sensitive data.
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
          <Flex flex={1} aria-hidden justify="right">
            <LottieAnimation animationData={formsHeroAnimation} />
          </Flex>
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
            description="Launch forms in minutes with the drag-and-drop builder, and over 20 types of fields to choose from"
          />
          <FeatureGridItem
            image={featureIntegrationsImg}
            title="Singpass and Myinfo"
            description="Authenticate individuals or businesses with Singpass, and speed up form filling with pre-filled data from Myinfo"
          />
          <FeatureGridItem
            image={featureLogicImg}
            title="Conditional logic"
            description="Create dynamic forms that show or hide specific fields based on previous responses"
          />
          <FeatureGridItem
            image={featureEmailImg}
            title="Email confirmation"
            description="Send confirmation emails to your respondents along with a copy of their responses"
          />
          <FeatureGridItem
            image={featurePrefillImg}
            title="Prefill"
            description="Make form filling faster for respondents by pre-filling fields for them"
          />
          <FeatureGridItem
            image={featureWebhooksImg}
            title="Webhooks"
            description="Send form responses to external applications in real time"
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
              No onboarding, no fees, no code.
            </SectionTitleText>
            <SectionBodyText>
              Sign in with your government email address, and start building
              forms immediately. It’s free, and requires no onboarding or
              approvals.
            </SectionBodyText>
            <Box mt="2.5rem">
              <Button as={ReactLink} to={LOGIN_ROUTE}>
                Get started
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
        <SectionTitleText>Used by most government agencies</SectionTitleText>
        <Wrap shouldWrapChildren spacingX="3rem" mt="2.5rem" spacingY="2.5rem">
          <StatsItem stat={data?.formCount} description="forms launched" />
          <StatsItem
            stat={data?.submissionCount}
            description="submissions received"
          />
          <StatsItem
            stat={data?.userCount}
            description="public officers onboard"
          />
          <StatsItem
            stat={data?.agencyCount}
            description="government agencies"
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
        <SectionBodyText textAlign={{ lg: 'center' }}>
          Form is a critical enabler of many agency workflows. Notable forms
          launched include:
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
        title="Secure collection of responses"
        imgSrc={storageModeImg}
      >
        <SectionBodyText>
          All form responses are either encrypted end-to-end (Storage mode) or
          sent directly to your email inbox (Email mode). This means third
          parties, including FormSG, will not be able to access or view your
          form data.
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
        <FeatureLink
          href={GUIDE_STORAGE_MODE}
          externalLinkIcon={
            <Icon as={BiRightArrowAlt} ml="0.5rem" fontSize="1.5rem" />
          }
        >
          Read more about Storage Mode
        </FeatureLink>
      </FeatureSection>
      <FeatureSection
        title="Open sourced"
        imgSrc={openSourceImg}
        direction={{ base: 'column', lg: 'row-reverse' }}
      >
        <SectionBodyText>
          Our code is open source, meaning anyone can help improve it and build
          on it, including governments of other countries.
        </SectionBodyText>
        <FeatureLink
          href={OGP_FORMSG_REPO}
          externalLinkIcon={<BxlGithub ml="0.5rem" fontSize="1.5rem" />}
        >
          Fork it on Github
        </FeatureLink>
      </FeatureSection>
      <FeatureSection
        title="Help Center"
        imgSrc={helpCenterImg}
        direction={{ base: 'column', lg: 'row' }}
      >
        <Box>
          <SectionBodyText>
            Have a question? Most answers can be found in our self-service Help
            Center. Common questions include:
          </SectionBodyText>
          <Accordion
            variant="medium"
            mt="1rem"
            color="secondary.500"
            allowToggle
            whiteSpace="pre-wrap"
          >
            <HelpAccordionItem title="What happens if I lose my Secret Key?">
              <MarkdownText components={mdComponents}>
                {dedent`
                  If you have lost your secret key, take these steps immediately:

                  1. If your form is live, duplicate your form, save the new secret key securely and replace the original form's link with the new form's link to continue collecting responses. Deactivate the original form as soon as possible to avoid losing further responses.

                  2. On the computer you used to create the original form, search for 'Form Secret Key'. Secret keys typically downloaded into your Downloads folder as .txt files with 'Form Secret Key' in the filename.

                  3. If you have created multiple forms with similar titles in the past, it is possible that you have confused the different forms' secret keys with each other, as form titles are in the secret keys' filenames. Try all secret keys with similar filenames on your form.

                  4. If you remember sending an email to share your secret key with collaborators, search the Sent folder in your email for the keyword 'secret key' and your form title. 

                  5. If you still cannot find your secret key and would like our help to debug this further, contact us on our [help form](${CONTACT_US}). 

                  Without your secret key, you will not be able to access your existing response data. Additionally, it's not possible for us to recover your lost secret key or response data on your behalf. This is because Form does not retain your secret key or any other way to unlock your encrypted data - the only way to ensure response data is truly private to agencies only. This is an important security benefit, because that means even if our server were to be compromised, an attacker would never be able to unlock your encrypted responses.
                `}
              </MarkdownText>
              <FeatureLink mt="1rem" href={GUIDE_SECRET_KEY_LOSS}>
                Source
              </FeatureLink>
            </HelpAccordionItem>
            <HelpAccordionItem title="How do I increase attachment size limit?">
              <MarkdownText components={mdComponents}>
                {dedent`
                  The current size limit is 7 MB for email mode forms, and 20 MB for storage mode forms.

                  7 MB for email mode forms is a hard limit because the email service we use has a fixed 10 MB outgoing size, and we buffer 3 MB for email fields and metadata. 

                  Because the smallest unit you can attach per attachment field is 1 MB, you can have a max of 7 attachments on your form in email mode, and a max of 20 attachments in storage mode. If your user has to submit more than 7  documents in email mode (or more than 20 in storage mode), you may create just one attachment field of 7 or 20 MB in their respective modes, and advise your user to zip documents up and submit as one attachment.
                `}
              </MarkdownText>
              <FeatureLink mt="1rem" href={GUIDE_ATTACHMENT_SIZE_LIMIT}>
                Source
              </FeatureLink>
            </HelpAccordionItem>
            <HelpAccordionItem title="How does end-to-end encryption work?">
              <MarkdownText components={mdComponents}>
                {dedent`
                When a respondent submits a response, response data is encrypted in the respondent's browser before being sent to our servers for storage. This means that by the time Form's servers receive responses, they have already been scrambled and are stored in this unreadable form. Your response data remains in this encrypted state until you decrypt your responses with your secret key, transforming them into a readable format. 

                The benefit of end-to-end encryption is that response data enters and remains in Form's servers in an encrypted state. This ensures that even if our servers are compromised by an attack, attackers will still not be able to decrypt and view your response data, as they do not possess your secret key.  
              `}
              </MarkdownText>
              <FeatureLink mt="1rem" href={GUIDE_E2EE}>
                Source
              </FeatureLink>
            </HelpAccordionItem>
            <HelpAccordionItem title="How do I transfer ownership of my forms?">
              <MarkdownText components={mdComponents}>
                {dedent`
                  You can transfer ownership on the top right hand corner of each form by clicking the Add Collaborator button. 

                  Note that you might not need to transfer ownership of your form. You may simply add your colleague as a collaborator. Collaborators have the same rights as form creators, except they cannot delete the form.
                `}
              </MarkdownText>
              <FeatureLink mt="1rem" href={GUIDE_TRANSFER_OWNERSHIP}>
                Source
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
          Visit our Help Center
        </FeatureLink>
      </FeatureSection>
      <FeatureSection
        align="start"
        direction={{ base: 'column', lg: 'row' }}
        bg="primary.100"
        title="How it works"
        animationSrc={howFormsWorksAnimation}
      >
        <Tabs mt="2.5rem">
          <TabList>
            <Tab>Storage mode</Tab>
            <Tab>Email mode</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <SectionBodyText mt="1.5rem">
                View your responses within FormSG. All data is end-to-end
                encrypted, which means third parties, including FormSG, will not
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
                  Log in to FormSG via Internet or Intranet
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={2} />
                  Create a new Storage mode form and store Secret Key safely
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
              <SectionBodyText mt="1.5rem">
                Receive your responses at your email address. Form sends
                responses directly to your email and does not store any response
                data.
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
                  Log in to FormSG via Internet or Intranet
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={2} />
                  Create a new form and choose Email mode
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={3} />
                  Build and publish your form
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={4} />
                  Collect responses at your email address
                </ListItem>
                <ListItem textStyle="body-2">
                  <OrderedListIcon index={5} />
                  Collate responses with our{' '}
                  <Link isExternal href={OGP_FORMSG_COLLATE}>
                    data collation tool
                  </Link>
                </ListItem>
              </OrderedList>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </FeatureSection>
      <FeatureSection
        title="All the government tools you need to manage your workflow"
        imgSrc={ogpSuiteImg}
        direction={{ base: 'column', lg: 'row' }}
      >
        <SectionBodyText>
          FormSG is part of the **Open Government Products Suite**, and as a
          public officer you can mix and match from our set of productivity and
          collaboration tools.
        </SectionBodyText>
        <FeatureLink
          href={OGP_ALL_PRODUCTS}
          externalLinkIcon={
            <Icon as={BiRightArrowAlt} ml="0.5rem" fontSize="1.5rem" />
          }
        >
          Full list of OGP products
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
          Start building your form now.
        </Text>
        <Box mt="2rem">
          <Button as={ReactLink} to={LOGIN_ROUTE}>
            Get started
          </Button>
        </Box>
      </LandingSection>
      <AppFooter />
    </>
  )
}
