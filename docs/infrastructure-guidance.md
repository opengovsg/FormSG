---
description: >-
  This document provides proven deployment patterns from FormSG production
  experience, simplified for government teams to adapt to their specific
  environments.
---

# ☁️ Infrastructure Guidance

## Infrastructure Templates

In the past,  the international team has created infrastructure-as-code templates to help accelerate FormSG deployments

<table data-card-size="large" data-view="cards"><thead><tr><th></th><th data-type="content-ref"></th><th></th></tr></thead><tbody><tr><td><strong>AWS CDK Template</strong></td><td><a href="https://github.com/opengovsg/formsg-on-cdk">https://github.com/opengovsg/formsg-on-cdk</a></td><td><ul><li><strong>Technology:</strong> AWS Cloud Development Kit (CDK)</li></ul><ul><li><strong>Best for:</strong> Teams already using CDK for infrastructure</li></ul><ul><li><strong>Status:</strong> May require updates for latest FormSG versions</li></ul><ul><li><strong>Use case:</strong> Reference implementation for AWS deployments</li></ul></td></tr><tr><td><strong>Fly.io Template</strong></td><td><a href="https://github.com/opengovsg/formsg-on-fly">https://github.com/opengovsg/formsg-on-fly</a></td><td><ul><li><strong>Technology:</strong> Fly.io platform deployment</li></ul><ul><li><strong>Best for:</strong> Teams wanting global edge deployment</li></ul><ul><li><strong>Status:</strong> May require updates for latest FormSG versions</li></ul><ul><li><strong>Use case:</strong> Alternative to traditional cloud providers</li></ul></td></tr></tbody></table>

{% hint style="warning" %}
**Important Note:** These templates were created for earlier versions of FormSG and **may require updates** to work with the latest release.&#x20;

They serve as excellent starting points and reference implementations, but should be reviewed and tested before production use.
{% endhint %}

## Important Notice

FormSG was architected for AWS and that's where we have production experience. While the architecture is cloud-agnostic in theory, we haven't tested other cloud deployments.

{% hint style="info" %}
Want to deploy to AWS directly? Go to [aws-production-deployment.md](aws-production-deployment.md "mention").
{% endhint %}

### What We Know

* ✅ The architecture uses standard patterns (containers, MongoDB, S3-compatible storage)
* ✅ Other governments have likely deployed on different clouds
* ⚠️ We can't provide tested instructions or guarantee success
* ⚠️ You'll be pioneering and should budget accordingly

### Migration Philosophy: Think in Patterns, Not Products

{% hint style="success" %}
Instead of thinking "_How do I replace AWS S3?_", think "_**How do I implement object storage?**_". This approach makes you cloud-agnostic and helps you leverage your existing infrastructure investments.
{% endhint %}

FormSG uses standard technologies (Docker, MongoDB, S3-compatible storage, SMTP) that exist on all major clouds. In theory, you can map:

* AWS ECS → Any container service
* AWS S3 → Any object storage with S3 API
* MongoDB Atlas → Any MongoDB-compatible database
* AWS SES → Any SMTP service

In practice, each replacement will have subtle differences that require debugging. You are of course free to change the code to accommodate different use cases (example: change MongoDB-compatible code to another DB).

### Migration Phases and Validation

{% stepper %}
{% step %}
#### Phase 1: Infrastructure Foundation

**Objective**: Establish core infrastructure components

**Activities**:

* Set up container orchestration platform
* Deploy object storage solution
* Configure networking and load balancing
* Establish monitoring and logging

**Validation**:

* [ ] Container platform can run Docker images
* [ ] Object storage passes S3 compatibility tests
* [ ] Load balancer routes traffic correctly
* [ ] Basic monitoring collects metrics
{% endstep %}

{% step %}
#### Phase 2: Data Services

**Objective**: Migrate database and configure data persistence

**Activities**:

* Deploy MongoDB-compatible database
* Configure connection strings and authentication
* Set up backup and disaster recovery
* Test data migration procedures

**Validation**:

* [ ] Database accepts MongoDB connections
* [ ] Application can read/write form data
* [ ] Backup and restore procedures work
* [ ] Performance meets requirements
{% endstep %}

{% step %}
#### Phase 3: Application Services

**Objective**: Configure external service integrations

**Activities**:

* Configure email service integration
* Set up SMS service (if required)
* Configure identity provider integration
* Test all communication channels

**Validation**:

* [ ] Admin login OTPs delivered via email
* [ ] Form submissions trigger notifications
* [ ] Identity authentication works
* [ ] All integrations handle errors gracefully
{% endstep %}

{% step %}
#### Phase 4: Security and Compliance

**Objective**: Implement security controls and validate compliance

**Activities**:

* Configure TLS/SSL certificates
* Implement access controls and secrets management
* Set up security monitoring and alerting
* Conduct security testing

**Validation**:

* [ ] All traffic encrypted in transit
* [ ] Secrets properly managed and rotated
* [ ] Access controls enforced
* [ ] Security monitoring operational
{% endstep %}
{% endstepper %}

{% hint style="info" %}
Your actual timeline will likely be longer due to platform-specific debugging.
{% endhint %}

## Infrastructure Patterns

Instead, in this section we will talk about **conceptual infrastructure patterns**, not deployable templates. The patterns show FormSG's infrastructure requirements in a cloud-agnostic way that you can adapt to your specific tools and environments.

**What these patterns are:**

