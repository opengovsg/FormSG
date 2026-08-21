import { useTranslation } from 'react-i18next'
import { Link as ReactLink } from 'react-router-dom'
import { Box, Button, Flex, Link, Text } from '@chakra-ui/react'

import { FORM_GUIDE } from '~constants/links'
import { LOGIN_ROUTE } from '~constants/routes'

import { Reveal } from '../components/Reveal'

const LOGO_MARK = '/static/images/landing-v5/formsg-logo-mark.svg'

/**
 * The closing call to action.
 *
 * Not one of the nine numbered parts of the port plan — that list ended at the
 * hero — but the prototype has it and a landing page without a closing action is
 * unfinished, so it lands here with the hero.
 *
 * Both actions point at real destinations rather than the prototype's `#`: the
 * button goes where the existing landing page's CTAs go, and the guide link uses
 * the shared `FORM_GUIDE` constant.
 */
export const CloseSection = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Box
      as="section"
      textAlign="center"
      pt={{ base: '6.5rem', md: '10.625rem' }}
      pb={{ base: '4.5rem', md: '6.875rem' }}
      px="1.5rem"
    >
      {/* Decorative: the header already names the product, and the heading
          beneath says what to do. */}
      <Box
        as="img"
        src={LOGO_MARK}
        alt=""
        aria-hidden
        w="4.625rem"
        mx="auto"
        mb="1.75rem"
      />
      <Reveal>
        <Text
          as="h2"
          textStyle={{
            base: 'landing.displayHead-mobile',
            md: 'landing.displayHead',
          }}
          /* 66px in the prototype, between displayHead's 64 and nothing else on
             the page. Reuses displayHead rather than adding a style for a 2px
             difference nothing else would share. */
          sx={{ textWrap: 'balance' }}
        >
          {t('features.landingV5.close.title')}
        </Text>
      </Reveal>
      <Reveal>
        <Flex gap="0.75rem" justify="center" mt="2.125rem">
          <Button as={ReactLink} to={LOGIN_ROUTE} variant="landingPill">
            {t('features.landingV5.close.cta')}
          </Button>
        </Flex>
      </Reveal>
      <Reveal>
        <Text fontSize="0.9375rem" color="landing.muted" mt="1.25rem">
          {t('features.landingV5.close.guidePrefix')}{' '}
          <Link
            href={FORM_GUIDE}
            isExternal
            color="landing.blue"
            fontWeight={500}
            textDecoration="none"
            _hover={{ textDecoration: 'underline' }}
          >
            {t('features.landingV5.close.guideLink')} &rarr;
          </Link>
        </Text>
      </Reveal>
    </Box>
  )
}
