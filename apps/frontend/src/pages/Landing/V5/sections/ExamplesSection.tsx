import { useTranslation } from 'react-i18next'
import { Box, SimpleGrid, Text } from '@chakra-ui/react'

import { ExampleCard } from '../components/ExampleCard'
import { Reveal } from '../components/Reveal'
import { TEMPLATE_CARDS } from '../constants/templateCards'

/**
 * The examples row: three templates drawn as tilted sample forms.
 *
 * Left-aligned headings, unlike the centred capabilities head above it. That is
 * the prototype's choice and it earns its keep: the row below is a set of
 * objects laid on a surface, and a centred heading over an uneven row of tilted
 * cards fights the informality.
 *
 * `alignItems="start"` is load-bearing — each card carries its own vertical
 * offset, and stretching them to a common height would flatten the stagger.
 */
export const ExamplesSection = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Box as="section" maxW="73.75rem" mx="auto" px="2rem" pt="6.875rem">
      <Reveal>
        <Text
          as="h2"
          textStyle={{
            base: 'landing.displayHead-mobile',
            md: 'landing.displayHead',
          }}
          mb="0.875rem"
        >
          {t('features.landingV5.examples.title')}
        </Text>
      </Reveal>
      <Reveal>
        <Text textStyle="landing.lede" mb="3rem">
          {t('features.landingV5.examples.lede')}
        </Text>
      </Reveal>
      <SimpleGrid
        columns={{ base: 1, md: 3 }}
        gap={{ base: '2.5rem', md: '1.875rem' }}
        alignItems="start"
      >
        {TEMPLATE_CARDS.map((card) => (
          <ExampleCard key={card.key} card={card} />
        ))}
      </SimpleGrid>
    </Box>
  )
}
