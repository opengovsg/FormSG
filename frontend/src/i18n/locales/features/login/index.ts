export * from './en-sg'
export * from './zh-sg.example'

export interface Login {
  components: {
    LoginForm: {
      onlyAvailableForPublicOfficers: string
      emailEmptyErrorMsg: string
      login: string
      haveAQuestion: string
    }
    OTPForm: {
      signin: string
      otpRequired: string
      otpLengthCheck: string
      otpTypeCheck: string
      otpFromEmail: string
    }
    SgidLoginButton: {
      loginText: string
      appText: string
      onlyText: string
      selectAgenciesText: string
      canUseSingpassLoginText: string
    }, 
    SsoLoginButton: {
      loginText: string
    },
    WogadLoginButton: {
      loginText: string
    }
  }
  LoginPage: {
    slogan: string
    banner: string
    forbidden: string
    expiredSession: string
  }
  SelectProfilePage: {
    accountSelection: string
    manualLogin: string
    noWorkEmailHeader: string
    noWorkEmailBody: string
    noWorkEmailCta: string
    invalidWorkEmailHeader: string
    invalidWorkEmailBodyRestriction: string
    invalidWorkEmailBodyContact: string
    invalidWorkEmailCta: string
  }
}
