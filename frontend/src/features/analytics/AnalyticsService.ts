const gtag = window?.gtag

export const trackAdminLogin = () => {
  if (!gtag) return
  gtag('event', 'login', {
    event_category: 'admin_login',
  })
}

export const trackAdminLoginFailure = (error: string) => {
  if (!gtag) return
  gtag('event', 'login', {
    event_category: 'admin_login_failure',
    message: error,
  })
}
