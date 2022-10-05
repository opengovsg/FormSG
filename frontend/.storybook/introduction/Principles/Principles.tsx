import { Box, Text } from '@chakra-ui/layout'

import { fillMinHeightCss } from '~utils/fillHeightCss'

export const Principles = (): JSX.Element => {
  return (
    <Box
      color="white"
      bg="secondary.700"
      w="100%"
      css={fillMinHeightCss}
      px={{ base: '1.5rem', md: '5.5rem', lg: '7.5rem' }}
      py={{ base: '1.5rem', md: '5rem', lg: '6rem' }}
    >
      <Text mb="4rem" textStyle="display-2">
        Guiding principles
      </Text>
      <Box mb="1rem">
        <Text textStyle="h4">Accessible</Text>
        <Text textStyle="body-1">
          As a public facing product, our aim is to cater to all, regardless of
          age, disability, skill set, or situation. More specifically, we want
          visually impaired end-users as well as the elderly to be able to
          understand, navigate, submit forms on both desktop and mobile, using
          the tools they have, such as mouse, keyboard, or screen readers.
        </Text>
      </Box>
      <Box mb="1rem">
        <Text textStyle="h4">User centred</Text>
        <Text textStyle="body-1">
          Our design decisions should be driven by the needs of real users and
          backed up by research and/or data. All components and design patterns
          in a flow or experience should have a purpose. If a component or
          design element is not useful or does not enhance the experience, we
          should consider removing it. Eliminating ambiguity in our design will
          allow users to achieve their goal more efficiently. We can create new
          components if need be, but be mindful of its extensibility, possible
          use cases, impact of it, and also consider alternatives.
        </Text>
      </Box>
      <Box mb="1rem">
        <Text textStyle="h4">Consistency</Text>
        <Text textStyle="body-1">
          Designing with consistency removes confusion and cognitive load for
          our users. It strengthens their intuition so they understand and
          expect certain behaviour from components and interactions across the
          platform. It provides them with a familiar experience so they spend
          less time re-learning interactions, asking for help, or making
          mistakes. We should try to strive for users to feel that the
          experience makes sense to them. When users encounter something they
          anticipated, it creates a sense of comfort and builds trust.
        </Text>
      </Box>
      <Box mb="1rem">
        <Text textStyle="h4">Meaningful</Text>
        <Text textStyle="body-1">
          aesthetics The appearance of Form should be pleasing, but it must also
          complement or enhance our purpose. Thoughtful aesthetics can help
          guide, nudge, or prompt a user, and it supports and enhances the
          product’s functionality. Aesthetics is not a common principle in
          government where tangible concerns such as functionality, price,
          speed, and efficiency are highly valued. But putting thought and craft
          into our design and integrating it well with functionality shows our
          users we value them and their time spent on our product. While the
          benefits of good aesthetics might not sound so tangible, the
          consequences of poor aesthetics and attention to detail are very
          tangible - distraction from work objectives, decreased confidence in
          product (increased anxiety) and poorer motivation to digitalise
          current and future workflows. This creates friction for every workflow
          launched and barriers to digitalisation (adoption of more efficient
          practices). Additionally, [thoughtful aesthetics] helps raise the bar
          for government products and show by example that government design can
          be functional, usable, and be delightful at the same time.
        </Text>
      </Box>
    </Box>
  )
}
