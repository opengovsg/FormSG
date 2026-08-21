import { useTranslation } from 'react-i18next'
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import { Box, Button, Flex, Icon, IconButton, Text } from '@chakra-ui/react'

import { LOGIN_ROUTE } from '~constants/routes'

import { HeroStampWord } from '../components/HeroStampWord'
import { useHeroCarousel } from '../hooks/useHeroCarousel'

/** Copy, builder, live form. The carousel measures the real panes from the
 *  DOM for its scroll maths; this is only how many dots to draw. */
const PANE_COUNT = 3

const BUILDER_IMAGE = '/static/images/landing-v5/builder-screenshot.png'
const BUILDER_IMAGE_NARROW =
  '/static/images/landing-v5/builder-screenshot-mobile.png'

/**
 * The form embedded in the last pane, referenced same-origin and relative.
 *
 * The prototype pointed at `https://form.gov.sg/...`, which the backend CSP
 * blocks everywhere except production: `frameSrc` is `'self'` plus recaptcha,
 * Cloudflare and Stripe, with no form.gov.sg entry. A relative path is covered
 * by `'self'` in every environment.
 *
 * KNOWN LIMIT: this is an OGP-owned *production* form, so the path only
 * resolves on production. On local dev, staging or Storybook it renders that
 * environment's 404. Two ways out, both team decisions rather than code ones:
 * seed an equivalent form per environment, or add `https://form.gov.sg` to
 * `frameSrc` and use the absolute URL. Pass `embeddedFormId={undefined}` to
 * keep the idle placeholder instead of showing a 404.
 */
const DEFAULT_EMBEDDED_FORM_ID = '6a8411abf161e0be28977b5e'

const PANE_FRAME_SX = {
  position: 'relative',
  overflow: 'hidden',
  bg: 'white',
  border: '1px solid',
  borderColor: 'landing.hairline',
  borderRadius: '10px',
  height: { base: '26.875rem', lg: '28.875rem' },
  boxShadow:
    '0 4px 12px rgba(38,58,112,0.07), 0 16px 36px rgba(38,58,112,0.11), 0 44px 84px rgba(38,58,112,0.12)',
} as const

export interface HeroSectionProps {
  /**
   * Fired once when the reader reaches the end of the carousel. Wired to the
   * proof section's nudge, which is what points the page downwards when the
   * sideways story runs out.
   */
  onReachEnd?: () => void
  /**
   * The form to embed in the last pane. Explicitly `undefined` keeps the idle
   * placeholder, which is the honest state anywhere the form does not resolve.
   */
  embeddedFormId?: string
}

