# Architecture

This article aims to give the reader an overview of FormSG's architecture,
relative to external systems and in terms of how the codebase is organised.


## System Architecture

FormSG runs on Amazon Web Services and is built on top of Express and React.
It relies on MongoDB Atlas, AWS EFS, and AWS S3 for storage, AWS SES to dispatch e-mails and
is deployed on Docker containers running on top of Elastic Beanstalk. Optionally, FormSG
can also talk to Government-hosted systems - SingPass/CorpPass/MyInfo to retrieve form-filler
identities, and E-mail servers hosted in Government Data Centres.

```mermaid
graph TB
    %% People
    FormFillers["👤 Form Fillers<br><small>Members of the Public</small>"]
    PublicServants["👥 Public Servants<br><small>Government Employees</small>"]

    %% Systems
    subgraph FormSG["FormSG<br><small>The FormSG platform</small>"]
        WebFrontend["Web Frontend<br><small>React</small>"]
        Backend["Backend<br><small>Node, Express</small>"]
        AWSSES["AWS SES<br><small>Simple Email Service</small>"]
        AWSEFS["AWS EFS<br><small>Elastic File System</small>"]
        MongoDB["MongoDB<br><small>Form templates storage</small>"]
    end

    %% External Systems
    GovEmail["Government Email Services<br><small>gov.sg emails</small><br><small>Hosted on Government Datacentres</small>"]
    style GovEmail fill:#2D3D42,color:#FFFFFF

    NDI["National Digital Identity Systems<br><small>SingPass, CorpPass and MyInfo</small>"]
    style NDI fill:#2D3D42,color:#FFFFFF

    %% Style AWS components
    style AWSSES fill:#FF9900,color:#FFFFFF
    style AWSEFS fill:#FF9900,color:#FFFFFF

    %% Style MongoDB
    style MongoDB fill:#589636,color:#FFFFFF

    %% Relationships
    FormFillers -->|"Makes form submissions"| FormSG
    style FormFillers fill:#08427B,color:#FFFFFF,stroke:#052E56

    FormFillers -->|"Logs in to pre-fill form"| NDI

    PublicServants -->|"Creates government forms"| FormSG
    style PublicServants fill:#08427B,color:#FFFFFF,stroke:#052E56

    PublicServants -->|"Collects form submissions"| GovEmail

    FormSG -->|"Obtains data from SingPass,<br>CorpPass, MyInfo"| NDI

    FormSG -->|"Routes form submissions"| GovEmail

    %% Internal relationships
    WebFrontend -->|"Served to users via"| Backend
    Backend -->|"Routes submissions<br>and OTPs"| AWSSES
    Backend -->|"Reads identity<br>certificates"| AWSEFS
    Backend -->|"Reads/Writes<br>form templates"| MongoDB
    AWSSES -->|"Routes emails"| GovEmail
```

## Attachments and Virus Scanning

FormSG uses S3 buckets for storing form attachments with a serverless virus scanning process to ensure file safety.

<!-- TODO: this is just my assumption of how it works. have to deep-dive to code but haven't got around it -->
```mermaid
graph TB
    %% Main Components
    Backend["Backend<br><small>NodeJS, Express.js</small>"]
    FormFiller["Form Filler<br><small>Uploads attachments</small>"]
    FormAdmin["Form Admin<br><small>Downloads attachments</small>"]

    %% AWS S3 Storage
    subgraph S3Storage["AWS S3 Storage"]
        QuarantineBucket["Quarantine Bucket<br><small>Temporary storage for scanning</small>"]
        CleanBucket["Clean Bucket<br><small>Verified safe files</small>"]
    end
    FormSubmissions["MongoDB<br><small>Form Submissions</small>"]

    %% Serverless Components
    VirusScanner["Virus Scanner<br><small>Lambda Function</small>"]

    %% Event Triggers
    S3Event["S3 Event Notification<br><small>Triggers on file upload</small>"]

    %% Relationships
    FormFiller -->|"1.Submits form with<br>attachment"| Backend
    Backend -->|"2.Uploads file to<br>quarantine"| QuarantineBucket
    QuarantineBucket -->|"3.Upload event"| S3Event
    S3Event -->|"4.Triggers"| VirusScanner
    VirusScanner -->|"5.Scans file"| QuarantineBucket
    VirusScanner -->|"6a.If clean,<br>copies to clean bucket"| CleanBucket
    VirusScanner -->|"6b.If infected,<br>deletes file"| QuarantineBucket
    Backend -->|"7.Stores encrypted<br>form data"| FormSubmissions
    FormAdmin -->|"8.Requests<br>attachment"| Backend
    Backend -->|"9.Retrieves verified<br>attachment"| CleanBucket
```

## Code Organization

### Backend

The backend for FormSG is bootstrapped using `src/app/server.ts` and `src/app/loaders`.
It sets up express.js routes defined in `src/app/**/*.routes.ts`, with business logic
defined in `src/app/**/*.controller.ts` and mongoose models defined in `src/app/**/*.model.ts`.

### Frontend

The frontend is written in React and can be found in `frontend/src`.

The index file is located at `frontend/public/index.html`. The frontend is built with CRA.

### Serverless Functions

FormSG uses serverless functions for operations that are separate from the main application flow:

#### Virus Scanner

Located in `serverless/virus-scanner/`, this Lambda function is responsible for scanning uploaded files for malware:

- Triggered by S3 events when files are uploaded to the quarantine bucket
- Uses ClamAV for virus detection
- Manages file movement between quarantine and clean buckets
- Integrates with AWS S3 via the `S3Service` for file operations
- Deployed using the Serverless Framework (serverless.yml)

#### GuardDuty Virus Scanner

Located in `serverless/virus-scanner-guardduty/`, this is an alternative implementation of the virus scanner:

- Similar functionality but with additional integration with AWS GuardDuty
- Uses tagging mechanisms to mark files as clean/infected
- Processes files based on authenticated API calls rather than S3 events
- Includes more comprehensive logging and error handling

### AWS Lambda Functions

Additional specialized Lambda functions are found in the `functions/` directory:

#### Form Payment Reconciliation

Located in `functions/form-payment-reconciliation/`, this Lambda function:

- Handles payment reconciliation for form submissions
- Generates reports for payment status
- Sends notifications to Slack for monitoring and alerts
- Can be deployed to various environments (prod, staging, uat) via CLI or manual upload
- Run on a scheduled basis to reconcile form payments
