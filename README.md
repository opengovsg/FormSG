**Table of Contents**

- [FormSG](#formsg)
  - [Local Development (Docker)](#local-development-docker)
    - [Prerequisites](#prerequisites)
    - [Running Locally](#running-locally)
    - [Environment variables](#environment-variables)
  - [Testing](#testing)
    - [Prerequisites](#prerequisites-1)
    - [Running tests](#running-tests)
  - [Architecture](#architecture)
  - [MongoDB Scripts](#mongodb-scripts)
  - [Maintenance Banners](#maintenance-banners)
  - [Contributing](#contributing)
  - [Support](#support)

# FormSG

master: [![Build Status](https://travis-ci.com/datagovsg/formsg.svg?token=3iDBzqD5prSEyiedYGYi&branch=master)](https://travis-ci.com/datagovsg/formsg) release: [![Build Status](https://travis-ci.com/datagovsg/formsg.svg?token=3iDBzqD5prSEyiedYGYi&branch=release)](https://travis-ci.com/datagovsg/formsg)

## Local Development (Docker)

### Prerequisites

Install [docker and docker-compose](https://docs.docker.com/get-docker/).

### Running Locally

Run

```
npm run dev
```

to build the Docker image from scratch. This will usually take 10 or so minutes.

If there have been no dependency changes in `package.json` or changes in the
root `server.js` file, you can run

```
docker-compose up
```

which does **not** rebuild the Docker image from scratch. This command usually
only takes ~15 seconds to finish starting up the image.

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

## Testing

The docker environment has not been configured to run tests. Thus, you will need
to follow the following local build guide to get tests running locally.

### Prerequisites

The team uses macOS for development.

Make you sure have the following node version & package manager on your machine:

- `"node": ">=12.18.0"`
- `"npm": ">=6.0.0"`
- `"mongo": ">=3.6.0"`

Run

```
nvm install 12.18.0
npm install
pip install "localstack[full]"
```

to install node modules and Localstack locally to be able to run tests. Note that
`localstack[full]` is only compatible with Python 3.7 and above.

### Running tests

#### Unit tests

```
npm run test
```

will build the backend and run both our backend and frontend unit tests. The tests are located at
[`tests/unit/frontend`](./tests/unit/frontend) and
[`tests/unit/backend`](./tests/unit/backend).

If the backend is already built, you can run

```
npm run test-ci
```

#### End-to-end tests

```
npm run test-e2e
```

will build both the frontend and backend then run our end-to-end tests. The tests are located at [`tests/end-to-end`](./tests/end-to-end). You will need to stop the Docker dev container to be able to run the end-to-end tests.

If you do not need to rebuild the frontend and backend, you can run

```
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

We welcome contributions to code open sourced by the Government Technology Agency of Singapore. All contributors will be asked to sign a Contributor License Agreement (CLA) in order to ensure that everybody is free to use their contributions.

## Support

Please contact FormSG (formsg@data.gov.sg) for any details.
