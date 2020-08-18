// This file contains defaults used throughout the app that does not really need
// to be kept in a `.env` file, or can be used as a fallback when the `.env` key
// does not exist.

// Config for express application.
const APP_CONFIG = {
  name: 'FormSG',
  url: 'https://form.gov.sg',
  desc: 'Form Manager for Government',
  keywords: 'forms, formbuilder, nodejs',
  images:
    '/public/modules/core/img/og/img_metatag.png,/public/modules/core/img/og/logo-vertical-color.png',
  twitterImage: '/public/modules/core/img/og/logo-vertical-color.png',
  port: 5000,
  sessionSecret: 'sandcrawler-138577',
}

// Config for login constants.
const LOGIN_CONFIG = {
  // Number is in miliseconds.
  otpLifeSpan: 900000,
}

// Config for email sending.
const MAIL_CONFIG = {
  // The sender email to display on mail sent.
  mailFrom: 'donotreply@mail.form.gov.sg',
}

// Config for AWS.
const AWS_CONFIG = {
  region: 'ap-southeast-1',
  endpoint: 'http://localhost:4572',
}

// Config for AWS SES service.
const SES_CONFIG = {
  // Connection removed and new one created when this limit is reached.
  maxMessages: 100,
  // Send email in parallel to SMTP server.
  maxConnections: 38,
  // How many milliseconds of inactivity to allow.
  socketTimeout: 600000,
}

const LINKS = {
  supportFormLink: 'https://go.gov.sg/formsg-support',
}

export default {
  app: APP_CONFIG,
  login: LOGIN_CONFIG,
  mail: MAIL_CONFIG,
  aws: AWS_CONFIG,
  ses: SES_CONFIG,
  links: LINKS,
}
