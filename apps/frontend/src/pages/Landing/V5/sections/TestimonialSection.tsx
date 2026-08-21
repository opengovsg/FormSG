import { useTranslation } from 'react-i18next'
import { Box, Flex, Text } from '@chakra-ui/react'

import { Reveal } from '../components/Reveal'

/** A hairline that fills the space beside the label. */
const Rule = (): JSX.Element => <Box flex={1} h="1px" bg="landing.hairline" />

/**
 * The testimonial, set as a print pull-quote: a ruled label, an oversized
 * quote mark, the quote, then the attribution and a closing rule.
 */
export const TestimonialSection = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Box
      as="section"
      maxW="53.75rem"
      mx="auto"
      px="1.5rem"
      pt="9.375rem"
      textAlign="center"
    >
      <Reveal>
        <Flex align="center" gap="0.875rem" mb="2.25rem">
          <Rule />
          <Text
            as="span"
            textStyle="landing.monoLabel"
            color="landing.fadedInk"
          >
            {t('features.landingV5.testimonial.eyebrow')}
          </Text>
          <Rule />
        </Flex>
      </Reveal>

      <Reveal px={{ base: 0, md: '2.5rem' }}>
        {/* U+201C, not the ASCII double quote. At this size a straight quote
            renders as two vertical bars and reads as a pause glyph rather than
            a quote mark. Body copy stays on straight punctuation; this one is
            purely decorative, hence aria-hidden — the blockquote below is the
            content. */}
        <Box
          as="span"
          aria-hidden
          display="block"
          fontSize="7.5rem"
          fontWeight={600}
          color="landing.bluePale"
          lineHeight={0.5}
          mb="1.125rem"
        >
          &ldquo;
        </Box>
        <Text
          as="blockquote"
          fontSize={{ base: '1.375rem', md: '1.75rem' }}
          fontWeight={500}
          letterSpacing="-0.01em"
          lineHeight={1.35}
          color="landing.ink"
        >
          {t('features.landingV5.testimonial.quote')}
        </Text>
        <Box fontSize="0.875rem" color="landing.muted" mt="1.375rem">
          {/* Name on its own line: the role and the school together run longer
              than the name, so setting them as one string buried who was
              speaking. */}
          <Text
            as="b"
            display="block"
            color="landing.ink"
            fontWeight={600}
            mb="3px"
          >
            {t('features.landingV5.testimonial.name')}
          </Text>
          {t('features.landingV5.testimonial.role')}
        </Box>
      </Reveal>

      <Reveal>
        <Flex mt="2.25rem">
          <Rule />
        </Flex>
      </Reveal>
    </Box>
  )
}
