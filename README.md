# FormSG

[![Build Status](https://github.com/opengovsg/FormSG/actions/workflows/deploy-eb.yml)](https://github.com/opengovsg/FormSG/actions/workflows/deploy-eb.yml)
[![Coverage Status](https://coveralls.io/repos/github/opengovsg/FormSG/badge.svg?branch=develop)](https://coveralls.io/github/opengovsg/FormSG?branch=develop)

## Table of Contents

- [FormSG](#formsg)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Local Development (Docker)](#local-development-docker)
    - [Prerequisites](#prerequisites)
    - [Running Locally](#running-locally)
    - [Environment variables](#environment-variables)
    - [Trouble-shooting](#trouble-shooting)
  - [Testing](#testing)
    - [Testing Prerequisites](#testing-prerequisites)
    - [Running tests](#running-tests)
      - [Unit tests](#unit-tests)
      - [End-to-end tests](#end-to-end-tests)
  - [Architecture](#architecture)
  - [MongoDB Scripts](#mongodb-scripts)
  - [Maintenance Banners](#maintenance-banners)
  - [Contributing](#contributing)
  - [Support](#support)

## Features

FormSG is a form builder application built, open sourced and maintained by the [Open Government Products](https://open.gov.sg) team of the Singapore [Government Technology Agency](https://tech.gov.sg) to digitise paper processes.

Notable features include:

- 19 different form field types, including attachments, tables, email and mobile
- Verified email and mobile phone fields via integrations with Twilio and AWS SES
- Automatic emailing of submissions for forms built with Email Mode
- End-to-end encryption for forms built with Storage Mode
- (Singapore government agencies only) Citizen authentication with [SingPass](https://www.singpass.gov.sg/singpass/common/aboutus)
- (Singapore government agencies only) Corporate authentication with [CorpPass](https://www.corppass.gov.sg/corppass/common/aboutus)
- (Singapore government agencies only) Automatic prefill of verified data with [MyInfo](https://www.singpass.gov.sg/myinfo/common/aboutus)
- Webhooks functionality via the official [FormSG JavaScript SDK](https://github.com/opengovsg/formsg-sdk) and contributor-supported [FormSG Ruby SDK] (https://github.com/opengovsg/formsg-ruby-sdk)

The current product roadmap includes:

- (in progress) Frontend rewrite from [AngularJS](https://angularjs.org/) to [React](https://reactjs.org/)
- Enabling payments on forms
- Electronic signatures
- Notifications to form admins for Storage mode submissions
- Integration with vault.gov.sg

## Local Development (Docker)

### Prerequisites

Install [docker and docker-compose](https://docs.docker.com/get-docker/).

### Running Locally

Run the following shell command to build the Docker image from scratch. This will usually take 10 or so minutes.

```bash
npm run dev
```

After the Docker image has finished building, the application can be accessed at [localhost:5000](localhost:5000).

If there are no dependency changes in `package.json` or changes in the
`src/app/server.ts` file, you can run

```bash
docker-compose up
```

which does **not** rebuild the Docker image from scratch. This command usually
only takes ~15 seconds to finish starting up the image.

### Accessing email locally

We use [MailDev](https://github.com/maildev/maildev) to access emails in the development environment. The MailDev UI can be accessed at [localhost:1080](localhost:1080) when the Docker container is running.

### Environment variables

Docker-compose looks at various places for environment variables to inject into the containers.
The following is the order of priority:

- Compose file
- Shell environment variables
- Environment file
- Dockerfile

FormSG requires some environment variables in order to function.
More information about the required environment variables can be seen in
[DEPLOYMENT_SETUP.md](/docs/DEPLOYMENT_SETUP.md).

We provide a [`.template-env`](./.template-env) file with the secrets blanked out. You can copy and
paste the variables described into a self-created `.env` file, replacing the
required values with your own.

### Trouble-shooting

You can consult [TROUBLESHOOTING.md](/docs/TROUBLESHOOTING.md) for common issues that developers face and how to resolve them.

## Testing

The docker environment has not been configured to run tests. Thus, you will need
to follow the following local build guide to get tests running locally.

### Testing Prerequisites

The team uses macOS for development.

Make you sure have the following node version & package manager on your machine:

- `"node": ">=14.17.0"`
- `"npm": ">=6.0.0"`
- `"mongo": ">=4.0.0"`

Run

```bash
nvm install 14
npm install
pip install "localstack[full]"
```

to install node modules and Localstack locally to be able to run tests. Note that
`localstack[full]` is only compatible with Python 3.7 and above.

### Running tests

#### Unit tests

```bash
npm run test
```

will build the backend and run both our backend and frontend unit tests. The tests are located at
[`tests/unit/frontend`](./tests/unit/frontend) and
[`tests/unit/backend`](./tests/unit/backend).

If the backend is already built, you can run

```bash
npm run test-ci
```

#### End-to-end tests

Removed in [#3146](https://github.com/opengovsg/FormSG/pull/3146). Will be reimplemented when the React app is ready.

## Architecture

An overview of the architecture can be found [here](docs/ARCHITECTURE.md).

## MongoDB Scripts

Scripts for common tasks in MongoDB can be found [here](docs/MONGODB.md).

## Contributing

We welcome all contributions, bug reports, bug fixes, documentation improvements, enhancements, and ideas to code open sourced by the Government Technology Agency of Singapore. Contributors should read [CONTRIBUTING.md](CONTRIBUTING.md) and will also be asked to sign a Contributor License Agreement (CLA) in order to ensure that everybody is free to use their contributions.

## Support

Please contact FormSG (formsg@tech.gov.sg) for any details.

## Acknowledgements

FormSG acknowledges the work done by [Arielle Baldwynn](https://github.com/whitef0x0) to build and maintain [TellForm](https://github.com/tellform), on which FormSG is based.

Contributions have also been made by:  
[@RyanAngJY](https://github.com/RyanAngJY)  
[@jeantanzy](https://github.com/jeantanzy)  
[@pregnantboy](https://github.com/pregnantboy)  
[@namnguyen08](https://github.com/namnguyen08)  
[@zioul123](https://github.com/zioul123)  
[@JoelWee](https://github.com/JoelWee)  
[@limli](https://github.com/limli)  
[@tankevan](https://github.com/tankevan)
