import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, SimpleGrid, Text } from '@chakra-ui/react'

import { BuilderMock } from '../components/BuilderMock'
import { Reveal } from '../components/Reveal'
import { WorkflowStack } from '../components/WorkflowStack'

interface SpecRowProps {
  title: string
  body: string
  /** The illustration. Always decorative; the copy carries the claim. */
  visual: ReactNode
  /** Dashed rule above, separating this row from the one before it. */
  hasDivider?: boolean
}

/**
 * One row of the spec sheet: the claim on the left, a working illustration on
 * the right.
 *
 * The copy column is a fixed 380px at the two-column breakpoint, as in the
 * prototype — the illustrations are the part that should absorb extra width,
 * not the prose, which has an ideal measure.
 */
const SpecRow = ({
  title,
  body,
  visual,
  hasDivider,
}: SpecRowProps): JSX.Element => (
  <SimpleGrid
    templateColumns={{ base: '1fr', lg: '23.75rem 1fr' }}
    gap={{ base: '1.75rem', lg: '3rem' }}
    alignItems="center"
    padding={{ base: '2.25rem 1.5rem', lg: '3.5rem 3.75rem' }}
    borderTop={hasDivider ? '1px dashed' : undefined}
    borderColor="#d5cfc2"
  >
    <Box>
      <Text
        as="h3"
        fontSize={{ base: '1.625rem', lg: '1.875rem' }}
        fontWeight={600}
        letterSpacing="-0.02em"
        mb="0.75rem"
      >
        {title}
      </Text>
      <Text textStyle="landing.body">{body}</Text>
    </Box>
    {/* `minW={0}` lets the illustration column shrink below its content's
        intrinsic width instead of forcing the grid wider than the sheet. */}
    <Box minW={0} justifySelf="stretch">
      {visual}
    </Box>
  </SimpleGrid>
)

/**
 * The capabilities section, set as a printed spec sheet: one white card, rows
 * divided by dashed rules.
 *
 * Two rows, matching the messaging lock in `docs/DECISIONS.md` — build first,
 * then the workflow.
 */
export const CapabilitiesSection = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Box as="section" maxW="84rem" mx="auto" px="2rem" pt="9.375rem">
      <Box textAlign="center" maxW="47.5rem" mx="auto" mb="3.25rem">
        <Reveal>
          <Text
            as="h2"
            textStyle={{
              base: 'landing.displayHead-mobile',
              md: 'landing.displayHead',
            }}
          >
            {t('features.landingV5.capabilities.title')}
          </Text>
        </Reveal>
        <Reveal>
          <Text textStyle="landing.lede" mt="0.875rem">
            {t('features.landingV5.capabilities.lede')}
          </Text>
        </Reveal>
      </Box>

      <Reveal
        maxW="73.75rem"
        mx="auto"
        bg="white"
        border="1px solid"
        borderColor="landing.hairline"
        borderRadius="4px"
        boxShadow="0 1px 0 rgba(38,58,112,0.05), 0 18px 44px rgba(38,58,112,0.09)"
      >
        <SpecRow
          title={t('features.landingV5.capabilities.build.title')}
          body={t('features.landingV5.capabilities.build.body')}
          visual={<BuilderMock />}
        />
        <SpecRow
          hasDivider
          title={t('features.landingV5.capabilities.workflow.title')}
          body={t('features.landingV5.capabilities.workflow.body')}
          visual={<WorkflowStack />}
        />
      </Reveal>
    </Box>
  )
}
