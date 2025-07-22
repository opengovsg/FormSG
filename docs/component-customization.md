# 🧩 Component Customization

This guide helps you **replace specific FormSG components** with your preferred alternatives while maintaining security and functionality. Perfect for teams wanting to integrate FormSG with existing infrastructure or reduce cloud provider dependencies.

### Component Architecture

Before customizing components, understand how FormSG's architecture connects:

{% columns fullWidth="true" %}
{% column width="58.333333333333336%" %}
```mermaid
graph TB
    subgraph "Government Users"
        Citizens[👥 Citizens]
        Staff[👨‍💼 Government Staff]
    end

    subgraph Services
        Email[📧 Email Service<br/>🟢 Easy to Replace]
        SMS[📱 SMS Service<br/>🟡 Medium to Replace]
        Identity[🏛️ Identity Provider<br/>🟡 Medium to Replace]
        Payment[💳 Payment Service<br/>🔴 Hard to Replace]
        Scanning[🛡️ Virus Scanning<br/>🔴 Hard to Replace]
    end

    subgraph FormSG-Core
        Frontend[🖥️ React Frontend<br/>Form Builder & Public Views]
        API[⚙️ Express API<br/>Business Logic Hub]
    end

     subgraph Infrastructure
        DB[(📊 Database<br/>MongoDB-Compatible)]
        Storage[(📦 Object Storage<br/>S3-Compatible)]
        Container[🐳 Container Platform<br/>Docker/ECS]
    end


    %% User flows
    Citizens --> Frontend
    Staff --> Frontend

    %% Core connections
    Frontend --> API


    %% Infrastructure and service connections
    API --> Infrastructure
    API --> Services

    %% Styling
    classDef users fill:#f8f9fa,stroke:#6c757d,stroke-width:2px
    classDef core fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef infrastructure fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef easy fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef medium fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef hard fill:#ffebee,stroke:#f44336,stroke-width:2px

    class Citizens,Staff users
    class Frontend,API,Auth core
    class DB,Storage,Container infrastructure
    class Email easy
    class SMS,Identity medium
    class Payment,Scanning hard
```


{% endcolumn %}

{% column %}
### Why Customize?

Teams often need to adapt FormSG for:

* **🏛️ Existing Infrastructure**: Integrate with current systems and contracts
* **🌍 Data Sovereignty**: Keep data within your jurisdiction
* **💰 Cost Optimization**: Leverage existing volume discounts
* **🔒 Compliance**: Meet specific regulatory requirements
* **🔧 Operational Consistency**: Use familiar tools and processes

**The good news**: FormSG's modular design makes selective replacement possible.

\
**Customization Impact Zones:**

* **🟢 Low Impact** - External services with standard interfaces
* **🟡 Medium Impact** - Integration complexity but well-documented patterns
* **🔴 High Impact** - Deep integration requiring significant development
{% endcolumn %}
{% endcolumns %}

### Default Services and Alternatives

Understanding **what FormSG uses by default** and your replacement options helps with procurement and planning:

