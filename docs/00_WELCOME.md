# Welcome to the FormSG Self-Hosting Guide

<p align="left">
  <a href="https://form.gov.sg">
    <img src="https://file.go.gov.sg/form-logo-background-rmved.png" alt="FormSG logo" width="200">
  </a>
</p>

This guide helps you deploy and maintain **FormSG** in your own infrastructure.

Whether you're:
- A government agency evaluating FormSG for adoption,
- A civic tech team building secure form workflows, or
- An engineering team exploring our architecture,

...this documentation will guide you through the entire process.

## What You'll Find Here

- **Quickstart:** Get a local or cloud instance running fast.
- **Deployment Options:** Choose Docker Compose or ECS.
- **Configuration:** Understand all environment variables and secrets.
- **Modularity:** Swap out components (e.g., S3, Singpass, Stripe).
- **Troubleshooting:** Common errors and how to fix them.
- **Build Your Own Infra (BYOI):** Recreate our architecture without AWS or vendor-tied integrations.

## What This Is Not

This is **not** the end-user manual. For guides on creating and managing forms, visit:

👉 [User Guide](https://guide.form.gov.sg)

## Technical Skill Assumptions

This guide **assumes you (or your team) have a reasonable level of technical aptitude**. Specifically, experience with:
- Basic Linux server administration
- Docker or container orchestration
- Managing environment variables and secrets
- Working with Node.js applications

> **Note:**
>
> While we have aimed to make this guide as clear and complete as possible, it is **not an all-encompassing tutorial** for every possible environment or level of expertise.
>
> Civic tech teams have different practices, infrastructure, and skillsets. You are expected to adapt instructions as needed for your own context.


## ✨ Features Overview

FormSG supports:
- 19 field types (attachments, tables, email, mobile)
- Verified email and SMS (Twilio, AWS SES)
- Encrypted submissions in Storage Mode
- Citizen and corporate authentication (SingPass, sgID, CorpPass)
- MyInfo data prefill
- Stripe payments
- Webhooks and SDK integrations

## Supported Deployment Environments

FormSG is intended to be deployed on an AWS environment
- AWS EBS and ECS (reference setup)

But we also give light guidance on
- Other cloud providers
- On-premise Docker
- Airgapped or regulated environments

For more, see [build your own infra](./05_BYOI.md) section.

---

> If you're new here, start with [Quickstart](./01_QUICKSTART.md).

