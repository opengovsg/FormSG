import { useTranslation } from 'react-i18next'
import { Box, SimpleGrid, Stack, Text } from '@chakra-ui/react'

import { ClaimChip } from '../components/ClaimChip'
import { Reveal } from '../components/Reveal'
import { SecurityDocument } from '../components/SecurityDocument'

/**
 * The security section: the claim on the left, the peeled document on the right.
 *
 * The two halves reveal independently, as in the prototype, so the copy and the
 * document rise on their own timing rather than as one slab. The document then
 * opens its own fold once it is properly in view — see `usePeel`.
 */
export const SecuritySection = (): JSX.Element => {
  const { t } = useTranslation()

  /* Top spacing is padding, not the prototype's margin-top: a top margin on the
     landing root's outermost child collapses out of the root, leaving a band of
     page background above the paper. Padding cannot escape. Same approach as
     ProofSection. */
  return (
    <Box as="section" maxW="84rem" mx="auto" px="2rem" pt="9.375rem">
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        gap={{ base: '2.75rem', lg: '4rem' }}
        alignItems="center"
      >
        <Reveal>
          <Text
            as="h2"
            textStyle={{
              base: 'landing.sectionHead-mobile',
              md: 'landing.sectionHead',
            }}
            mb="0.875rem"
          >
            {t('features.landingV5.security.title')}
          </Text>
          <Text
            textStyle="landing.body"
            /* 16.5px. Half a pixel over the shared body size, which is the
               prototype's own value — this paragraph carries the section on its
               own, with no lede above it. */
            fontSize="1.03125rem"
            mb="1.25rem"
          >
            {t('features.landingV5.security.body')}
          </Text>
          <Text
            textStyle="landing.monoLabel"
            color="landing.muted"
            mb="0.5625rem"
          >
            {t('features.landingV5.security.clearance')}
          </Text>
          {/* Both claims are one kind of thing, so they take one kind of tag. */}
          <Stack spacing="0.4375rem" mb="1.375rem" align="flex-start">
            <ClaimChip
              label={t('features.landingV5.security.classificationLabel')}
              value={t('features.landingV5.security.classificationValue')}
            />
            <ClaimChip
              label={t('features.landingV5.security.sensitivityLabel')}
              value={t('features.landingV5.security.sensitivityValue')}
            />
          </Stack>
        </Reveal>

        {/* `justifySelf="center"` would be the obvious way to centre this in
            its column, but it makes the grid item shrink-to-fit, and the card
            inside is `w="100%"` — a circular constraint that collapses the card
            to the width of its own text. An explicit width with `mx="auto"`
            centres it without that, and covers the prototype's desktop 420px
            and its mobile 100%/max-420 in one declaration. */}
        <Reveal w="100%" maxW="26.25rem" mx="auto" textAlign="center">
          <SecurityDocument />
          <Text
            fontSize="0.84375rem"
            color="landing.muted"
            mt="1.625rem"
            maxW="25rem"
            mx="auto"
          >
            {t('features.landingV5.security.caption')}
          </Text>
        </Reveal>
      </SimpleGrid>
    </Box>
  )
}
