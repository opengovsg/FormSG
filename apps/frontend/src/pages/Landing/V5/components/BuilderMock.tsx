import { forwardRef } from 'react'
import {
  BiArrowBack,
  BiChevronDown,
  BiCopy,
  BiTrash,
  BiX,
} from 'react-icons/bi'
import { Box, BoxProps, Flex, Icon, Text } from '@chakra-ui/react'

import { useBuilderDrag } from '../hooks/useBuilderDrag'

/**
 * A miniature of the FormSG builder: the edit pane on the left, the form canvas
 * on the right.
 *
 * Hand-built rather than a screenshot, for three reasons. It stays crisp at any
 * width, it can actually perform the drag the row's headline claims, and
 * `docs/DECISIONS.md` requires demos to show real FormSG mechanics rather than a
 * borrowed metaphor — which means it has to be the edit pane and canvas, not a
 * generic document.
 *
 * The controls are styled Boxes, not the repo's real Input/Switch/Button. At
 * these sizes — 10px labels, a 26x15px toggle — the real components would have
 * to be fought out of their own type scale and spacing, and they carry
 * behaviour this has no use for. Nothing here is interactive.
 *
 * Hidden from assistive technology in its entirety: it is a picture of a
 * builder, and every label in it is decoration. The row's copy carries the
 * meaning.
 *
 * NOTE FOR REVIEWERS: this goes stale when the builder's UI changes. It is a
 * likeness maintained by hand, not a live render.
 */

/** Shared border colour for the mock's inputs; cooler than the page hairline
 *  because this pane is product chrome, not paper. */
const CONTROL_BORDER = '#dadce3'
const PANE_DIVIDER = '#eceff4'

const FieldLabel = ({ children, ...props }: BoxProps): JSX.Element => (
  <Box
    fontSize="0.625rem"
    fontWeight={600}
    color="#33363d"
    mb="0.3125rem"
    {...props}
  >
    {children}
  </Box>
)

interface ControlProps extends BoxProps {
  isFocused?: boolean
  isMuted?: boolean
}

const Control = ({
  isFocused,
  isMuted,
  children,
  ...props
}: ControlProps): JSX.Element => (
  <Box
    border="1px solid"
    borderColor={isFocused ? 'landing.blue' : CONTROL_BORDER}
    boxShadow={isFocused ? '0 0 0 1px var(--lv5-blue)' : undefined}
    borderRadius="4px"
    padding="0.3125rem 0.4375rem"
    fontSize="0.625rem"
    bg="white"
    color={isMuted ? 'landing.fadedInk' : undefined}
    {...props}
  >
    {children}
  </Box>
)

const Toggle = ({ isOn }: { isOn: boolean }): JSX.Element => (
  <Box
    position="relative"
    w="1.625rem"
    h="0.9375rem"
    borderRadius="99px"
    flexShrink={0}
    bg={isOn ? '#31a06e' : '#c9ccd4'}
    _after={{
      content: '""',
      position: 'absolute',
      top: '2px',
      left: isOn ? '13px' : '2px',
      w: '11px',
      h: '11px',
      borderRadius: '50%',
      bg: 'white',
    }}
  />
)

const Section = ({ children, ...props }: BoxProps): JSX.Element => (
  <Box
    padding="0.5625rem 0.6875rem"
    borderBottom="1px solid"
    borderColor={PANE_DIVIDER}
    {...props}
  >
    {children}
  </Box>
)

/** The edit pane. Hidden below the spec sheet's two-column breakpoint, where
 *  there is no room for it and the canvas is the half that carries the point. */
const EditPane = (): JSX.Element => (
  <Box
    display={{ base: 'none', xl: 'flex' }}
    flexDirection="column"
    w="14.75rem"
    borderRight="1px solid"
    borderColor="#f2efe8"
  >
    <Flex
      align="center"
      gap="0.5rem"
      padding="0.5625rem 0.6875rem"
      borderBottom="1px solid"
      borderColor={PANE_DIVIDER}
    >
      <Icon
        as={BiArrowBack}
        boxSize="0.6875rem"
        color="landing.muted"
        flexShrink={0}
      />
      <Text
        as="h6"
        flex={1}
        textAlign="center"
        fontSize="0.71875rem"
        fontWeight={600}
      >
        Edit Short answer
      </Text>
      <Icon as={BiX} boxSize="0.6875rem" color="landing.muted" flexShrink={0} />
    </Flex>

    <Section>
      <FieldLabel>Field Name</FieldLabel>
      <Control isFocused>Vehicle number</Control>
    </Section>

    <Section>
      <FieldLabel>
        Description{' '}
        <Box as="span" fontWeight={400} color="landing.muted">
          (optional)
        </Box>
      </FieldLabel>
      <Control h="2rem" />
    </Section>

    <Section>
      <Flex justify="space-between" align="center" gap="0.5rem">
        <FieldLabel mb={0}>Required</FieldLabel>
        <Toggle isOn />
      </Flex>
    </Section>

    <Section>
      <FieldLabel>Number of characters allowed</FieldLabel>
      <Flex gap="0.3125rem">
        <Control
          isMuted
          flex={1}
          minW={0}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap="0.25rem"
        >
          Select an option
          <Icon as={BiChevronDown} boxSize="0.5625rem" flexShrink={0} />
        </Control>
        <Control isMuted flex={1} minW={0}>
          Number
        </Control>
      </Flex>
    </Section>

    <Section borderBottom="none">
      <Flex justify="space-between" align="center" gap="0.5rem">
        <FieldLabel mb={0}>Enable pre-fill</FieldLabel>
        <Toggle isOn={false} />
      </Flex>
      <Text
        fontSize="0.5625rem"
        lineHeight={1.45}
        color="landing.muted"
        mt="0.3125rem"
      >
        Use Field ID in the form URL to pre-fill this field for respondents.{' '}
        <Box as="span" color="landing.blue">
          Learn how
        </Box>
      </Text>
    </Section>

    <Flex
      mt="auto"
      align="center"
      justify="flex-end"
      gap="0.625rem"
      padding="0.625rem 0.6875rem"
    >
      <Box as="span" fontSize="0.65625rem" fontWeight={500} color="#33363d">
        Cancel
      </Box>
      <Box
        as="span"
        bg="landing.blue"
        color="white"
        fontSize="0.65625rem"
        fontWeight={600}
        borderRadius="4px"
        padding="0.375rem 0.75rem"
      >
        Save field
      </Box>
    </Flex>
  </Box>
)

