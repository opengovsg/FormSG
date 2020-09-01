// This file contains defaults used throughout the app that does not really need
// to be kept in a `.env` file, or can be used as a fallback when the `.env` key
// does not exist.

// Config for AWS.
const AWS_CONFIG = {
  region: 'ap-southeast-1',
  endpoint: 'http://localhost:4572',
}

const LINKS = {
  supportFormLink: 'https://go.gov.sg/formsg-support',
}

export default {
  aws: AWS_CONFIG,
  links: LINKS,
}
