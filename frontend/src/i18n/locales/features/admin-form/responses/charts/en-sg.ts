import { ResponsesCharts } from '.'

export const enSG: ResponsesCharts = {
  chartsPage: {
    secretKeyVerification: {
      ctaText: 'View charts',
      label: 'Enter or upload Secret Key to view charts',
    },
  },
  emptyChartContainer: {
    noResponses: {
      title: 'No charts generated yet.',
      subtitle:
        'Charts will be generated when you receive responses on your form.',
    },
    tooManyResponses: {
      title: 'No charts generated',
      subtitle:
        'The number of form submissions has exceeded the capacity allowed by Charts beta.',
    },
    noSupportedFields: {
      title: 'No charts generated yet.',
      subtitle:
        'You need at least one supported field in your form to generate charts.',
    },
  },
  unlockedChartsContainer: {
    responsesRetrieved:
      '{responsesRetrieved, plural, =1 {response} other {responses}} retrieved',
    noChartsForDateRange: {
      title: 'No charts generated for this date range',
      subtitle:
        'There were no responses collected within this date range. Try selecting a different date range.',
    },
  },
  components: {
    supportedFieldsInfoBox: {
      supportedFields: 'Supported fields',
      shortAnswer: 'Short answer',
      longAnswer: 'Long answer',
      radio: 'Radio',
      checkbox: 'Checkbox',
      dropdown: 'Dropdown',
      countryRegion: 'Country Region',
      yesOrNo: 'Yes / No',
      rating: 'Rating',
    },
  },
}
