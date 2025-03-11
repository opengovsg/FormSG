export * from './en-sg'

export interface App {
  ctaButton: {
    login: string
  }
  publicHeaderLinkLabel: {
    formGuide: string
  }
  footer: {
    appName: string
  }
  adminNavBar: {
    logoTitle: string
    whatsNew: string
    linkLabel: {
      featureRequest: string
      formGuide: string
    }
    avatarMenuItem: {
      billing: string
      emergencyContact: string
      transferAllForms: string
      logout: string
    }
  }
}
