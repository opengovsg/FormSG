---
description: This guide helps you deploy and maintain FormSG in your own infrastructure.
---

# 📋 FormSG

## Welcome to the FormSG Self-Hosting Guide

[![FormSG logo](https://file.go.gov.sg/form-logo-background-rmved.png)](https://form.gov.sg)

**Join government teams worldwide who've successfully self-hosted FormSG** to:

* **Maintain complete data sovereignty** within your jurisdiction
* **Integrate with existing government systems** and identity providers
* **Meet specific compliance requirements** for your regulatory environment
* **Reduce vendor lock-in** while keeping operational control

Whether you're:

* A government agency evaluating digital form solutions
* A public sector IT team planning your deployment strategy
* A developer customizing FormSG for your specific needs

...this guide aim to assist your path from evaluation to production.

#### 📖 Documentation Sources

* [**GitBook**](https://ogp-international.gitbook.io/ogp-international-hub/self-hosting/formsg) - Complete, currently developed, self-hosting guide
* [**FormSG GitHub Repository**](https://github.com/opengovsg/FormSG) - Source code and development resources

{% hint style="info" %}
**📖 Documentation Note**: While the repository contains a 'docs' folder, always refer to the [GitBook](https://ogp-international.gitbook.io/ogp-international-hub/self-hosting/formsg) for the most current self-hosting guidance. We plan to sync GitBook content to the repository periodically as snapshots, but currently the repository docs are not actively updated.
{% endhint %}

<details>

<summary><strong>What is FormSG?</strong></summary>

FormSG is a self-service, easy-to-use and feature rich form builder that enables public officers to collect citizen data quickly and securely.

Since launching in September 2017, FormSG has replaced almost 200 million paper form submissions and is used by over 160 public agencies. More than 150 thousand public officers are users of FormSG today.

This is **not** the end-user manual. For guides on creating, managing, and using forms, visit this user guide: [https://guide.form.gov.sg/](https://guide.form.gov.sg/).

</details>

## :anchor: Choose Your Starting Point

This guide **assumes you (or your team) have a reasonable level of technical aptitude**. Specifically, experience with:

* Basic Linux server administration
* Docker or container orchestration
* Managing environment variables and secrets
* Working with Node.js applications

{% hint style="warning" %}
While we have aimed to make this guide as clear and complete as possible, it is **not an all-encompassing tutorial** for **every possible environment or level of expertise**.

Civic tech teams have different practices, infrastructure, and skillsets. You are expected to adapt instructions as needed for your own context.
{% endhint %}

<table data-view="cards"><thead><tr><th></th><th></th><th data-type="content-ref"></th><th></th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td>🎯 Decision Maker</td><td><em>"Should my organization adopt FormSG?"</em></td><td><a href="evaluation-guide.md">evaluation-guide.md</a></td><td>Get frameworks for cost-benefit analysis, risk assessment, and go/no-go decisions. Includes technical feasibility assessment and other considerations.</td><td></td></tr><tr><td>👨‍💻 Developer</td><td><em>"I want to try FormSG locally first"</em></td><td><a href="quickstart.md">quickstart.md</a></td><td>Get a local development environment running in 30 minutes to test FormSG's capabilities and understand the architecture hands-on.</td><td></td></tr><tr><td>🏗️ Mature Team</td><td><em>"We want to deploy to production"</em></td><td><a href="aws-production-deployment.md">aws-production-deployment.md</a></td><td>Step-by-step AWS production deployment with security hardening, monitoring, and validation procedures.</td><td></td></tr><tr><td><span data-gb-custom-inline data-tag="emoji" data-code="2601">☁️</span> Cloud Migration</td><td><em>"AWS may not be for us"</em></td><td><a href="infrastructure-guidance.md">infrastructure-guidance.md</a></td><td>A starting guide for migrating away from AWS.</td><td></td></tr><tr><td>🔧 Platform Engineering Team</td><td><em>"We need to integrate with existing systems"</em></td><td><a href="component-customization.md">component-customization.md</a></td><td>Replace email, storage, identity providers, and other components with your organization's preferred alternatives.</td><td></td></tr><tr><td><span data-gb-custom-inline data-tag="emoji" data-code="2696">⚖️</span> Compliance Officer</td><td><em>"Is it okay to use FormSG?"</em></td><td><a href="legal-and-compliance.md">legal-and-compliance.md</a></td><td>Covers legal and compliance requirements you must follow when forking FormSG.</td><td></td></tr></tbody></table>

{% hint style="success" %}
**📖** This guide is organized as a journey from evaluation through advanced deployment, with comprehensive reference materials.&#x20;

Each section builds upon previous concepts while remaining modular for experienced teams who want to jump ahead.
{% endhint %}
