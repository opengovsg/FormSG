export * from './en-sg'

export interface LandingPage {
  hero: {
    title: string
    subtitle: string
    ctaButtonLabel: string
  }
  featureSection: {
    title: string
    features: {
      dragDropBuilder: {
        title: string
        description: string
      }
      singpassAndMyinfo: {
        title: string
        description: string
      }
      conditionalLogic: {
        title: string
        description: string
      }
      emailConfirmation: {
        title: string
        description: string
      }
      prefill: {
        title: string
        description: string
      }
      webhooks: {
        title: string
        description: string
      }
    }
  }
  getStartedSection: {
    title: string
    subtitle: string
    ctaButtonLabel: string
  }
  usedByAgenciesSection: {
    title: string
    formsLaunched: string
    submissionsReceived: string
    publicOfficersOnboard: string
    governmentAgencies: string
    exampleUserTitle: string
  }
  useCaseSection: {
    title: string
    subtitle: string
  }
  storageModeSection: {
    title: string
    subtitle: string
    modes: {
      storage: {
        title: string
        sensitivityLevel: string
      }
      email: {
        title: string
        sensitivityLevel: string
      }
    }
    guideCtaLabel: string
  }
  opensourceSection: {
    title: string
    subtitle: string
    forkItCtaLabel: string
  }
  helpCenterSection: {
    title: string
    subtitle: string
    visitHelpCenterCtaLabel: string
    common: {
      sourceLinkLabel: string
    }
    qnaAccordionItem: {
      loseSecretKey: {
        question: string
        answer: string
      }
      increaseAttachmentSizeLimit: {
        question: string
        answer: string
      }
      howDoesE2eWork: {
        question: string
        answer: string
      }
      howToTransferOwnership: {
        question: string
        answer: string
      }
    }
  }
  howItWorksSection: {
    title: string
    modes: {
      storage: {
        tab: string
        description: string
        steps: {
          one: string
          two: string
          three: string
          four: string
          five: string
          six: string
        }
      }
      mrf: {
        tab: string
        description: string
        steps: {
          one: string
          two: string
          three: string
          four: string
          five: string
          six: string
        }
      }
    }
  }
  ogpProductSuiteSection: {
    title: string
    subtitle: string
    ctaLinkLabel: string
  }
  ctaSection: {
    title: string
    ctaButtonLabel: string
  }
}