<table data-full-width="false"><thead><tr><th width="193.73828125">Component</th><th>Default Implementation</th><th>Complexity</th><th>Government Alternatives</th></tr></thead><tbody><tr><td><strong>File Storage</strong></td><td>AWS S3</td><td>🟢 Easy</td><td>• Azure Blob Storage<br>• Google Cloud Storage<br>• MinIO (self-hosted)<br>• Government cloud storage</td></tr><tr><td><strong>Email Service</strong></td><td>AWS SES</td><td>🟢 Easy</td><td>• Office 365 SMTP<br>• Government email infrastructure<br>• SendGrid, Mailgun<br>• Self-hosted SMTP</td></tr><tr><td><strong>Analytics</strong></td><td>Google Analytics</td><td>🟢 Easy</td><td>• Matomo (self-hosted)<br>• Government analytics<br>• Plausible Analytics<br>• Custom solutions</td></tr><tr><td><strong>Spam Protection</strong></td><td>Google reCAPTCHA + Cloudflare Turnstile</td><td>🟢 Easy</td><td>• hCaptcha<br>• Government CAPTCHA<br>• Custom solutions</td></tr><tr><td><strong>Database</strong></td><td>MongoDB Atlas</td><td>🟡 Medium</td><td>• Self-hosted MongoDB<br>• Azure Cosmos DB (MongoDB API)<br>• AWS DocumentDB</td></tr><tr><td><strong>Identity Provider</strong></td><td>SingPass/CorpPass</td><td>🟡 Medium</td><td>• Government SSO/SAML<br>• Azure AD B2C<br>• Okta, Auth0<br>• Custom OAuth/OIDC</td></tr><tr><td><strong>Monitoring</strong></td><td>Datadog</td><td>🟡 Medium</td><td>• Prometheus + Grafana<br>• Azure Monitor<br>• AWS CloudWatch<br>• ELK Stack</td></tr><tr><td><strong>SMS Service</strong></td><td><a href="https://postman-v2.guides.gov.sg/">Postman</a> (Singapore)</td><td>🔴 Hard</td><td>• Twilio<br>• Government SMS gateways<br>• MessageBird, Vonage<br>• Local telecom APIs</td></tr><tr><td><strong>Payment Processing</strong></td><td>Stripe</td><td>🔴 Hard</td><td>• Government payment systems<br>• PayPal<br>• Local payment gateways<br>• Bank integrations</td></tr><tr><td><strong>Virus Scanner</strong></td><td>AWS Lambda + GuardDuty</td><td>🔴 Hard</td><td>• Government scanning APIs<br>• Commercial antivirus APIs<br>• Container-based scanning</td></tr></tbody></table>

{% hint style="success" %}
**💡 Procurement Tip**: Many government teams already have contracts for Office 365, Azure, or AWS GovCloud. Start by leveraging existing vendor relationships.
{% endhint %}

### 🎯 Component Replacement Strategy

#### Start Small, Build Confidence

{% stepper %}
{% step %}
**Phase 1: Easy Wins** (Week 1-2)

* ✅ Email service replacement
* ✅ Static file hosting
* ✅ Basic monitoring
{% endstep %}

{% step %}
**Phase 2: Infrastructure Services** (Week 3-6)

* 🟡 Database migration
* 🟡 Object storage replacement
* 🟡 Identity provider integration
{% endstep %}

{% step %}
**Phase 3: Advanced Integrations** (Week 7-12)

* 🔴 Payment processing
* 🔴 File scanning services
* 🔴 SMS/notification systems
{% endstep %}
{% endstepper %}

{% hint style="success" %}
**💡 Success Tip**: Validate each component replacement in a development environment before applying to production.
{% endhint %}



### 🟢 Easy Replacements: Quick Wins

Written with the intent to quickly gain confidence =).

{% tabs %}
{% tab title="Email Service (SMTP)" %}
**Why**: Immediate vendor independence, familiar technology, low risk.

**Current AWS SES Integration:**

```bash
SES_HOST=email-smtp.us-east-1.amazonaws.com
SES_PORT=587
SES_USER=AKIAIOSFODNN7EXAMPLE
SES_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Replace with Office 365:**

```bash
SES_HOST=smtp.office365.com
SES_PORT=587
SES_USER=formsg@yourorg.gov
SES_PASS=your-office365-app-password
MAIL_FROM=noreply@yourorg.gov
```

**Replace with Gmail/Google Workspace:**

```bash
SES_HOST=smtp.gmail.com
SES_PORT=587
SES_USER=formsg@yourorg.gov
SES_PASS=your-app-specific-password
MAIL_FROM=noreply@yourorg.gov
```

**Replace with Self-Hosted SMTP:**

```bash
SES_HOST=mail.yourorg.gov
SES_PORT=587
SES_USER=formsg-service
SES_PASS=secure-service-password
MAIL_FROM=noreply@yourorg.gov
```

**Validation Steps:**

* [ ] **Test admin login OTP delivery** - most critical email function
* [ ] **Test form submission notifications** - verify HTML templates render
* [ ] **Check bounce handling** - ensure failed deliveries are logged
* [ ] **Monitor delivery rates** - compare with previous email service
{% endtab %}

{% tab title="Object Storage (S3-Compatible)" %}
**Why**: Reduce AWS dependency, use existing storage infrastructure.

**Azure Blob Storage:**

```bash
# Configure S3-compatible endpoint
AWS_ENDPOINT=https://youraccount.blob.core.windows.net
AWS_ACCESS_KEY_ID=youraccount
AWS_SECRET_ACCESS_KEY=your-blob-storage-key
AWS_REGION=us-east-1  # Keep for S3 compatibility

