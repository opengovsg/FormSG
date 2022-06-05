interface Translation {
  translation: {
    general: {
      languageName: string
    }
    features: {
      publicForm: {
        components: {
          FormFields: {
            PublicFormSubmitButton: {
              submissionDisabled: string
              submitNow: string
              submitting: string
            }
          }
        }
      }
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
  }
}

export default Translation
