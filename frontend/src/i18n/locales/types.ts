interface Translation {
  translation: {
    features: {
      login: {
        components: {
          LoginForm: {
            onlyAvailableForPublicOfficers: string
            email: string
            emailEmptyErrorMsg: string
            login: string
            haveAQuestion: string
          }
        }
        LoginPage: {
          slogan: string
        }
      }
    }
    pages: {
      Landing: {
        LandingPage: {
          hero: {
            slogan: string
            subtitle: string
            buttonText: string
          }
          features: {
            title: string
            dragAndDropBuilder: {
              title: string
              text: string
            }
            accessible: {
              title: string
              text: string
            }
            conditionalLogic: {
              title: string
              text: string
            }
            governmentIntegrations: {
              title: string
              text: string
            }
            webhooks: {
              title: string
              text: string
            }
            formSections: {
              title: string
              text: string
            }
            prefill: {
              title: string
              text: string
            }
            emailConfirmation: {
              title: string
              text: string
            }
          }
        }
      }
    }
  }
}

export default Translation
