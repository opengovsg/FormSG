import { useCallback, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  Accordion,
  Box,
  Flex,
  FormControl,
  FormHelperText,
  Grid,
  GridItem,
  Icon,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'

import { BasicField, EmailFieldBase } from '~shared/types'

import { AppFooter } from '~/app/AppFooter'
import { AppPublicHeader } from '~/app/AppPublicHeader'

import { BxsCheckCircle } from '~assets/icons'
import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { GUIDE_PAYMENTS_PUBLIC } from '~constants/links'
import { useIsMobile } from '~hooks/useIsMobile'
import { useMdComponents } from '~hooks/useMdComponents'
import Button from '~components/Button'
import { MarkdownText } from '~components/MarkdownText'
import {
  EmailField,
  EmailFieldSchema,
  FormFieldValues,
  VerifiableFieldValues,
} from '~templates/Field'

import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'

import { FeatureGridItem } from '../components/FeatureGridItem'
import { FeatureLink } from '../components/FeatureLink'
import { FeatureSection } from '../components/FeatureSection'
import { HelpAccordionItem } from '../components/HelpAccordionItem'
import { LandingSection } from '../components/LandingSection'
import { SectionBodyText } from '../components/SectionBodyText'
import { SectionTitleText } from '../components/SectionTitleText'

import paymentsImg from './assets/images/graphic_payments.svg'
import helpCenterImg from './assets/images/help_center.svg'
import featureFlexibleImg from './assets/images/icon_pay_flexible.svg'
import featureInvoicingImg from './assets/images/icon_pay_invoicing.svg'
import featureMethodsImg from './assets/images/icon_pay_methods.svg'
import featureReconImg from './assets/images/icon_pay_recon.svg'
import featureSelfServiceImg from './assets/images/icon_pay_self-service.svg'
import featureTrustedImg from './assets/images/icon_pay_trusted.svg'
import { useMutatePaymentsOnboarding } from './mutations'

type onboardingHelperTextType = {
  icon: JSX.Element
  text: string
}

const onboardingSuccessHelperText: onboardingHelperTextType = {
  icon: <BxsCheckCircle />,
  text: 'An email has been sent to this email address.',
}

export const LandingPaymentsPage = (): JSX.Element => {
  const isMobile = useIsMobile()
  const mdComponents = useMdComponents()
  const fieldId = 'PAYMENT_ONBOARDING_EMAIL_FIELD_ID'
  const emailFieldSchema: EmailFieldSchema = {
    ...(getFieldCreationMeta(BasicField.Email) as EmailFieldBase),
    title: '',
    _id: fieldId,
  }

  const formMethods = useForm<FormFieldValues>({
    mode: 'onChange',
  })

  const { sendOnboardingEmailMutation } = useMutatePaymentsOnboarding()

  const [onboardingHelperText, setOnboardingHelperText] = useState<
    onboardingHelperTextType | undefined
  >()

  const mainSectionTextColour = 'white'

  const handleSubmit = useCallback(async () => {
    const fieldValue = formMethods.getValues(fieldId) as VerifiableFieldValues
    try {
      await sendOnboardingEmailMutation.mutateAsync({
        email: fieldValue.value,
      })
      formMethods.clearErrors(fieldId)
      setOnboardingHelperText(onboardingSuccessHelperText)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Forbidden') {
          formMethods.setError(fieldId, {
            message: 'Please use an email whitelisted on FormSG.',
          })
        } else {
          formMethods.setError(fieldId, {
            message: 'Something went wrong. Please try again later.',
          })
        }
      }
    }
  }, [sendOnboardingEmailMutation, formMethods])

  return (
    <>
      <AppPublicHeader bg="primary.500" />
      <LandingSection bg="primary.500" pt={{ base: '2rem', md: 0 }} px="0">
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          spacing={{ base: '1.5rem', md: '3.125rem', lg: '7.5rem' }}
          pl={{ base: '1.5rem', md: '5.5rem', lg: '9.25rem' }}
        >
          <Flex
            flexDir="column"
            flex={1}
            pr={{ base: '1.5rem', md: '5.5rem', lg: '0' }}
            mt={isMobile ? undefined : '2rem'}
          >
            <Text
              as="h1"
              textStyle={{ base: 'display-1-mobile', md: 'display-1' }}
              color={mainSectionTextColour}
            >
              Collect payments on your form
            </Text>
            <SectionBodyText color={mainSectionTextColour}>
              Citizens can now pay for fees and services directly on your form.
              Enter your agency email to receive our guide on how to get started
              with payments.
            </SectionBodyText>
            <FormProvider {...formMethods}>
              <Flex alignItems="start" mt="2rem">
                <EmailField
                  schema={emailFieldSchema}
                  errorVariant="white"
                  inputProps={{
                    isSuccess: sendOnboardingEmailMutation.isSuccess,
                    isDisabled:
                      sendOnboardingEmailMutation.isLoading ||
                      sendOnboardingEmailMutation.isSuccess,
                  }}
                />
                <Button
                  variant="reverse"
                  mt="0.75rem"
                  ml="0.5rem"
                  onClick={handleSubmit}
                  onSubmit={handleSubmit}
                  isDisabled={
                    !formMethods.formState.isValid ||
                    sendOnboardingEmailMutation.isSuccess
                  }
                >
                  Submit
                </Button>
              </Flex>
              {onboardingHelperText && (
                <FormControl>
                  <FormHelperText color={mainSectionTextColour}>
                    <Stack direction="row" align="center">
                      <Box>{onboardingHelperText.icon}</Box>
                      <Text>{onboardingHelperText.text}</Text>
                    </Stack>
                  </FormHelperText>
                </FormControl>
              )}
            </FormProvider>
          </Flex>
          <Flex flex={1} aria-hidden>
            <Image src={paymentsImg} aria-hidden />
          </Flex>
        </Stack>
      </LandingSection>
      <LandingSection>
        <SectionTitleText maxW="37.5rem">Payment features</SectionTitleText>
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 3 }}
          spacingX="2.5rem"
          spacingY="4rem"
          mt="4rem"
        >
          <FeatureGridItem
            image={featureSelfServiceImg}
            title="Self-service"
            description="Start collecting payments in just a few simple steps."
          />
          <FeatureGridItem
            image={featureReconImg}
            title="Simple reconciliation"
            description="Associate a payment reference ID with every form submission ID. Track payments and payouts in one dashboard."
          />
          <FeatureGridItem
            image={featureTrustedImg}
            title="Trusted payment flows"
            description="We partner with Stripe, a leading payment provider, to ensure a secure and reliable payment experience. Respondents receive notifications from official gov.sg domains. "
          />
          <FeatureGridItem
            image={featureInvoicingImg}
            title="Invoicing"
            description="Respondents receive an invoice as proof of payment for each completed transaction."
          />
          <FeatureGridItem
            image={featureMethodsImg}
            title="Multiple payment methods"
            description="We support credit card, debit card and PayNow."
          />
          <FeatureGridItem
            image={featureFlexibleImg}
            title="Flexible"
            description="We've got you covered whether you are collecting fixed amounts or varying amounts from respondents."
          />
        </SimpleGrid>
      </LandingSection>
      <FeatureSection
        title="Help Center"
        imgSrc={helpCenterImg}
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
            whiteSpace="pre-wrap"
          >
            <HelpAccordionItem title="What do I need to start collecting payments?">
              <MarkdownText components={mdComponents}>
                You would need to create and verify your Stripe account,
                activate your account and fill in the business onboarding form.
                [Receive our guide for more information]()
              </MarkdownText>
            </HelpAccordionItem>
            <HelpAccordionItem title="Are there any transaction fees?">
              <MarkdownText components={mdComponents}>
                Stripe, our payment provider, charges transaction fees for every
                payment. Government agencies can enjoy special transaction
                rates. [Receive our guide for more information]()
              </MarkdownText>
            </HelpAccordionItem>
            <HelpAccordionItem title="Is there an invoice or receipt provided?">
              <MarkdownText components={mdComponents}>
                Respondents will receive a receipt generated by Stripe and an
                invoice generated by FormSG upon successful payment. Invoices
                will be sent to respondents for payment amounts less than
                S$1000.
              </MarkdownText>
            </HelpAccordionItem>
            <HelpAccordionItem title="How does reconciliation work?">
              <MarkdownText components={mdComponents}>
                Each payment reference ID is associated with a form submission
                ID. Payment and payout status can be viewed in your form
                response page as well as on the Stripe dashboard.
              </MarkdownText>
            </HelpAccordionItem>
          </Accordion>
        </Box>
        <FeatureLink
          href={GUIDE_PAYMENTS_PUBLIC}
          externalLinkIcon={
            <Icon as={BxsHelpCircle} ml="0.5rem" fontSize="1.5rem" />
          }
        >
          Visit our Payments Help Center
        </FeatureLink>
      </FeatureSection>
      {/* TODO after migration to design system: set bg to color.brand.primary.900 */}
      <LandingSection bg="#1D2A5E">
        <Grid templateColumns="repeat(2, 1fr)">
          <GridItem alignSelf="center">
            <Text textStyle="h5" color="primary.100" mr="2rem">
              Receive our guide to get started on payments
            </Text>
          </GridItem>
          <GridItem w="100%">
            <FormProvider {...formMethods}>
              <Flex width="100%">
                <EmailField
                  schema={emailFieldSchema}
                  errorVariant="white"
                  inputProps={{
                    isSuccess: sendOnboardingEmailMutation.isSuccess,
                    isDisabled:
                      sendOnboardingEmailMutation.isLoading ||
                      sendOnboardingEmailMutation.isSuccess,
                  }}
                />
                <Button
                  variant="reverse"
                  mt="0.75rem"
                  ml="0.5rem"
                  onClick={handleSubmit}
                  onSubmit={handleSubmit}
                  isDisabled={
                    !formMethods.formState.isValid ||
                    sendOnboardingEmailMutation.isSuccess
                  }
                >
                  Submit
                </Button>
              </Flex>
              {onboardingHelperText && (
                <FormControl>
                  <FormHelperText color={mainSectionTextColour}>
                    <Stack direction="row" align="center">
                      <Box>{onboardingHelperText.icon}</Box>
                      <Text>{onboardingHelperText.text}</Text>
                    </Stack>
                  </FormHelperText>
                </FormControl>
              )}
            </FormProvider>
          </GridItem>
        </Grid>
      </LandingSection>
      <AppFooter containerProps={{ bg: 'primary.100' }} />
    </>
  )
}
