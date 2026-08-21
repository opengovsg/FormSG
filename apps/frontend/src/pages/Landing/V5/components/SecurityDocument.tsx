import { Box, BoxProps, Flex, Text } from '@chakra-ui/react'

import { usePeel } from '../hooks/usePeel'
import { LANDING_V5_COLORS } from '../theme/tokens'

import { Blade } from './BladeMaskDefs'

/** Resting cut, in px: a corner already lifted enough to promise a fold. */
const PEEL_REST = 44
/**
 * Open cut, in px. A 45 degree fold can only ever be as deep as the sheet's
 * short side, which is why the document carries five rows rather than three:
 * height is what buys the peel more cipher to uncover.
 */
const PEEL_OPEN = 250
/** Slow, because the travel is long. See `UsePeelOptions.speed`. */
const PEEL_SPEED = 0.055
/** Long enough to read as a deliberate gesture, short enough to still connect
 *  to the scroll that caused it. */
const PEEL_AUTO_OPEN_DELAY_MS = 450

/**
 * Ornament. Long enough to fill the sheet to its bottom corner: a shorter
 * string runs out exactly where the opened triangle needs proof to be.
 */
const CIPHER =
  'eVnsMcJkDDW6egG4AhuULqLzvZ9D7XYQZskPCHXvbeu8Y4qQMAUKs6B4BnQqZtGaVnsMcJkDDW6egCHmXvbeu8Y4qQMAhuULqLzvZ9D7XYTtnFfGQiDxrpUqfL6paQZskPCHXvbeu8Y4qQMAUKs6B4BnQqZtGaeVnsMcJkDDW6egG4AhuULqLzvZ9D7XYQZskPCHXvbeu8Y4qQMAUKs6B4BnQqZtGaVnsMcJkDDW6egCHmXvbeu8Y4qQMAhuULqLzvZ9D7XYTtnFfGQiDxrpUqfL6paQZskPCHXvbeu8Y4qQMAUKs6B4BnQqZtGaeVnsMcJkDDW6egG4AhuULqLzQZskPCHXvbeu8Y4qQMAUKs6B4BnQqZtGaVnsMcJkDDW6egCHmXvbeu8Y4qQMAhuULqLzvZ9D7XYTtnFfGQiDxrpUqfL6paQZskPCHXvbeu8Y4qQMAUKs6B4BnQqZtGaeVnsMcJkDDW6egG4AhuULqLzvZ9D7XYQZskPCHXvbeu8Y4qQMAUKs6B4BnQqZtGaVnsMcJkDDW6egCHmXvbeu8Y4qQMAhuULqLzvZ9D7XYTtnFfGQiDxrpUqfL6paQZskPCHXvbeu8Y4qQMAUKs6B4BnQqZtGaeVnsMcJkDDW6egG4AhuULqLzvZ9D7XYQZskPCH'

/**
 * The illustrated response. Field labels are ornament, not messaging, so they
 * stay here rather than in the i18n bundle — same call as the die-cut sticker
 * figures and the cipher above.
 */
const RESPONSE_ROWS: readonly { label: string; value: string }[] = [
  { label: 'Vehicle number', value: 'SGX1234A' },
  { label: 'Email', value: 'wei.ming@agency.gov.sg' },
  { label: 'Parking zone', value: 'Zone C' },
  { label: 'Officer', value: 'Lim Wei Ming' },
  { label: 'Submitted via', value: 'Singpass' },
]

const ResponseRow = ({
  label,
  value,
}: {
  label: string
  value: string
}): JSX.Element => (
  <Flex
    justify="space-between"
    align="baseline"
    /* space-between guarantees no gap only while the row has slack. Once it is
       full the id and the value butt together and read as one string, so the
       gap is a floor space-between cannot give. */
    gap="0.875rem"
    fontSize="0.875rem"
    py="0.6875rem"
    borderBottom="1px solid #f2efe8"
    _last={{ borderBottom: 'none' }}
  >
    <Text as="span" color="landing.muted" flex="0 0 auto">
      {label}
    </Text>
    <Text
      as="b"
      fontWeight={600}
      fontFamily="var(--lv5-mono)"
      fontSize={{ base: '0.75rem', md: '0.8125rem' }}
      textAlign="right"
      /* The address is one unbroken token. `minW: 0` lets it shrink below its
         intrinsic width and `anywhere` gives it somewhere legal to break, or it
         runs straight into its own label at phone width. */
      minW={0}
      sx={{ overflowWrap: 'anywhere' }}
    >
      {value}
    </Text>
  </Flex>
)