# Update bucket names to match Azure containers
IMAGE_S3_BUCKET=formsg-images
ATTACHMENT_S3_BUCKET=formsg-attachments
LOGO_S3_BUCKET=formsg-logos
```

**Google Cloud Storage:**

```bash
# Enable S3 interoperability API in GCP
AWS_ENDPOINT=https://storage.googleapis.com
AWS_ACCESS_KEY_ID=your-hmac-access-id
AWS_SECRET_ACCESS_KEY=your-hmac-secret
AWS_REGION=us-east-1

IMAGE_S3_BUCKET=your-gcs-bucket-images
ATTACHMENT_S3_BUCKET=your-gcs-bucket-attachments
```

**MinIO (Self-Hosted):**

```bash
AWS_ENDPOINT=https://minio.yourorg.gov
AWS_ACCESS_KEY_ID=minio-admin
AWS_SECRET_ACCESS_KEY=minio-admin-password
AWS_REGION=us-east-1  # Required for S3 compatibility

# Create buckets in MinIO admin console
IMAGE_S3_BUCKET=formsg-images
ATTACHMENT_S3_BUCKET=formsg-attachments
```

**Validation Steps:**

* [ ] **Test file uploads** in form builder (images, logos)
* [ ] **Test attachment handling** in storage mode forms
* [ ] **Verify presigned URL generation** for secure file access
* [ ] **Check lifecycle policies** if using bucket versioning
{% endtab %}
{% endtabs %}

***

### 🟡 Medium Complexity: Infrastructure Services

{% tabs %}
{% tab title="Database (MongoDB Compatible)" %}
**Why**: Use existing database infrastructure, meet data residency requirements.

**Azure Cosmos DB (MongoDB API):**

```bash
# Connection string format
DB_HOST=mongodb://cosmosaccount:password@cosmosaccount.mongo.cosmos.azure.com:10255/formsg?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@cosmosaccount@

# Additional Cosmos DB settings
COSMOS_DB_ENABLE_RETRIES=true
COSMOS_DB_MAX_RETRY_ATTEMPTS=3
```

**Self-Hosted MongoDB Cluster:**

```bash
# Replica set connection
DB_HOST=mongodb://formsg-user:password@mongo1.internal:27017,mongo2.internal:27017,mongo3.internal:27017/formsg?replicaSet=rs0&authSource=admin

# Connection pool settings for production
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_CONNECT_TIMEOUT_MS=10000
```

**Database Migration Checklist:**

* [ ] **Backup existing data** before migration
* [ ] **Test aggregation pipelines** (FormSG uses complex queries)
* [ ] **Validate transaction support** (required for consistency)
* [ ] **Check TTL index support** (for session cleanup)
* [ ] **Monitor performance** after migration
{% endtab %}
{% endtabs %}

### 🔴 Advanced Replacements: Complex Integrations

#### Understanding FormSG's File Security Architecture

Before replacing virus scanning, understand how FormSG's current implementation protects against malicious files:

```mermaid
graph TD
    %% User Actions
    User[👤 User Uploads File]
    Admin[👨‍💼 Admin Downloads File]
    
    %% Storage Components
    Quarantine[🔒 Quarantine Storage<br/>Temporary holding]
    Clean[✅ Clean Storage<br/>Verified safe files]
    
    %% Security Pipeline
    Scanner[🛡️ Malware Protection<br/>Automatic background scanning]
    Tagging[🏷️ Scan Result Tags<br/>Status metadata]
    Checker[🔍 Scan Checker<br/>Polls for completion]
    
    %% Results
    CleanResult[✅ File Clean<br/>Safe for access]
    InfectedResult[⚠️ Threat Detected<br/>File quarantined]
    
    %% Form Processing
    FormData[📝 Form Submission<br/>Encrypted metadata stored]
    
    %% Main Flow
    User --> Quarantine
    User --> FormData
    
    %% Security Pipeline
    Quarantine -.-> Scanner
    Scanner --> Tagging
    Tagging -.-> Quarantine
    
    %% Result Checking
    Checker --> Quarantine
    Checker --> CleanResult
    Checker --> InfectedResult
    
    %% Clean File Access
    CleanResult --> Clean
    Clean --> Admin
    
    %% Infected File Handling
    InfectedResult --> Quarantine
    
    %% Styling
    classDef user fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef storage fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef security fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef safe fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef danger fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef process fill:#f8f9fa,stroke:#6c757d,stroke-width:2px
    
    class User,Admin user
    class Quarantine,Clean storage
    class Scanner,Tagging,Checker security
    class CleanResult,Clean safe
    class InfectedResult danger
    class FormData process
