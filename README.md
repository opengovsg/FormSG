<p align="left">
  <a href="https://form.gov.sg"><img src="https://file.go.gov.sg/form-logo-background-rmved.png"></a>
</p>

---

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)
[![Build Status](https://github.com/opengovsg/FormSG/actions/workflows/deploy-eb.yml/badge.svg)](https://github.com/opengovsg/FormSG/actions/workflows/deploy-eb.yml)
[![Coverage Status](https://coveralls.io/repos/github/opengovsg/FormSG/badge.svg?branch=develop)](https://coveralls.io/github/opengovsg/FormSG?branch=develop)

## 📚 Documentation

For comprehensive self-hosting guides, configuration references, and deployment instructions, visit our **[FormSG Self-Hosting Guide](https://ogp-international.gitbook.io/ogp-international-hub/self-hosting/formsg)**.

The GitBook documentation is actively maintained and provides:
- Deployment guides for AWS and other platforms
- Configuration reference for all environment variables
- Component customization guides
- Legal and compliance requirements
- Evaluation frameworks for decision makers

## Table of Contents

- [Contributing](#contributing)
    - [IMPORTANT NOTE TO ALL CONTRIBUTORS](#important-note-to-all-contributors)
- [Features](#features)
- [Local Development (Docker)](#local-development-docker)
  - [Prerequisites](#prerequisites)
  - [First Setup](#first-setup)
  - [Running Locally](#running-locally)
  - [Adding dependencies](#adding-dependencies)
  - [Accessing email locally](#accessing-email-locally)
  - [Login using mockpass locally](#login-using-mockpass-locally)
  - [Environment variables](#environment-variables)
  - [Trouble-shooting](#trouble-shooting)
- [Testing](#testing)
  - [Testing Prerequisites](#testing-prerequisites)
  - [Running tests](#running-tests)
    - [Unit tests](#unit-tests)
    - [End-to-end tests](#end-to-end-tests)
    - [Cross-browser testing](#cross-browser-testing)
- [Architecture](#architecture)
- [MongoDB Scripts](#mongodb-scripts)
- [Support](#support)
- [Database Alternatives](#database-alternatives)
- [Acknowledgements](#acknowledgements)

## Contributing

We welcome all contributions, bug reports, bug fixes, documentation improvements, enhancements, and ideas to code open sourced by the Government Technology Agency of Singapore. Contributors will also be asked to sign a Contributor License Agreement (CLA) to ensure that everybody is free to use their contributions.

#### IMPORTANT NOTE TO ALL CONTRIBUTORS

Before contributing, please read [CONTRIBUTING.md](CONTRIBUTING.md). In particular, we strongly encourage contributors to please **first discuss the change you wish to make via GitHub issue**, [email](mailto:contribute@form.gov.sg), or any other method with the repository owners beforehand. Otherwise, we may not be able to review or accept your PR.

## Features

FormSG is a form builder application built, open sourced and maintained by the [Open Government Products](https://open.gov.sg) team of the Singapore [Government Technology Agency](https://tech.gov.sg) to digitise paper processes.

Notable features include:

- 19 different form field types, including attachments, tables, email and mobile
- Verified email and mobile phone fields via integrations with Twilio and AWS SES
- Automatic emailing of submissions for forms built with Email Mode
- Encryption for data collected on forms built with Storage Mode
- (Singapore government agencies only) Citizen authentication with [SingPass](https://www.singpass.gov.sg/singpass/common/aboutus)
- (Singapore government agencies only) Citizen authentication with [sgID](https://www.id.gov.sg/)
- (Singapore government agencies only) Corporate authentication with [CorpPass](https://www.corppass.gov.sg/corppass/common/aboutus)
- (Singapore government agencies only) Automatic prefill of verified data with [MyInfo](https://www.singpass.gov.sg/myinfo/common/aboutus)
- Webhooks functionality via the official [FormSG JavaScript SDK](https://github.com/opengovsg/formsg-sdk) and contributor-supported [FormSG Ruby SDK](https://github.com/opengovsg/formsg-ruby-sdk)
- Variable amount and Itemised payments on forms with [stripe](https://stripe.com) integration

## Local Development (Docker)

### Prerequisites

Install [docker and docker-compose](https://docs.docker.com/get-docker/) and the [node version manager](https://github.com/nvm-sh/nvm).

### First Setup

First, make sure to install and use the node version used by the project:

```bash
nvm install
nvm use
```

To install the relevant npm packages (frontend, backend and virus-scanner), run the following in the root direcory:

```bash
npm install && npm --prefix serverless/virus-scanner install
```

If you are on Mac OS X, you may want to allow Docker to use more RAM (minimum of 4GB) by clicking on the Docker icon on the toolbar, clicking on the "Preferences" menu item, then clicking on the "Resources" link on the left.

### Running Locally

First, build the frontend for local development:

```bash
npm run build:frontend
```

Run the following shell commands to build the Docker image. The first time will usually take 10 or so minutes. These commands runs the backend services specified under [docker-compose.yml](docker-compose.yml) and the React frontend on the native host.

```bash
npm run dev
```

After the Docker image has finished building, the following local applications can be accessed:

- React application can be accessed at [http://localhost:5173](http://localhost:5173)
- The backend API server can be accessed at [http://localhost:5001](http://localhost:5001)
- The development mail server can be accessed at [http://localhost:1080](http://localhost:1080)

### Adding dependencies

Run `npm install` as per usual.

For backend, run

```
docker-compose up --build --renew-anon-volumes
```

which will rebuild the backend Docker image and not reuse the existing node_modules volume.

As frontend project is currently not using Docker, no other steps are required.

### Accessing email locally

We use [MailDev](https://github.com/maildev/maildev) to access emails in the development environment. The MailDev UI can be accessed at [http://localhost:1080](http://localhost:1080) when the Docker container runs.

### Login using mockpass locally

1. Click on the `Login with Singpass` button on the login page
2. In the dropdown menu, select `S9812379B [MyInfo]`
3. Choose the profile with the email `lim_yong_xiang@was.gov.sg`
4. You should now be successfully logged in

**Note**: Remember to renew your formsg_mongodb_data volume

### Environment variables

Docker-compose looks at various places for environment variables to inject into the containers.
The following is the order of priority:

- Compose file
- Shell environment variables
- Environment file
- Dockerfile

FormSG requires some environment variables to function.
More information about the required environment variables are in the
[Configuration Reference](docs/configuration-reference.md).

We provide a [`.env.example`](./.env.example) file with the secrets blanked out. You can copy and
paste the variables described into a self-created `.env` file, replacing the
required values with your own.

### Trouble-shooting

For troubleshooting common development issues, refer to the [Self-Hosting Guide](https://ogp-international.gitbook.io/ogp-international-hub/self-hosting/formsg) or create an issue in the repository.

## Testing

The docker environment has not been configured to run tests. Thus, you will need
to follow the following local build guide to get tests running locally.

### Testing Prerequisites

The team uses macOS for development.

Make you sure have the following node version & package manager on your machine:

- `"node": ">=18"` (v18.20.2 as specified in .nvmrc)
- `"npm": ">=8"`
- Python 3.7+ (for LocalStack)

Run

```bash
nvm install
nvm use
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

will build the backend and run our backend unit tests. The tests are located at [`__tests__/unit/backend`](./__tests__/unit/backend).

For CI testing (optimized for continuous integration), you can run

```bash
npm run test:backend:ci
```

Frontend tests are located at [`frontend/__tests__`](./frontend/__tests__). They can be run with

```bash
npm run test:frontend
```

#### End-to-end tests

```bash
npm run test:e2e-v2
```

will build both the frontend and backend then run our end-to-end tests. The tests are located at [`__tests__/e2e`](./__tests__/e2e). You will need to stop the Docker dev container to be able to run the end-to-end tests.

If you do not need to rebuild the frontend and backend, you can run

```bash
npx playwright test
```

#### Cross-browser testing

This project is tested with [BrowserStack](https://www.browserstack.com/open-source).

## Architecture

The architecture overview is available in the [Self-Hosting Guide](https://ogp-international.gitbook.io/ogp-international-hub/self-hosting/formsg).

## Support

Please contact FormSG (support@form.gov.sg) for any details.

## Database Alternatives

FormSG uses MongoDB with Mongoose ODM. While the application can potentially be adapted to work with other databases, this requires significant code changes and is not officially supported.

For detailed guidance on database migration options (including FerretDB, Prisma ORM, CockroachDB, and other alternatives), refer to the [Self-Hosting Guide](https://ogp-international.gitbook.io/ogp-international-hub/self-hosting/formsg).

**Note**: Database migrations involve complex changes to the codebase and may require ongoing maintenance. Consider the trade-offs carefully before proceeding.

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
