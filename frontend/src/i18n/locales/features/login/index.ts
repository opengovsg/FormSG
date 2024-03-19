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
  }
  LoginPage: {
    slogan: string
  }
}
