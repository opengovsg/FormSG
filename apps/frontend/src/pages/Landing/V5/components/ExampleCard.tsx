import { useTranslation } from 'react-i18next'
import { Box, Text } from '@chakra-ui/react'

import { getUseTemplateUrl, TemplateCard } from '../constants/templateCards'
import { usePeel } from '../hooks/usePeel'

import { Blade } from './BladeMaskDefs'
import { Reveal } from './Reveal'

/** Sealed at rest. */
const PEEL_REST = 0
/** Cracked open on approach. Far smaller than the security fold on purpose: a
 *  template has no secret underside, so this is just paper behaving like
 *  paper. The one peel that means something is at security. */
const PEEL_OPEN = 48
/** Quicker than the security fold, because the travel is short. */
const PEEL_SPEED = 0.085

export interface ExampleCardProps {
  card: TemplateCard
}

/**
 * One template, drawn as a tilted sample form.
 *
 * Renders as a link when the card has a `formId`, and as a plain figure when it
 * does not. That matters: the prototype used `href="#"` on all three, which
 * gives a keyboard reader three focusable links that announce as links and go
 * nowhere. A card with no destination should not pretend to have one, and the
 * moment the three form ids exist these become real links with no code change.
 */
export const ExampleCard = ({ card }: ExampleCardProps): JSX.Element => {
  const { t } = useTranslation()
  const { ref, handlers } = usePeel<HTMLDivElement>({
    rest: PEEL_REST,
    open: PEEL_OPEN,
    speed: PEEL_SPEED,
  })

  const isLink = Boolean(card.formId)
  const name = t(`features.landingV5.examples.${card.key}.name`)

  return (
    <Reveal
      className="lv5-ex-card"
      as={isLink ? 'a' : 'div'}
      {...(isLink
        ? { href: getUseTemplateUrl(card.formId as string) }
        : /* Not a link, so it must not be reachable or announced as one. The
             name and description are still read from the text below. */
          { role: 'group' })}
      display="block"
      sx={{ '--lv5-tilt': card.tilt, '--lv5-dy': card.dy }}
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
      /* Focus gets the same treatment as hover. Click is deliberately NOT
         wired: on the security document a click toggles the fold, but here the
         card navigates, and a peel that toggled under the cursor mid-click
         would fight the link. */
      onFocus={handlers.onMouseEnter}
      onBlur={handlers.onMouseLeave}
    >
      {/* The peel's ref sits here, not on the Reveal: `Reveal` owns its own ref
          for the intersection observer, and this element is an ancestor of both
          the blade and the cut, which is all `--lv5-c` has to reach. */}
      <Box ref={ref} className="lv5-ex-tilt">
        <Blade corner="tr" />
        <Box
          className="lv5-ex-form lv5-cut-tr"
          position="relative"
          bg="white"
          border="1px solid"
          borderColor="landing.hairline"
          borderRadius="8px"
          overflow="hidden"
          boxShadow="0 10px 26px rgba(38,58,112,0.10)"
        >
          <Box
            bg={card.accent}
            color="white"
            textAlign="center"
            fontSize="0.875rem"
            fontWeight={500}
            padding="0.75rem 0.625rem"
          >
            {name}
          </Box>
          {/* The form's own grey ground, so the white field card inside reads
              as a form on a page rather than as more of the same sheet. */}
          <Box bg="#f6f7fa" padding="0.875rem">
            <Box
              bg="white"
              borderRadius="4px"
              padding="0.875rem 1rem 1rem"
              boxShadow="0 1px 3px rgba(38,58,112,0.08)"
              textAlign="left"
            >
              {card.fields.map((field, index) => (
                <Box key={field.label}>
                  <Text
                    fontSize="0.75rem"
                    fontWeight={600}
                    mt={index === 0 ? 0 : '0.625rem'}
                    mb="0.3125rem"
                  >
                    {field.label}
                  </Text>
                  <Box
                    border="1px solid #dadce3"
                    borderRadius="4px"
                    padding="0.5rem 0.625rem"
                    fontSize="0.75rem"
                    color="#b3b2af"
                    bg="white"
                  >
                    {field.ghost}
                  </Box>
                </Box>
              ))}
              <Box
                bg={card.accent}
                color="white"
                fontSize="0.75rem"
                fontWeight={600}
                borderRadius="4px"
                padding="0.5rem 0"
                mt="0.875rem"
                textAlign="center"
              >
                Submit
              </Box>
            </Box>
          </Box>
        </Box>
        <Box textAlign="center" mt="1.125rem">
          <Text
            fontSize="0.875rem"
            lineHeight={1.5}
            color="#4a4a4a"
            mb="0.5rem"
          >
            {t(`features.landingV5.examples.${card.key}.body`)}
          </Text>
          {isLink ? (
            <Text
              as="span"
              className="lv5-ex-link"
              fontSize="0.875rem"
              fontWeight={500}
              color="landing.blue"
            >
              {t('features.landingV5.examples.viewTemplate')} &rarr;
            </Text>
          ) : null}
        </Box>
      </Box>
    </Reveal>
  )
}
