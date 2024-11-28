<p align="left">
  <a href="https://form.gov.sg"><img src="https://file.go.gov.sg/form-logo-background-rmved.png"></a>
</p>

---

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)
[![Build Status](https://github.com/opengovsg/FormSG/actions/workflows/deploy-eb.yml/badge.svg)](https://github.com/opengovsg/FormSG/actions/workflows/deploy-eb.yml)
[![Coverage Status](https://coveralls.io/repos/github/opengovsg/FormSG/badge.svg?branch=develop)](https://coveralls.io/github/opengovsg/FormSG?branch=develop)

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
  - [Migrating from MongoDB to FerretDB](#migrating-from-mongodb-to-ferretdb)
  - [Migrating from Mongoose ODM to Prisma ORM](#migrating-from-mongoose-odm-to-prisma-orm)
    - [Replacing MongoDB with CockroachDB](#replacing-mongodb-with-cockroachdb)
    - [Other Prisma supported DBs](#other-prisma-supported-dbs)
  - [Other potential DB migrations](#other-potential-db-migrations)
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

- React application can be accessed at [localhost:5173](localhost:5173)
- The backend API server can be accessed at [localhost:5001](localhost:5001)
- The development mail server can be accessed at [localhost:1080](localhost:1080)

### Adding dependencies

Run `npm install` as per usual.

For backend, run

```
docker-compose up --build --renew-anon-volumes
```

which will rebuild the backend Docker image and not reuse the existing node_modules volume.

As frontend project is currently not using Docker, no other steps are required.

### Accessing email locally

We use [MailDev](https://github.com/maildev/maildev) to access emails in the development environment. The MailDev UI can be accessed at [localhost:1080](localhost:1080) when the Docker container runs.

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
More information about the required environment variables are in
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

- `"node": ">=18.12.1"`
- `"npm": ">=8.19.2"`
- `"mongo": ">=4.0.0"`

Run

```bash
nvm install 18
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

If the backend is already built, you can run

```bash
npm run test-ci
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

The architecture overview is [here](docs/ARCHITECTURE.md).

## MongoDB Scripts

Scripts for common tasks in MongoDB can be found [here](docs/MONGODB.md).

## Support

Please contact FormSG (support@form.gov.sg) for any details.

## Database Alternatives

### Migrating from MongoDB to FerretDB
[FerretDB](https://ferretdb.io) is an open source MongoDB alternative built on PostgreSQL. MongoDB can be swapped out of FormSG for FerretDB. In order for this to be done, certain changes to the code should be made as described below:

- Add postgres to the list of services in the `docker.compose` file e.g. 
  ```  pg:
    image: postgres:15.3-alpine3.18
    environment:
      - POSTGRES_USER=<pguser>
      - POSTGRES_PASSWORD=<pgpassword>
      - POSTGRES_DB=<pgdbname>
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - '5432:5432'
- In the same file, change the "database" image from MongoDB to FerretDB and update the database section to include the lines below:
    ``` 
     image: ghcr.io/ferretdb/ferretdb:1.17.0
     environment:
       - FERRETDB_TELEMETRY=disable
       - FERRETDB_POSTGRESQL_URL=postgres://pg:5432/formsg?user=<pguser>&password=<pgpassword>
     ports:
       - '8080:8080'
     depends_on:
       - pg
- Lastly, add the *pgdata* volume
    ``` 
        volumes:
            mongodb_data:
                driver: local
            pgdata:
- FerretDB currently has some limitations and [certain database features are not supported](https://docs.ferretdb.io/reference/supported-commands/), these include TTL, database transactions and some aggregration pipelines which are all features used by FormSG. 

    The following changes can be made to mitigate the limitations of FerretDB:
    
    - Add the *autoRemove: 'interval'* property to the initializing of the session object in the `session.ts` file.
    - Remove the unsupported [aggregration pipeline stages](https://docs.ferretdb.io/reference/supported-commands/#aggregation-pipeline-stages) e.g. *lookup* and *project*, in the `submission.server.model.ts` file.
    - Replace the *findOneAndUpdate* code block in the `user.server.model.ts` file with code similar to the one below:
        ```  
         const user = await this.exists({ email: upsertParams.email })
         if (!user) {
          await this.create(upsertParams)
        }
        return this.findOne({
          email: upsertParams.email,
        }).populate({...
### Migrating from Mongoose ODM to Prisma ORM

FormSG uses Mongoose as the Object-Document Mapping (ODM) to MongoDB. This means that our code is strongly coupled with MongoDB as Mongoose solely supports it.

In order to use a different database with FormSG you will have to first migrate from Mongoose to other object modelling libraries. One of which is Prisma.

Prisma is an Object-Relational Mapping (ORM) library that can also be used as the object model for MongoDB. Prisma is compatible with various other relational databases like Cockroach DB.

Follow this [guide](https://www.prisma.io/docs/guides/migrate-to-prisma/migrate-from-mongoose#overview-of-the-migration-process) by Prisma to migrate from Mongoose.

The guide has 4 primary steps:

1. Install Prisma CLI
2. Introspect the current MongoDB for the data model
   1. For this section, Prisma’s introspection should be able to create prisma models that will replace your `server.model.ts` for each collection
   2. Additionally, as Prisma is relational, you could add relations between the various documents. One good relation to add will be `form` many to one `user` on the `[form.email](http://form.email)` field.
3. Install Prisma Client
4. Replace Mongoose Queries with Prisma Client
   1. This step will likely take the most refactoring efforts
   2. This will include most files in `formsg/src` ending with `service.ts`
   3. Including test files ending with `service.spec.ts`

#### Replacing MongoDB with CockroachDB

Thereafter, you could set up CockroachDB which is a distributed SQL DB. Follow the quick start guide by [CockroachDB](https://www.cockroachlabs.com/docs/cockroachcloud/quickstart) to create a CockroachDB Serverless cluster.

To replace the local development instance, you can follow this [guide](https://www.cockroachlabs.com/docs/stable/start-a-local-cluster-in-docker-mac). As FormSG uses Docker for local development, you will have to replace the `mongoDB` container from `docker-compose.yml` to the `cockroachDB` version.

Then connect to [CockroachDB](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/connect-your-database-typescript-postgresql) by changing the DB url in `.env` to the one from your CockroachDB `DATABASE_URL="YOUR_COCKROACH_DB_URL"`.

For local development, if the DB is replaced as above, you should not need to modify the ports as it will still be hosted on `localhost:27017`.

#### Other Prisma supported DBs

MongoDB can be replaced with other various relational databases supported by Prisma in this [list](https://www.prisma.io/docs/reference/database-reference/supported-databases).

### Other potential DB migrations

It is also possible to migrate from Mongoose to [Ottoman](https://ottomanjs.com/), which is another ODM.

The process will be simpler than migrating to Prisma, but Ottoman is more restrictive and can only be used together with Couchbase, which is also a noSQL DB like MongoDB.

Refer to this [guide](https://www.couchbase.com/blog/migrate-mongodb-mongoose-couchbase-ottoman/) to migrate from Mongoose to Ottoman and then replace MongoDB with Couchbase.

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