* Infrastructure requirements and relationships
* Configuration concepts for any cloud provider
* Starting points for your Infrastructure-as-Code tools

**What these patterns are NOT:**

* Ready-to-deploy CloudFormation/Terraform/Pulumi code
* Specific vendor implementations
* Production-ready configurations

{% hint style="success" %}
**💡 Key Principle**: Use these patterns to understand FormSG's infrastructure needs, then implement using your organization's preferred tools (CloudFormation, Terraform, Pulumi, etc.).
{% endhint %}

### Core Deployment Patterns

#### Container Service Pattern

**What it does**: Runs FormSG application with auto-scaling and health monitoring

**Key components**:

* Container with health checks
* Auto-scaling based on CPU/memory utilization
* Environment variables from secure configuration store
* Load balancer for high availability

**Pattern Example:** _Note: This is a conceptual pattern showing requirements, not deployable code_

```yaml
# Conceptual Pattern - Adapt to your infrastructure tools
service_name: formsg
container_image: your-registry/formsg:latest
port: 5000
health_check_path: /api/v3/admin/forms
environment_variables:
  NODE_ENV: production
  DB_HOST: ${database_connection_string}
  SESSION_SECRET: ${secure_session_secret}
scaling:
  min_instances: 2
  max_instances: 10
  cpu_threshold: 70%
```

**Adapt for your environment**:

* Change container registry to your organization's registry
* Adjust scaling parameters based on expected load
* Configure environment variables in your secrets management system
* Set up monitoring alerts for your operations team

***

#### Storage and Database Pattern

**What it does**: Provides secure, scalable storage for forms, attachments, and application data

**Key components**:

* Document database (MongoDB-compatible)
* Object storage (S3-compatible) for file uploads
* Session store for user authentication
* Backup and disaster recovery procedures

**Pattern Example:** _Note: This is a conceptual pattern showing requirements, not deployable code_

```yaml
# Conceptual Pattern - Adapt to your infrastructure tools
database:
  type: mongodb_compatible
  connection: mongodb://user:pass@cluster/formsg
  features_required:
    - transactions
    - ttl_indexes
    - aggregation_pipelines

# Object storage pattern  
storage:
  type: s3_compatible
  buckets:
    attachments: formsg-attachments-prod
    images: formsg-images-prod
    static_assets: formsg-static-prod
  features_required:
    - presigned_urls
    - lifecycle_policies
    - server_side_encryption

# Session storage pattern
sessions:
  type: redis_compatible  # or database-backed
  ttl: 86400  # 24 hours
  encryption: true
```

**Adapt for your environment**:

* Choose managed database service vs. self-hosted based on your policies
* Configure bucket names according to your naming conventions
* Set up backup procedures according to your retention requirements
* Implement encryption standards required by your compliance framework

***

#### Load Balancing and Networking Pattern

**What it does**: Securely exposes FormSG to users while protecting backend services

**Key components**:

* TLS termination with government-approved certificates
* Web Application Firewall (WAF) for security
* Network segmentation between public and private resources
* DDoS protection and rate limiting

**Pattern Example:** _Note: This is a conceptual pattern showing requirements, not deployable code_

```yaml
# Conceptual Pattern - Adapt to your infrastructure tools
load_balancer:
  type: application_load_balancer
  listeners:
    - port: 443
      protocol: HTTPS
      certificate: your-gov-domain-cert
    - port: 80
      protocol: HTTP
      action: redirect_to_https
  
# Network security pattern
networking:
  public_subnets:
    - load_balancer
  private_subnets:
    - application_containers
    - database
  security_groups:
    lb_to_app: port_5000_only
    app_to_db: port_27017_only
```

**Adapt for your environment**:

* Use certificates from your organization's certificate authority
* Configure WAF rules based on your security requirements
* Adjust network segmentation for your compliance needs
* Set up monitoring and alerting for your security operations center

***

#### Monitoring and Logging Pattern

**What it does**: Provides visibility into application performance, security events, and operational health

**Key components**:

* Application performance monitoring
* Security event logging and alerting
* Infrastructure metrics collection
* Centralized log aggregation

**Pattern Example:** _Note: This is a conceptual pattern showing requirements, not deployable code_

```yaml
# Conceptual Pattern - Adapt to your infrastructure tools
monitoring:
  metrics:
    - container_cpu_usage
    - container_memory_usage
    - application_response_time
    - database_connections
    - failed_authentications
  
  alerts:
    - high_cpu: "> 80% for 5 minutes"
    - high_error_rate: "> 5% for 2 minutes"
    - failed_health_checks: "> 2 in 1 minute"
  
  logs:
    - application_logs
    - access_logs  
    - security_events
    - audit_trail
```

**Adapt for your environment**:

* Integrate with your existing monitoring infrastructure
* Configure alerts to go to your operations team
* Set up log retention according to your compliance requirements
* Implement audit logging as required by your security policies

### Reference Implementations

[Docker Compose for Development](https://github.com/opengovsg/FormSG/blob/develop/docker-compose.yml)

**Use case**: Local development, proof of concept, small-scale testing. Then

```bash
docker-compose up -d
```

***

### Community Contributions Welcome

If you successfully deploy on GCP/Azure/on-premise, please consider sharing your experience to help others =)!

{% hint style="success" %}
**💡 Success Tip**: Start with a development environment to validate each component before migrating production workloads. This approach reduces risk and helps identify integration issues early.
{% endhint %}
