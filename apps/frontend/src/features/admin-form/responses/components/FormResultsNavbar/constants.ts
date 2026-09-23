export const RESULTS_NAV_WIDTH = { base: '5rem', md: '7.5rem', lg: '15rem' }

export const resultsNavBleed = {
  ml: { base: 0, lg: `-${RESULTS_NAV_WIDTH.lg}` },
  w: { base: '100%', lg: `calc(100% + ${RESULTS_NAV_WIDTH.lg})` },
}
