import { useCallback, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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

import { PUBLIC_PAYMENTS_GUIDE_LINK } from 'formsg-shared/constants'
import { BasicField, EmailFieldBase } from 'formsg-shared/types'

import { AppFooter } from '~/app/AppFooter'
import { AppPublicHeader } from '~/app/AppPublicHeader'

import { BxsCheckCircle } from '~assets/icons'
import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import Link from '~components/Link'
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

export const LandingPaymentsPage = (): JSX.Element => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const onboardingSuccessHelperText: onboardingHelperTextType = {
    icon: <BxsCheckCircle />,
    text: t('features.landingPayments.onboarding.success'),
  }
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
            message: t('features.landingPayments.onboarding.errors.forbidden'),
          })
        } else {
          formMethods.setError(fieldId, {
            message: t('features.landingPayments.onboarding.errors.general'),
          })
        }
      }
    }
  }, [sendOnboardingEmailMutation, formMethods, t])

  const bottomCTARef = useRef<HTMLDivElement | null>(null)

  const LinkToBottomCTA = () => (
    <Link
      onClick={() =>
        bottomCTARef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    >
      {t('features.landingPayments.helpCenter.linkToGuide')}
    </Link>
  )

  const Features = () => (
    <LandingSection>
      <SectionTitleText maxW="37.5rem">
        {t('features.landingPayments.features.title')}
      </SectionTitleText>
      <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3 }}
        spacingX="2.5rem"
        spacingY="4rem"
        mt="4rem"
      >
        <FeatureGridItem
          image={featureSelfServiceImg}
          title={t('features.landingPayments.features.selfService.title')}
          description={t(
            'features.landingPayments.features.selfService.description',
          )}
        />
        <FeatureGridItem
          image={featureReconImg}
          title={t('features.landingPayments.features.reconciliation.title')}
          description={t(
            'features.landingPayments.features.reconciliation.description',
          )}
        />
        <FeatureGridItem
          image={featureTrustedImg}
          title={t('features.landingPayments.features.trusted.title')}
          description={t(
            'features.landingPayments.features.trusted.description',
          )}
        />
        <FeatureGridItem
          image={featureInvoicingImg}
          title={t('features.landingPayments.features.invoicing.title')}
          description={t(
            'features.landingPayments.features.invoicing.description',
          )}
        />
        <FeatureGridItem
          image={featureMethodsImg}
          title={t('features.landingPayments.features.paymentMethods.title')}
          description={t(
            'features.landingPayments.features.paymentMethods.description',
          )}
        />
        <FeatureGridItem
          image={featureFlexibleImg}
          title={t('features.landingPayments.features.flexible.title')}
          description={t(
            'features.landingPayments.features.flexible.description',
          )}
        />
      </SimpleGrid>
    </LandingSection>
  )

  const HelpCenter = () => (
    <FeatureSection
      title={t('features.landingPayments.helpCenter.title')}
      imgSrc={helpCenterImg}
      direction={{ base: 'column', lg: 'row' }}
      bg="primary.100"
    >
      <Box>
        <SectionBodyText mt="1rem">
          {t('features.landingPayments.helpCenter.description')}
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
              'features.landingPayments.helpCenter.faq.whatDoINeed.question',
            )}
          >
            <Text>
              {t('features.landingPayments.helpCenter.faq.whatDoINeed.answer')}{' '}
              <LinkToBottomCTA />
            </Text>
          </HelpAccordionItem>
          <HelpAccordionItem
            title={t(
              'features.landingPayments.helpCenter.faq.transactionFees.question',
            )}
          >
            <Text>
              {t(
                'features.landingPayments.helpCenter.faq.transactionFees.answer',
              )}{' '}
              <LinkToBottomCTA />
            </Text>
          </HelpAccordionItem>
          <HelpAccordionItem
            title={t(
              'features.landingPayments.helpCenter.faq.invoice.question',
            )}
          >
            <Text>
              {t('features.landingPayments.helpCenter.faq.invoice.answer')}
            </Text>
          </HelpAccordionItem>
          <HelpAccordionItem
            title={t(
              'features.landingPayments.helpCenter.faq.reconciliation.question',
            )}
          >
            <Text>
              {t(
                'features.landingPayments.helpCenter.faq.reconciliation.answer',
              )}
            </Text>
          </HelpAccordionItem>
        </Accordion>
      </Box>
      <FeatureLink
        href={PUBLIC_PAYMENTS_GUIDE_LINK}
        externalLinkIcon={
          <Icon as={BxsHelpCircle} ml="0.5rem" fontSize="1.5rem" />
        }
      >
        {t('features.landingPayments.helpCenter.linkText')}
      </FeatureLink>
    </FeatureSection>
  )

  // Note: Email fields in HeroBanner and BottomCTA should be the same. Extracted into a separate component due to blur when error state changes.
  return (
    <>
      <AppPublicHeader bg="primary.500" />
      {/* Hero Banner */}
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
              {t('features.landingPayments.hero.title')}
            </Text>
            <SectionBodyText mt="1rem" color={mainSectionTextColour}>
              {t('features.landingPayments.hero.description')}
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
                    placeholder: t(
                      'features.landingPayments.hero.emailPlaceholder',
                    ),
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
                  {t('features.landingPayments.hero.submitButton')}
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
      <Features />
      <HelpCenter />
      {/* Bottom CTA */}
      {/* TODO after migration to design system: set bg to color.brand.primary.900 */}
      <LandingSection bg="#1D2A5E">
        <Grid
          templateColumns={isMobile ? undefined : 'repeat(2, 1fr)'}
          ref={bottomCTARef}
        >
          <GridItem alignSelf="center">
            <Text textStyle="h5" color="primary.100" mr="2rem">
              {t('features.landingPayments.bottomCta.title')}
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
                    placeholder: t(
                      'features.landingPayments.hero.emailPlaceholder',
                    ),
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
                  {t('features.landingPayments.hero.submitButton')}
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
