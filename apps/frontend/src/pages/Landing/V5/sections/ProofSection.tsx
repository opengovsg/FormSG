import { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex, Text } from '@chakra-ui/react'

import { useLanding } from '~/pages/Landing/Home/queries'

import { AgencyMarquee } from '../components/AgencyMarquee'
import { Reveal } from '../components/Reveal'
import { formatCompactStat } from '../utils/formatCompactStat'

interface StickerProps {
  value?: number
  label: string
  /** Each sticker is set down at its own angle, as if applied by hand. */
  rotate: string
}

const Sticker = ({ value, label, rotate }: StickerProps): JSX.Element => (
  <Box textAlign="center">
    <Text
      as="span"
      display="inline-block"
      bg="landing.blue"
      color="white"
      fontWeight={600}
      lineHeight={1}
      fontSize={{ base: '3.25rem', md: '5.25rem' }}
      letterSpacing="-0.04em"
      /* Tabular figures so a number changing under the reader does not shuffle
         the sticker's width. */
      sx={{ fontVariantNumeric: 'tabular-nums' }}
      /* Padding, radius and border are in em so the die-cut keeps its
         proportions when the font size drops on mobile. */
      padding="0.14em 0.22em 0.18em"
      borderRadius="0.16em"
      border="0.06em solid"
      borderColor="#f2ede2"
      boxShadow="0 0.06em 0.22em rgba(38,58,112,0.30)"
      transform={`rotate(${rotate})`}
    >
      {formatCompactStat(value)}
    </Text>
    <Text
      as="span"
      display="block"
      mt="1.125rem"
      fontSize="0.6875rem"
      fontWeight={600}
      letterSpacing="0.14em"
      textTransform="uppercase"
      color="landing.muted"
    >
      {label}
    </Text>
  </Box>
)

export interface ProofSectionProps {
  /**
   * Target for the nudge. Comes from `useProofBob`, owned by the page, and
   * fired by the hero when the reader reaches the end of the carousel. Optional
   * so the section stands alone.
   */
  bobRef?: RefObject<HTMLDivElement>
  /**
   * Whether the page is still at the very top. While it is, the section is
   * faded, so the sliver visible below the hero reads as a hint rather than as
   * a heading accidentally clipped. Optional so the section stands alone.
   */
  isAtTop?: boolean
}

/**
 * The proof section: a claim, three numbers, and the agency marquee (part 5).
 *
 * Numbers come from the same `useLanding` query the current landing page uses,
 * so the two pages share one request and one cache entry rather than each
 * hitting /analytics/statistics.
 */
export const ProofSection = ({
  bobRef,
  isAtTop,
}: ProofSectionProps): JSX.Element => {
  const { t } = useTranslation()
  const { data } = useLanding()

  return (
    <Reveal
      as="section"
      className="lv5-proof"
      data-attop={isAtTop ? 'true' : undefined}
      py={{ base: '4rem', md: '6.5rem' }}
      px="1.5rem"
    >
      <Box ref={bobRef}>
        <Text
          as="h2"
          textStyle={{
            base: 'landing.sectionHead-mobile',
            md: 'landing.sectionHead',
          }}
          maxW="51.25rem"
          mx="auto"
          mb={{ base: '2rem', md: '3.25rem' }}
          textAlign="center"
        >
          {t('features.landingV5.proof.title')}
        </Text>
        <Flex
          justify="center"
          align="flex-end"
          gap={{ base: '2rem', md: '3.5rem' }}
          wrap="wrap"
        >
          <Sticker
            value={data?.agencyCount}
            label={t('features.landingV5.proof.agencies')}
            rotate="-2.5deg"
          />
          <Sticker
            value={data?.formCount}
            label={t('features.landingV5.proof.forms')}
            rotate="1.6deg"
          />
          <Sticker
            value={data?.submissionCount}
            label={t('features.landingV5.proof.responses')}
            rotate="-1.2deg"
          />
        </Flex>
      </Box>
      {/* Outside the bob wrapper: the nudge lifts the claim and the numbers,
          and dragging the logo row along with them reads as the whole page
          bouncing rather than as a hint. */}
      <AgencyMarquee />
    </Reveal>
  )
}
