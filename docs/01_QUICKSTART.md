# ⚡ Quickstart

This Quickstart helps you **get FormSG running locally** using Docker Compose.

## Prerequisites

Make sure you have:

- [Docker and docker-compose](https://docs.docker.com/get-docker/)
- Node.js (v18 LTS recommended, check `.nvmrc`)
- npm or pnpm
- (Recommended) [node version manager](https://github.com/nvm-sh/nvm)

> For detailed system requirements, see [deployment setup](./02_DEPLOYMENT_SETUP.md) and [configuration](./03_CONFIGURATION.md).


### First Setup

First, make sure to install and use the node version used by the project:

```bash
nvm install
nvm use
```

To install the relevant npm packages (frontend, backend and serverless modules), run the following in the root direcory:

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

### Accessing email locally

We use [MailDev](https://github.com/maildev/maildev) to access emails in the development environment. The MailDev UI can be accessed at [localhost:1080](localhost:1080) when the Docker container runs.

### Login using mockpass locally

1. Click on the `Login with Singpass` button on the login page
2. In the dropdown menu, select `S9812379B [MyInfo]`
3. Choose the profile with the email `lim_yong_xiang@was.gov.sg`
4. You should now be successfully logged in

**Note**: Remember to renew your formsg_mongodb_data volume

### Adding dependencies

Run `npm install` as per usual.

For backend, run

```
docker-compose up --build --renew-anon-volumes
```

which will rebuild the backend Docker image and not reuse the existing node_modules volume.

As frontend project is currently not using Docker, no other steps are required.

### Environment variables

Docker-compose looks at various places for environment variables to inject into the containers.
The following is the order of priority:

- Compose file
- Shell environment variables
- Environment file
- Dockerfile

FormSG requires some environment variables to function.
More information about the required environment variables are in
[CONFIGURATION.md](./03_CONFIGURATION.md).

We provide a [`.env.example`](./.env.example) file with the secrets blanked out. You can copy and
paste the variables described into a self-created `.env` file, replacing the
required values with your own.