/**
 * The classified document, with the corner actually turned back.
 *
 * The exploration's G variant cut the corner away and the triangle simply
 * stopped existing. An earlier V5 swung the whole sheet in 3D, which showed
 * plenty but did not look like paper. This does both: the cut defines the fold,
 * and the mint underside shows through the hole it leaves.
 *
 * Everything runs off `--lv5-c`, so the cut, the blade and the crease shadow
 * cannot disagree. `usePeel` owns that value.
 *
 * Deliberately not focusable, and not given a button role. The fold opens
 * itself on scroll for every reader, so pointer hover and click are an
 * enhancement rather than the only way in; promoting it to a control would
 * promise keyboard users a state change that carries no information they do not
 * already have.
 */
export const SecurityDocument = (props: BoxProps): JSX.Element => {
  const { ref, handlers } = usePeel<HTMLDivElement>({
    rest: PEEL_REST,
    open: PEEL_OPEN,
    speed: PEEL_SPEED,
    autoOpenDelayMs: PEEL_AUTO_OPEN_DELAY_MS,
  })

  return (
    <Box
      ref={ref}
      className="lv5-peel"
      cursor="pointer"
      w="100%"
      maxW="26.25rem"
      my="0.625rem"
      mb="1.125rem"
      {...handlers}
      {...props}
    >
      {/* The underside sits in register with the document rather than offset
          behind it: the cut is a hole through the page, so what shows through
          has to line up exactly. */}
      <Box
        position="absolute"
        inset="1px"
        borderRadius="4px"
        overflow="hidden"
        bgGradient={`linear(315deg, ${LANDING_V5_COLORS.mintDeep} 0%, ${LANDING_V5_COLORS.mint} 80%)`}
        boxShadow="0 12px 28px rgba(3,120,90,0.22)"
      >
        {/* The page's stamp device, inked on the mint instead of on the paper.
            It is always there; the peel is what uncovers it, which is the whole
            claim.

            No z-index, deliberately. The parent is positioned with
            `z-index: auto`, so it is not a stacking context — a positioned
            child with a z-index would be promoted into the card's context and
            paint above the document, putting the stamp on the white page at
            rest. Left at auto, document order alone keeps it underneath.

            Position is measured, not eyeballed: a point is inside the revealed
            triangle when its distance from the right edge plus its distance
            from the bottom is under `--lv5-c`. The near corner must exceed the
            resting 44px or the stamp pokes through the sealed card; the far
            corner must stay under the open 250px or the document clips it. The
            box is about 105x40 and the tilt eats ~7px off the near corner, so
            these values sit mid-band. */}
        <Text
          as="span"
          position="absolute"
          right="34px"
          bottom="38px"
          textStyle="landing.monoLabel"
          fontSize="0.75rem"
          letterSpacing="0.15em"
          color="landing.mintInk"
          border="2.5px solid"
          borderColor="landing.mintInk"
          borderRadius="4px"
          padding="0.25rem 0.625rem"
          transform="rotate(-8deg)"
          opacity={0.85}
        >
          Encrypted
        </Text>
        <Box
          className="lv5-cipher"
          aria-hidden
          position="absolute"
          inset={0}
          padding="1rem 1.125rem"
          fontFamily="var(--lv5-mono)"
          fontSize="0.6875rem"
          lineHeight={1.8}
          color="landing.mintInk"
          opacity={0.8}
          overflow="hidden"
          textAlign="left"
        >
          {CIPHER}
        </Box>
      </Box>

      {/* The white document. `lv5-cut-br` clips its corner back so the mint
          shows through, and the blade sits in the gap that leaves. */}
      <Box
        className="lv5-cut-br lv5-peel-doc"
        position="relative"
        bg="white"
        border="1px solid"
        borderColor="landing.hairline"
        borderRadius="4px"
        boxShadow="0 1px 0 rgba(38,58,112,0.05), 0 22px 50px rgba(38,58,112,0.12)"
        padding={{ base: '1.5rem', md: '1.875rem 2.125rem' }}
        textAlign="left"
      >
        <Flex
          justify="space-between"
          gap="0.75rem"
          textStyle="landing.monoEyebrow"
          letterSpacing="0.14em"
          color="landing.muted"
          borderBottom="1px solid"
          borderColor="landing.hairline"
          pb="0.75rem"
          mb="0.375rem"
        >
          <Text as="span">RESPONSE #1042</Text>
          <Text as="span">10:52 TODAY</Text>
        </Flex>
        {RESPONSE_ROWS.map((row) => (
          <ResponseRow key={row.label} {...row} />
        ))}
      </Box>

      <Blade corner="br" />
    </Box>
  )
}
