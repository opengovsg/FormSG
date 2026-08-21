import { BiLockAlt } from 'react-icons/bi'
import { Flex, Icon, Text } from '@chakra-ui/react'

export interface ClaimChipProps {
  /** The claim's subject, set in running weight. */
  label: string
  /** The level being claimed, emphasised because it is the actual content. */
  value: string
}

/**
 * A clearance claim, set as a card on paper.
 *
 * Ported from the D Creased Clean exploration, which is dark-themed: the
 * structure carries over and every value is re-derived against paper. D's
 * translucent white fill becomes a solid white card on `--lv5-paper`, and its
 * `#8ef2d3` lock becomes `landing.mintInk` — the token that exists precisely
 * because raw mint has no contrast on a light ground.
 *
 * Unrotated on purpose. The earlier version tilted these like rubber stamps,
 * which competed with the peel for the section's visual peak.
 *
 * The lock is the repo's own `BiLockAlt` rather than the prototype's inline
 * path: at 14px the two are indistinguishable, and this leaves no bespoke SVG
 * to maintain.
 */
export const ClaimChip = ({ label, value }: ClaimChipProps): JSX.Element => (
  <Flex
    align="center"
    alignSelf={{ base: 'stretch', md: 'flex-start' }}
    /* On a phone one line each is impossible, so the value takes its own line
       rather than wrapping mid-phrase against a ragged right. */
    wrap={{ base: 'wrap', md: 'nowrap' }}
    gap="0.5rem"
    bg="white"
    border="1px solid"
    borderColor="landing.hairline"
    borderRadius="10px"
    padding="0.5rem 0.8125rem"
    fontSize="0.875rem"
    color="#444444"
  >
    <Icon
      as={BiLockAlt}
      boxSize="0.875rem"
      flexShrink={0}
      color="landing.mintInk"
      aria-hidden
    />
    <Text as="span">{label}</Text>
    <Text
      as="b"
      color="landing.ink"
      fontWeight={600}
      /* Indented past the lock on the wrapped layout, so the two lines read as
         one claim rather than as two list items. */
      flexBasis={{ base: '100%', md: 'auto' }}
      pl={{ base: '1.0625rem', md: 0 }}
    >
      {value}
    </Text>
  </Flex>
)
