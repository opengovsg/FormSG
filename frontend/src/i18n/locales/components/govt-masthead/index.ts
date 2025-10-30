export interface GovtMasthead {
  aria: {
    expandLabel: string
    collapseLabel: string
  }
  mainText: string
  howToIdentify: string
  officialWebsiteLinks: {
    header: string
    description: string
    trustedWebsitesLink: {
      text: string
      ariaLabel: string
    }
  }
  secureWebsites: {
    header: string
    description: string
  }
  scamAlert: {
    header: string
    description: string
  }
}
