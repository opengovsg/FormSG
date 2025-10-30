export interface LandingPayments {
  onboarding: {
    success: string
    errors: {
      forbidden: string
      general: string
    }
  }
  hero: {
    title: string
    description: string
    emailPlaceholder: string
    submitButton: string
  }
  features: {
    title: string
    selfService: {
      title: string
      description: string
    }
    reconciliation: {
      title: string
      description: string
    }
    trusted: {
      title: string
      description: string
    }
    invoicing: {
      title: string
      description: string
    }
    paymentMethods: {
      title: string
      description: string
    }
    flexible: {
      title: string
      description: string
    }
  }
  helpCenter: {
    title: string
    description: string
    linkText: string
    linkToGuide: string
    faq: {
      whatDoINeed: {
        question: string
        answer: string
      }
      transactionFees: {
        question: string
        answer: string
      }
      invoice: {
        question: string
        answer: string
      }
      reconciliation: {
        question: string
        answer: string
      }
    }
  }
  bottomCta: {
    title: string
  }
}
