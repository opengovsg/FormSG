---
description: >-
  This quickstart guide helps you get FormSG running locally using Docker
  Compose for development and testing purposes.
---

# ⚡ Quickstart

## Prerequisites

Make sure you have:

* [Docker and docker-compose](https://docs.docker.com/get-docker/)
* Node.js (v22 LTS recommended, check `.nvmrc`)
* npm or pnpm
* (Recommended) [node version manager](https://github.com/nvm-sh/nvm)

#### Get the FormSG Code

Clone the FormSG repository to get started:

```bash
git clone https://github.com/opengovsg/FormSG.git
cd FormSG
```

#### First Setup

First, make sure to install and use the node version used by the project:

```bash
nvm install
nvm use
```

To install the relevant npm packages (frontend, backend and serverless modules), run the following in the root directory:

```bash
npm install && npm --prefix serverless/virus-scanner install
```

#### Environment Configuration

FormSG includes a comprehensive `.env.example` file with all available configuration options:

```bash
# Copy the example file and customize for your environment
cp .env.example .env

# The .env file contains essential variables like:
# - Database connection settings
# - Email service configuration
# - Session security settings
# - AWS/storage service settings
```

For development, the default values in `.env.example` work with the included Docker Compose setup. For production deployment, see the Configuration Reference for complete variable documentation.

If you are on Mac OS X, you may want to allow Docker to use more RAM (minimum of 4GB) by clicking on the Docker icon on the toolbar, clicking on the "Preferences" menu item, then clicking on the "Resources" link on the left.

#### Running Locally

First, build the frontend for local development:

```bash
npm run build:frontend
```

Run the following shell commands to build the Docker image. The first time will usually take 10 or so minutes. These commands runs the backend services specified under docker-compose.yml and the React frontend on the native host.

```bash
npm run dev
```

## Accessing FormSG

After the Docker image has finished building, the following local applications can be accessed:

* React application can be accessed at [localhost:5173](https://localhost:5173)
* The backend API server can be accessed at [localhost:5001](https://localhost:5001)
* The development mail server can be accessed at [localhost:1080](https://localhost:1080)

### Accessing email locally

We use [MailDev](https://github.com/maildev/maildev) to access emails in the development environment. The MailDev UI can be accessed at [localhost:1080](https://localhost:1080) when the Docker container runs. You can login via OTP and the would be received on the MailDev dashboard.

### Login using mockpass locally

1. Click on the `Login with Singpass` button on the login page
2. In the dropdown menu, select `S9812379B [MyInfo]`
3. Choose the profile with the email `lim_yong_xiang@was.gov.sg`
4. You should now be successfully logged in

**Note**: Remember to renew your formsg\_mongodb\_data volume

### Adding dependencies

Run `npm install` as per usual.

For backend, run

```
docker-compose up --build --renew-anon-volumes
```

which will rebuild the backend Docker image and not reuse the existing node\_modules volume.

As frontend project is currently not using Docker, no other steps are required.

#### Environment Variable Priority

Docker-compose looks at various places for environment variables in this order of priority:

1. Compose file
2. Shell environment variables
3. Environment file (`.env`)
4. Dockerfile

The `.env` file you created from `.env.example` will provide the default configuration for local development. For production deployments, you'll need to customize these values according to your infrastructure and security requirements.

For complete documentation of all available environment variables, see the [configuration-reference.md](configuration-reference.md "mention").



## ⚠️ CRITICAL: Remove Singapore Branding (REQUIRED)

Before going live to production with FormSG, you must remove Singapore Government branding to avoid legal issues. See [legal-and-compliance.md](legal-and-compliance.md "mention")

## Developer Tools & Resources

Navigating FormSG's codebase becomes much easier with the right tools. Besides this accompanying guide, here are recommended tools for different scenarios

<table data-view="cards" data-full-width="false"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><strong>🔍 Codebase Exploration</strong></td><td><p><a href="https://deepwiki.com/opengovsg/FormSG"><strong>Deepwiki</strong></a> (Web-based) </p><ul><li><strong>Best for:</strong> Quick exploration without cloning</li><li><strong>How:</strong> Visit deepwiki.com, paste FormSG's GitHub URL</li><li><strong>Use cases:</strong> Understanding architecture, finding implementation details<br></li></ul><p><a href="https://repomix.com/"><strong>Repomix</strong></a> (CLI)</p><ul><li><strong>Best for:</strong> Creating codebase summaries for AI assistants</li><li><strong>How:</strong> <code>npx repomix</code> in the FormSG directory</li><li><strong>Use cases:</strong> Generating context for Claude, ChatGPT, or other LLMs</li></ul></td></tr><tr><td><strong>💻 Development</strong></td><td><p><a href="https://cursor.com/en"><strong>Cursor</strong></a></p><ul><li><strong>Best for:</strong> AI-native development with codebase awareness</li><li><strong>How:</strong> Open FormSG folder in Cursor, index the codebase</li><li><strong>Use cases:</strong> Writing new features, refactoring with context</li></ul><p><strong>Editor of choice +</strong> <a href="https://github.com/features/copilot"><strong>Copilot</strong></a></p><ul><li><strong>Best for:</strong> In-line code suggestions while developing</li><li><strong>How:</strong> Install VS Code extension, work in FormSG repo</li><li><strong>Use cases:</strong> Autocomplete, following existing patterns</li></ul></td></tr><tr><td><strong>📚 When to Use Each</strong></td><td><ul><li><strong>Starting out?</strong><br>Use Deepwiki to understand the architecture</li></ul><ul><li><strong>Making changes?</strong> Use Cursor or Copilot for context-aware coding</li><li><strong>Debugging?</strong> Use Repomix to share context with AI assistants</li><li><strong>Customizing components?</strong> Combine tools - explore with Deepwiki, implement with Cursor</li></ul></td></tr></tbody></table>

Use the aforementioned tools with this guide to help you along the way!