```

**Current Security Implementation:**

* **Automatic scanning** - Files scanned in background without blocking submission
* **Tag-based results** - Scan results stored as file metadata tags
* **Polling mechanism** - System checks for scan completion before allowing access
* **Fail secure** - Files remain quarantined until explicitly marked clean
* **Audit trail** - All scanning results logged for compliance

When changing implementation of virus scanner, do test with **known malware samples** (EICAR test files).

#### Understanding FormSG's Payment Reconciliation Architecture

Before replacing payment processing, understand how FormSG ensures payment reliability:

```mermaid
graph TD
    %% User Actions
    User[👤 User Submits Form<br/>with Payment]
    Admin[👨‍💼 Admin Reviews<br/>Completed Submissions]
    
    %% Initial Processing
    Pending[📋 Pending Submission<br/>Temporary storage]
    PaymentDoc[💳 Payment Document<br/>Status tracking]
    Provider[💰 Payment Provider<br/>External processing]
    
    %% Real-time Updates
    Webhook[🔔 Webhook Events<br/>Status notifications]
    Processor[⚙️ Event Processor<br/>Status updates]
    
    %% Reconciliation System
    Scheduler[⏰ Scheduled Reconciliation<br/>Every 30 minutes]
    Verification[🔍 Status Verification<br/>Cross-check with provider]
    
    %% Final States
    Finalized[✅ Finalized Submission<br/>Payment confirmed]
    Failed[❌ Failed Payment<br/>Submission rejected]
    Notifications[📧 Notifications<br/>Confirmations sent]
    
    %% Main Flow
    User --> Pending
    User --> PaymentDoc
    PaymentDoc --> Provider
    
    %% Real-time Updates
    Provider --> Webhook
    Webhook --> Processor
    Processor --> PaymentDoc
    
    %% Reconciliation Flow
    Scheduler --> Verification
    Verification --> PaymentDoc
    Verification --> Provider
    
    %% Final Processing
    Processor --> Finalized
    Processor --> Failed
    Verification --> Finalized
    Verification --> Failed
    
    %% Completion
    Finalized --> Admin
    Finalized --> Notifications
    
    %% Styling
    classDef user fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef processing fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef payment fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef reconciliation fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef final fill:#f8f9fa,stroke:#6c757d,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef failure fill:#ffebee,stroke:#f44336,stroke-width:2px
    
    class User,Admin user
    class Pending,PaymentDoc,Processor processing
    class Provider,Webhook payment
    class Scheduler,Verification reconciliation
    class Notifications final
    class Finalized success
    class Failed failure
```

**Payment Reliability Features:**

* **Dual verification** - Webhooks + scheduled reconciliation
* **Status consistency** - Automatic cross-checking with payment provider
* **Failure recovery** - Handles missed events and processing errors
* **Audit trail** - Complete payment history and reconciliation logs
* **Automatic cleanup** - Cancels stale payments and handles edge cases

***

{% hint style="success" %}
**🎯 Success Metrics**: Your customization is successful when FormSG functions identically to the original, but with your preferred infrastructure components. Focus on maintaining security, performance, and user experience throughout the process.
{% endhint %}
