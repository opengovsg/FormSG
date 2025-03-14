export * from './en-sg'

export interface ResponsesCharts {
  chartsPage: {
    secretKeyVerification: {
      ctaText: string
      label: string
    }
  }
  emptyChartContainer: {
    noResponses: {
      title: string
      subtitle: string
    }
    tooManyResponses: {
      title: string
      subtitle: string
    }
    noSupportedFields: {
      title: string
      subtitle: string
    }
  }
  unlockedChartsContainer: {
    responsesRetrieved: string
    noChartsForDateRange: {
      title: string
      subtitle: string
    }
  }
  components: {
    supportedFieldsInfoBox: {
      shortAnswer: string
      longAnswer: string
      radio: string
      checkbox: string
      dropdown: string
      countryRegion: string
      yesOrNo: string
      rating: string
    }
  }
}
