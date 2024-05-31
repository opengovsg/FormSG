export * from './en-sg'
export * from './zh-sg'

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
      forText: string
      selectAgenciesText: string
      loginText: string
      appText: string
    }
  }
  LoginPage: {
    slogan: string
    banner: string
    expiredSgIdSession: string
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
