import { MotionGlobalConfig } from 'framer-motion'

// Chakra's Modal, Drawer, Slide etc. animate with framer-motion on rAF, which
// Argos (Playwright `animations: 'disabled'`) cannot freeze, so screenshots
// caught them mid-flight. Jump every animation to its end in capture runs only;
// `storybook dev` keeps real animations.
MotionGlobalConfig.skipAnimations = true
