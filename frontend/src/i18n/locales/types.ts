interface Translation {
  translation: {
    features: {
      login: {
        components: {
          LoginForm: {
            onlyAvailableForPublicOfficers: string
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
