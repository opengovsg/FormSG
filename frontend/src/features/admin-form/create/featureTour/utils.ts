export const getFeaturTourToolTipMarginTop = (
  featureTourStep: number,
): string => {
  let marginTop
  switch (featureTourStep) {
    case 0:
      marginTop = '5rem'
      break
    case 1:
      marginTop = '8.5rem'
      break
    case 2:
      marginTop = '12rem'
      break
    default:
      marginTop = '5rem'
  }

  return marginTop
}