export const HeroSection = ({
  onReachEnd,
  embeddedFormId = DEFAULT_EMBEDDED_FORM_ID,
}: HeroSectionProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    sheetRef,
    carRef,
    trackRef,
    activeIndex,
    canScrollPrev,
    canScrollNext,
    goTo,
    isFrameArmed,
  } = useHeroCarousel({ onReachEnd })

  return (
    <Box as="section" textAlign="left" pt="5rem" px="1.5rem">
      <Box
        ref={sheetRef}
        className="lv5-hero-sheet"
        position="relative"
        maxW="73.75rem"
        mx="auto"
      >
        <Box
          position="relative"
          bg="white"
          border="1px solid"
          borderColor="landing.hairline"
          borderRadius="6px"
          overflow="hidden"
          boxShadow="0 1px 0 rgba(38,58,112,0.05), 0 8px 20px rgba(38,58,112,0.06), 0 34px 76px rgba(38,58,112,0.15)"
        >
          <Box ref={carRef} className="lv5-hcar">
            <Box ref={trackRef} className="lv5-hcar-track">
              {/* Pane 0: the copy. */}
              <Box className="lv5-hcar-pane lv5-pane-copy">
                <Text
                  as="h1"
                  textStyle={{
                    base: 'landing.heroHead-mobile',
                    lg: 'landing.heroHead',
                  }}
                  sx={{ textWrap: 'balance' }}
                >
                  {t('features.landingV5.hero.headlineBefore')}
                  <HeroStampWord>
                    {t('features.landingV5.hero.headlineStamped')}
                  </HeroStampWord>
                  <br />
                  {t('features.landingV5.hero.headlineAfter')}
                </Text>
                <Text
                  fontSize="1.09375rem"
                  lineHeight={1.5}
                  maxW="27.5rem"
                  mt="1.5rem"
                >
                  {t('features.landingV5.hero.subhead')}
                </Text>
                <Flex gap="0.75rem" mt="1.875rem">
                  {/* A real destination, not the prototype's `#`: the same
                      place the current landing page's CTAs go. */}
                  <Button as={ReactLink} to={LOGIN_ROUTE} variant="landingPill">
                    {t('features.landingV5.hero.cta')}
                  </Button>
                </Flex>
              </Box>

              {/* Pane 1: the builder, and the one cut off at the sheet edge on
                  arrival — the reader should meet the tool before the output. */}
              <Box className="lv5-hcar-pane lv5-pane-vis" data-pane="builder">
                <Box className="lv5-pane-frame" sx={PANE_FRAME_SX}>
                  {/* Two shots, not one cropped. The desktop capture is
                      2356x1452; no crop of it survives a phone column — fit it
                      whole and the labels render at about 4px, crop it tight and
                      the pairing that carries the point is gone. <picture> lets
                      the browser fetch only the one it needs. */}
                  <picture>
                    <source
                      media="(max-width: 1024px)"
                      srcSet={BUILDER_IMAGE_NARROW}
                    />
                    <img
                      src={BUILDER_IMAGE}
                      alt={t('features.landingV5.hero.builderAlt')}
                      decoding="async"
                    />
                  </picture>
                </Box>
                {/* The caption follows the shot, because the two breakpoints
                    show different parts of the tool. */}
                <Text
                  fontSize={{ base: '0.78125rem', lg: '0.84375rem' }}
                  lineHeight={1.45}
                  color="landing.muted"
                  px="2px"
                >
                  <Text as="b" color="landing.ink" fontWeight={600}>
                    {t('features.landingV5.hero.builderCaption')}
                  </Text>{' '}
                  <Box as="span" className="lv5-cap-wide">
                    {t('features.landingV5.hero.builderCaptionWide')}
                  </Box>
                  <Box as="span" className="lv5-cap-narrow">
                    {t('features.landingV5.hero.builderCaptionNarrow')}
                  </Box>
                </Text>
              </Box>

              {/* Pane 2: holds no iframe until it is approached. */}
              <Box className="lv5-hcar-pane lv5-pane-vis" data-pane="form">
                <Box
                  className="lv5-pane-frame"
                  sx={{ ...PANE_FRAME_SX, padding: '14px' }}
                >
                  {/* The embed arrives edge to edge with its own masthead, so
                      without an inset its grey bar butts into the card border
                      and the two read as one mis-drawn element. The padding
                      makes the card a mount and the form the thing mounted. */}
                  {isFrameArmed && embeddedFormId ? (
                    <Box
                      as="iframe"
                      title={t('features.landingV5.hero.formTitle')}
                      src={`/${embeddedFormId}`}
                    />
                  ) : (
                    /* Holds the frame's shape before the iframe is allowed to
                       load, so arriving at the pane does not collapse it. */
                    <Flex
                      position="absolute"
                      inset="14px"
                      borderRadius="6px"
                      align="center"
                      justify="center"
                      textStyle="landing.monoEyebrow"
                      color="landing.fadedInk"
                      bg="landing.greyRow"
                    >
                      {t('features.landingV5.hero.formIdle')}
                    </Flex>
                  )}
                </Box>
                <Text
                  fontSize={{ base: '0.78125rem', lg: '0.84375rem' }}
                  lineHeight={1.45}
                  color="landing.muted"
                  px="2px"
                >
                  <Text as="b" color="landing.ink" fontWeight={600}>
                    {t('features.landingV5.hero.formCaption')}
                  </Text>{' '}
                  {t('features.landingV5.hero.formCaptionBody')}
                </Text>
              </Box>
            </Box>
          </Box>

          {/* Controls. Horizontal scroll is close to undiscoverable on a mouse:
              a wheel does nothing here and the trackpad gesture is not one
              everybody has. These are the only affordance a mouse user gets, so
              they are always present rather than hover-revealed. */}
          <Flex
            position="absolute"
            right={{ base: '1.125rem', lg: '1.625rem' }}
            bottom={{ base: '1.125rem', lg: '1.375rem' }}
            zIndex={8}
            align="center"
            gap="0.625rem"
          >
            <Flex gap="0.375rem" mr="0.25rem" aria-hidden>
              {Array.from({ length: PANE_COUNT }, (_, index) => (
                <Box
                  key={index}
                  w="6px"
                  h="6px"
                  borderRadius="50%"
                  bg={
                    index === activeIndex ? 'landing.blue' : 'landing.fadedInk'
                  }
                  transform={index === activeIndex ? 'scale(1.35)' : undefined}
                  transition="background 0.2s, transform 0.2s"
                />
              ))}
            </Flex>
            <IconButton
              aria-label={t('features.landingV5.hero.previousPanel')}
              icon={<Icon as={BiChevronLeft} boxSize="0.9375rem" />}
              onClick={() => goTo(activeIndex - 1)}
              isDisabled={!canScrollPrev}
              minW="2.125rem"
              w="2.125rem"
              h="2.125rem"
              borderRadius="50%"
              bg="white"
              border="1px solid"
              borderColor="landing.hairline"
              color="landing.ink"
              boxShadow="0 2px 8px rgba(38,58,112,0.10)"
              _hover={{ bg: 'landing.paperDeep' }}
              _disabled={{ opacity: 0.35, cursor: 'default' }}
            />
            <IconButton
              aria-label={t('features.landingV5.hero.nextPanel')}
              icon={<Icon as={BiChevronRight} boxSize="0.9375rem" />}
              onClick={() => goTo(activeIndex + 1)}
              isDisabled={!canScrollNext}
              minW="2.125rem"
              w="2.125rem"
              h="2.125rem"
              borderRadius="50%"
              bg="white"
              border="1px solid"
              borderColor="landing.hairline"
              color="landing.ink"
              boxShadow="0 2px 8px rgba(38,58,112,0.10)"
              _hover={{ bg: 'landing.paperDeep' }}
              _disabled={{ opacity: 0.35, cursor: 'default' }}
            />
          </Flex>
        </Box>
      </Box>
    </Box>
  )
}
