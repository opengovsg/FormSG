# FormSG

[![Build Status](https://travis-ci.com/opengovsg/formsg.svg?branch=release)](https://travis-ci.com/opengovsg/formsg)
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
- (beta) Webhooks functionality via the [FormSG JavaScript SDK](https://github.com/opengovsg/formsg-sdk).

The current product roadmap includes:

- (in progress) Migrating backend code from JavaScript to [TypeScript](https://www.typescriptlang.org/)
- (in progress) Refactoring backend code to use [Domain-driven Design](https://en.wikipedia.org/wiki/Domain-driven_design)
- (in progress) Migrating backend tests from [Jasmine](https://jasmine.github.io/) to [Jest](https://jestjs.io/) and expanding unit vs integration tests
- (yet to start) Support for webhooks attachments
- (yet to start) Frontend rewrite from [AngularJS](https://angularjs.org/) to [React](https://reactjs.org/)

## Local Development (Docker)

### Prerequisites

Install [docker and docker-compose](https://docs.docker.com/get-docker/).

### Running Locally

Run the following shell command to build the Docker image from scratch. This will usually take 10 or so minutes.

```bash
npm run dev
```

After the Docker image has finished building, the application can be accessed at [localhost:5000](localhost:5000).

If there have been no dependency changes in `package.json` or changes in the
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

The docker-compose file declares some blank environment variables that are secret and cannot be committed into
the repository. See below instructions to get them injected into the container.

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

- `"node": ">=12.18.0"`
- `"npm": ">=6.0.0"`
- `"mongo": ">=3.6.0"`

Run

```bash
nvm install 12.18.0
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

```bash
npm run test-e2e
```

will build both the frontend and backend then run our end-to-end tests. The tests are located at [`tests/end-to-end`](./tests/end-to-end). You will need to stop the Docker dev container to be able to run the end-to-end tests.

If you do not need to rebuild the frontend and backend, you can run

```bash
npm run test-e2e-ci
```

## Architecture

An overview of the architecture can be found [here](docs/ARCHITECTURE.md).

## MongoDB Scripts

Scripts for common tasks in MongoDB can be found [here](docs/MONGODB.md).

## Maintenance Banners

Banners providing form-fillers with useful information can shown at the top of
forms and configured using the environment variables below.

| Environment Variable     | Value will be shown as a banner at the bottom of                                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_BANNER_CONTENT`   | private form routes such as `/forms` and `/{formId}/admin`                                                                                                                         |
| `SITE_BANNER_CONTENT`    | both private routes that `ADMIN_BANNER_CONTENT` covers **and** public form routes that `IS_GENERAL_MAINTENANCE` covers. This supersedes **ALL** other banner environment variables |
| `IS_GENERAL_MAINTENANCE` | all public forms                                                                                                                                                                   |
| `IS_SP_MAINTENANCE`      | all public **SingPass-enabled** forms                                                                                                                                              |
| `IS_CP_MAINTENANCE`      | all public **CorpPass-enabled** forms                                                                                                                                              |

> Note that if more than one of the above environment variables are defined,
> only one environment variable will be used to display the given values.
>
> For public form routes, only one environment variable will be read in the
> following precedence: `SITE_BANNER_CONTENT` > `IS_GENERAL_MAINTENANCE` >
> `IS_SP_MAINTENANCE` > `IS_CP_MAINTENANCE`
>
> For private form routes, only one environment variable will be read in the
> following precendence: `SITE_BANNER_CONTENT` > `ADMIN_BANNER_CONTENT`

## Contributing

We welcome all contributions, bug reports, bug fixes, documentation improvements, enhancements, and ideas to code open sourced by the Government Technology Agency of Singapore. Contributors should read [CONTRIBUTING.md](CONTRIBUTING.md) and will also be asked to sign a Contributor License Agreement (CLA) in order to ensure that everybody is free to use their contributions.

## Support

Please contact FormSG (formsg@tech.gov.sg) for any details.

## Acknowledgements

FormSG acknowledges the work done by [Arielle Baldwynn](https://github.com/whitef0x0) to build and maintain [TellForm](https://github.com/tellform), on which FormSG is based.

Contributions have also been made by:  
[@RyanAngJY](https://github.com/RyanAngJY)  
[@jeantanzy](https://github.com/jeantanzy)  
[@yong-jie](https://github.com/yong-jie)  
[@pregnantboy](https://github.com/pregnantboy)  
[@namnguyen08](https://github.com/namnguyen08)  
[@zioul123](https://github.com/zioul123)  
[@JoelWee](https://github.com/JoelWee)  
[@limli](https://github.com/limli)  
[@tankevan](https://github.com/tankevan)  
[@LoneRifle](https://github.com/LoneRifle)
