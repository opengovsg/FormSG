export const getEmailDomainFromEmail = (email: string) => {
  return email.split('@').pop()
}
