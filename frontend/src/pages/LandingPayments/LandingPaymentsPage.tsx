import { Box, Flex, Image, SimpleGrid, Stack, Text } from '@chakra-ui/react'

import { AppFooter } from '~/app/AppFooter'
import { AppPublicHeader } from '~/app/AppPublicHeader'
import FormBrandLogo from '~/assets/svgs/brand/brand-mark-colour.svg'

import { GUIDE_PAYMENTS_PUBLIC } from '~constants/links'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import paymentsImg from './assets/images/graphic_payments.svg'
import featureFlexibleImg from './assets/images/icon_pay_flexible.svg'
import featureInvoicingImg from './assets/images/icon_pay_invoicing.svg'
import featureMethodsImg from './assets/images/icon_pay_methods.svg'
import featureReconImg from './assets/images/icon_pay_recon.svg'
import featureSelfServiceImg from './assets/images/icon_pay_self-service.svg'
import featureTrustedImg from './assets/images/icon_pay_trusted.svg'
import { FeatureGridItem } from './components/FeatureGridItem'
import { LandingSection } from './components/LandingSection'
import { SectionBodyText } from './components/SectionBodyText'
import { SectionTitleText } from './components/SectionTitleText'

export const LandingPaymentsPage = (): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <>
      <AppPublicHeader bg="primary.500" />
      <LandingSection bg="primary.500" pt={{ base: '2rem', md: 0 }} px="0">
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
              color="white"
            >
              Collect payments on your form
            </Text>
            <SectionBodyText color="white">
              Citizens can now pay for fees and services directly on your form.
            </SectionBodyText>
            <Box mt="2.5rem">
              <Button
                variant="reverse"
                isFullWidth={isMobile}
                as="a"
                href={GUIDE_PAYMENTS_PUBLIC}
                target="_blank"
              >
                Learn more about payments
              </Button>
            </Box>
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
      {/* TODO after migration to design system: set bg to color.brand.primary.900 */}
      <LandingSection bg="#1D2A5E" align="center">
        <Image src={FormBrandLogo} aria-hidden h="3.5rem" />
        <Text
          textAlign="center"
          textStyle={{ base: 'display-2-mobile', md: 'display-2' }}
          color="white"
          mt="2rem"
        >
          Learn how to set up your payments form
        </Text>
        <Box mt="2rem">
          <Button as="a" href={GUIDE_PAYMENTS_PUBLIC} target="_blank">
            Get started
          </Button>
        </Box>
      </LandingSection>
      <AppFooter containerProps={{ bg: 'primary.100' }} />
    </>
  )
}