interface CanvasFieldProps extends BoxProps {
  index: number
  label: string
  ghost: string
  isSelected?: boolean
}

/**
 * One field on the canvas. `isSelected` mirrors the edit pane's open field.
 *
 * forwardRef because `useBuilderDrag` measures these elements — it needs each
 * one's real height to work out how far it has to travel to clear its
 * neighbour. A plain function component would have swallowed the ref.
 */
const CanvasField = forwardRef<HTMLDivElement, CanvasFieldProps>(
  ({ index, label, ghost, isSelected, children, ...props }, ref) => (
    <Box
      ref={ref}
      className="lv5-field"
      position="relative"
      border="1.5px solid"
      borderColor={isSelected ? 'landing.blue' : 'transparent'}
      borderRadius="6px"
      padding="0.75rem 0.625rem 0.5rem"
      mb="4px"
      bg={isSelected ? '#fafbfe' : 'white'}
      {...props}
    >
      {/* U+283F is the full braille cell. One is a complete six-dot grip; the
        prototype originally had two and it read as two separate handles. */}
      <Box
        className="lv5-grip"
        position="absolute"
        top="3px"
        left="50%"
        transform="translateX(-50%)"
        color="#c9c8c5"
        fontSize="0.5625rem"
        cursor="grab"
      >
        &#10303;
      </Box>
      <Text
        as="b"
        fontSize="0.71875rem"
        fontWeight={600}
        display="block"
        mb="0.375rem"
      >
        <Box as="span" fontWeight={400} color="landing.muted" mr="2px">
          {index}.
        </Box>
        {label}
      </Text>
      <Box
        border="1px solid"
        borderColor={CONTROL_BORDER}
        borderRadius="4px"
        padding="0.375rem 0.5rem"
        fontSize="0.65625rem"
        color="#b3b2af"
      >
        {ghost}
      </Box>
      {children}
    </Box>
  ),
)
CanvasField.displayName = 'CanvasField'

export const BuilderMock = (): JSX.Element => {
  const { containerRef, firstFieldRef, secondFieldRef } = useBuilderDrag()

  return (
    <Box
      aria-hidden
      w="100%"
      bg="white"
      border="1px solid"
      borderColor="landing.hairline"
      borderRadius="6px"
      overflow="hidden"
      boxShadow="0 10px 26px rgba(38,58,112,0.09)"
      textAlign="left"
    >
      <Flex align="stretch">
        <EditPane />
        <Box flex={1} minW={0} bg="#eef1f8" padding="0.875rem">
          <Box
            bg="white"
            borderRadius="6px"
            overflow="hidden"
            boxShadow="0 2px 8px rgba(38,58,112,0.08)"
          >
            <Box
              bg="landing.blue"
              color="white"
              textAlign="center"
              fontSize="0.8125rem"
              fontWeight={500}
              padding="0.75rem 0.625rem"
            >
              Season parking application
            </Box>
            <Box ref={containerRef} padding="0.75rem">
              <CanvasField
                ref={firstFieldRef}
                index={1}
                label="Vehicle number"
                ghost="e.g. SGX1234A"
                isSelected
              >
                {/* Duplicate and delete. `display: block` on the glyphs is what
                    keeps them on one line: an inline glyph sits on the text
                    baseline, which had the second one 3.3px low. */}
                <Flex
                  justify="flex-end"
                  align="center"
                  gap="0.625rem"
                  pt="0.4375rem"
                >
                  {/* `display: block` matters: an inline glyph sits on the text
                      baseline, which had the second icon rendering 3.3px low in
                      the prototype until it was taken out of inline flow. */}
                  <Icon
                    as={BiCopy}
                    boxSize="0.75rem"
                    color="#8a8a8a"
                    display="block"
                  />
                  <Icon
                    as={BiTrash}
                    boxSize="0.75rem"
                    color="#c04545"
                    display="block"
                  />
                </Flex>
              </CanvasField>
              <CanvasField
                ref={secondFieldRef}
                index={2}
                label="Full Name"
                ghost="Tan Wei Ming"
              />
            </Box>
          </Box>
        </Box>
      </Flex>
    </Box>
  )
}
