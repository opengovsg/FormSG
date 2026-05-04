# FormSG Development Instructions

This file provides context for GitHub Copilot when working with the FormSG codebase.

## 🎯 Quick Reference

- **Repository**: `opengovsg/FormSG` (case-sensitive!)
- **Architecture**: Monorepo with pnpm workspaces
- **Stack**: Node.js 22+, React 18, MongoDB, TypeScript
- **Form Modes**: Email, Storage (Encrypt), Multi-Respondent (MRF)

---

## Common Development Commands

### Starting Services

```bash
# Start all services (frontend + backend + lambdas)
pnpm dev

# Individual services
pnpm dev:frontend              # React frontend only (Vite)
docker-compose up             # Backend services (MongoDB, LocalStack, MailDev)
pnpm dev:pdf-gen              # PDF generation Lambda
pnpm dev:virus-scanner-guardduty  # Virus scanner Lambda

# Backend only (alternative)
pnpm dev:backend
```

### Testing

```bash
# All tests
pnpm test

# Backend tests
pnpm test:backend              # Run once
pnpm test:backend:watch        # Watch mode
pnpm test:backend:ci           # CI mode (optimized)

# Frontend tests
pnpm test:frontend

# E2E tests (requires stopping dev containers)
pnpm test:e2e-v2               # Build + run E2E tests
pnpm exec playwright test      # Run without rebuild

# SDK tests
pnpm test:sdk
```

### Building

```bash
# Build all packages
pnpm build

# Individual builds
pnpm build:frontend
pnpm build:backend
pnpm build:shared
pnpm build:sdk

# Clean build artifacts
pnpm clean
```

### Package Management

```bash
# Install all dependencies
pnpm install

# Add dependencies to specific workspace
pnpm --filter formsg-backend add <package>
pnpm --filter formsg-frontend add <package>
pnpm --filter formsg-shared add <package>

# Update Node.js version
nvm install
nvm use
```

### Linting

```bash
# Lint all packages
pnpm lint

# Individual packages
pnpm lint:backend
pnpm lint:frontend
pnpm lint:shared

# CI linting (with caching)
pnpm lint-ci:backend
pnpm lint-ci:shared
```
### Workarounds

```bash
# Using an alternative container runtime (e.g. Colima)
export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"
```

---

## 🔧 MCP Servers Available

### DeepWiki (cognitionai/deepwiki)

**Status**: ✅ Configured and indexed for this repository

**Purpose**: AI-powered documentation and Q&A for understanding FormSG's architecture, patterns, and design decisions.

#### Available Tools

1. **`ask_question(repoName, question)`**
   - Natural language Q&A about repository architecture
   - Best for: "How does X work?", "What is the architecture of Y?"
   - Returns: Narrative explanations with wiki references

2. **`read_wiki_structure(repoName)`**
   - Get documentation table of contents
   - Returns: Hierarchical list of available documentation topics

3. **`read_wiki_contents(repoName)`**
   - Get full repository documentation
   - Warning: Large response (~1.5MB), use sparingly

#### Usage Guidelines

**Repository Name**: Must use `opengovsg/FormSG` (exact case)
- ✅ Correct: `opengovsg/FormSG`
- ❌ Wrong: `opengovsg/formsg`, `OpenGovSG/FormSG`

**When to Use DeepWiki**:
- ✅ Conceptual/architecture questions
- ✅ Understanding design patterns
- ✅ Onboarding to unfamiliar subsystems
- ✅ Cross-component interactions
- ✅ "Why" questions about implementation decisions

**When NOT to Use DeepWiki**:
- ❌ Finding exact file paths or line numbers
- ❌ Debugging specific issues (use workspace search)
- ❌ Implementation details (use semantic_search)
- ❌ Recent code changes (may not be indexed)

**Limitations**:
- No file paths or line numbers in responses
- May not reflect latest commits
- Cannot show actual code snippets
- Follow up with `semantic_search` or `grep_search` for code locations

#### Example Queries

**Good DeepWiki Questions**:
```
- "How does the MRF workflow system handle state transitions?"
- "What are the security measures in FormSG's submission pipeline?"
- "Explain the difference between Email Mode and Storage Mode"
- "What is the encryption architecture for Storage Mode forms?"
- "How does MyInfo integration work?"
```

**Better as Workspace Search**:
```
- "Where is the virus scanning middleware registered?" → Use semantic_search
- "Show me the MRF controller code" → Use semantic_search + read_file
- "What files use the scanAndRetrieveAttachments function?" → Use grep_search
- "Find all form validation logic" → Use semantic_search
```

#### Optimal Hybrid Approach

For complex questions requiring both understanding and implementation:

1. **Start with DeepWiki**: Get conceptual overview and architecture
2. **Follow with workspace search**: Find specific code locations
3. **Read targeted files**: Examine actual implementation

**Example**:
```
Task: "I need to modify the MRF workflow validation logic"

Step 1: ask_question("opengovsg/FormSG", "How does MRF workflow validation work?")
→ Understand the validation flow and key concepts

Step 2: semantic_search("MRF workflow validation middleware")
→ Find exact file paths

Step 3: read_file(specific files with line ranges)
→ Examine implementation details
```

---

## 🏗️ FormSG Architecture Overview

### Monorepo Structure

```
formsg/
├── apps/
│   ├── backend/        # Express API (Node.js 22+)
│   └── frontend/       # React web app (Vite)
├── packages/
│   ├── shared/         # Shared types and constants
│   ├── sdk/            # @opengovsg/formsg-sdk (npm package)
│   └── react-email-preview/
├── services/
│   ├── virus-scanner-guardduty/  # AWS Lambda
│   ├── pdf-gen-sparticuz/        # AWS Lambda
│   └── form-payment-reconciliation/
└── scripts/           # MongoDB migration scripts
```

### Form Response Modes

**Critical**: FormSG has three distinct submission modes with different implementations:

1. **Email Mode** (`FormResponseMode.Email`)
   - Responses emailed directly to admin
   - No server storage
   - Being deprecated ("Kill Email Mode")

2. **Storage/Encrypt Mode** (`FormResponseMode.Encrypt`)
   - End-to-end encrypted submissions
   - Client-side encryption before transmission
   - Stored encrypted in MongoDB

3. **Multi-Respondent Form (MRF)** (`FormResponseMode.Multirespondent`)
   - Workflow-based with sequential respondents
   - Each step handled by different users
   - Version 3 submission format

**Pattern**: Use discriminator pattern in Mongoose models to differentiate form types.

### Key Backend Modules

- `apps/backend/src/app/modules/submission/` - Submission pipelines (split by mode)
- `apps/backend/src/app/modules/form/` - Form CRUD operations
- `apps/backend/src/app/modules/auth/` - Authentication flows
- `apps/backend/src/app/modules/myinfo/` - Singapore MyInfo integration
- `apps/backend/src/app/modules/spcp/` - SingPass/CorpPass integration
- `apps/backend/src/app/modules/payments/` - Stripe payment processing
- `apps/backend/src/app/modules/webhook/` - Webhook delivery via SQS

### Key Frontend Features

- `apps/frontend/src/features/admin-form/` - Form builder UI
- `apps/frontend/src/features/public-form/` - Form submission UI
- `apps/frontend/src/features/workspace/` - Form organization
- `apps/frontend/src/features/analytics/` - Analytics dashboard

---

## 🎨 Code Patterns & Conventions

### Result Types

We use `neverthrow` library extensively:
```typescript
Result<T, E>       // Sync results
ResultAsync<T, E>  // Async results
```

Prefer `.andThen()`, `.map()`, `.mapErr()` chains over try-catch.

### Middleware Pipelines

Express middleware are composed into arrays:
```typescript
export const handleStorageSubmission = [
  CaptchaMiddleware.validateCaptchaParams,
  ReceiverMiddleware.receiveStorageSubmission,
  EncryptSubmissionMiddleware.scanAndRetrieveAttachments,
  // ... more middleware
  submitEncryptModeForm,
] as ControllerHandler[]
```

Position matters - validation → processing → persistence.

### Encryption

- Client-side: `tweetnacl` (x25519-xsalsa20-poly1305)
- Webhook signatures: `ed25519`
- SDK handles all crypto operations

### Testing

- Unit tests: Jest (backend), Vitest (frontend)
- E2E tests: Playwright
- Test files: `__tests__/` or `*.spec.ts`

**Testing Patterns**:

**Backend Unit Tests**:
- Location: `apps/backend/__tests__/unit/` or co-located `*.spec.ts`
- Framework: Jest with ts-jest
- Pattern: Mirror source structure
- Example: `apps/backend/src/app/modules/form/__tests__/form.service.spec.ts`

**Frontend Unit Tests**:
- Location: `apps/frontend/__tests__/` or co-located
- Framework: Vitest
- Mocking: MSW (Mock Service Worker) in `~/mocks/msw/handlers/`
- Pattern: Test components, hooks, utilities

**E2E Tests**:
- Location: `__tests__/e2e/`
- Framework: Playwright
- Files: `*.spec.ts` (e.g., `login.spec.ts`, `encrypt-submission.spec.ts`)
- Setup: `globalSetup.ts`, `globalTeardown.ts`
- Run separate from dev environment (stop Docker containers first)

**Test Utilities**:
- Frontend MSW handlers: `apps/frontend/src/mocks/msw/handlers/`
- Storybook decorators: `~utils/storybook.tsx`
- Backend test setup: `apps/backend/__tests__/setup/`

---

## 🎨 Frontend Architecture & Patterns

### Tech Stack

- **React 18** with TypeScript
- **Vite** for dev server and building
- **Chakra UI** as design system foundation
- **React Query** for server state management
- **React Router** for routing
- **i18next** for internationalization
- **Storybook** for component development

### Import Path Aliases


### Feature-Based Structure

```
features/
  [feature-name]/
    components/           # Feature-specific components
    mutations.ts          # React Query mutations
    queries.ts            # React Query queries
    [Feature]Service.ts   # API calls (fetch functions)
    types.ts              # TypeScript types
    index.ts              # Public exports
    [Feature]Context.tsx  # React Context (if needed)
```

**Example**: `features/admin-form/`
- `AdminFormService.ts` - API calls
- `queries.ts` - `useAdminForm()`, `useAdminFormSettings()`
- `mutations.ts` - `useCreateFormMutation()`, `useUpdateFormMutation()`

### State Management Patterns

**React Query for Server State**:
```typescript
// Query
const { data, isLoading } = useQuery(
  ['formKey', formId],
  () => fetchForm(formId),
)

// Mutation with cache invalidation
const mutation = useMutation(
  (data) => createForm(data),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['forms'])
      toast({ description: 'Form created!' })
    },
    onError: (error) => {
      toast({ status: 'danger', description: error.message })
    },
  },
)
```

**React Context for App State**:
- `AuthContext` - User authentication state
- `PublicFormContext` - Public form submission context
- `BuilderAndDesignContext` - Form builder state

### Chakra UI Patterns

**Component Composition**:
```typescript
// Compound component pattern
<Menu>
  <Menu.Button>Options</Menu.Button>
  <Menu.List>
    <Menu.Item>Edit</Menu.Item>
    <Menu.Item>Delete</Menu.Item>
  </Menu.List>
</Menu>
```

**Responsive Design**:
```typescript
// Breakpoint values
const isMobile = useBreakpointValue({ base: true, md: false })

// Responsive props
<Box px={{ base: '1rem', md: '2rem' }} />
```

**Custom Hooks**:
- `useToast()` - Custom toast notifications
- `useDisclosure()` - Modal/drawer state management
- `useIsMobile()` - Responsive breakpoint detection

**Theme Customization**:
- Location: `apps/frontend/src/theme/`
- Components: `theme/components/` - Custom component styles
- Colors: `theme/foundations/colours.ts`
- Text styles: `theme/textStyles.ts`

### Component Development

**Storybook Stories**:
- Co-located: `ComponentName.stories.tsx`
- Run: `cd apps/frontend && pnpm storybook`
- Used for isolated component development and documentation

**Component Structure**:
```typescript
// ComponentName.tsx
export interface ComponentNameProps {
  // Props
}

export const ComponentName = (props: ComponentNameProps) => {
  // Implementation
}

// ComponentName.stories.tsx
export default {
  title: 'Components/ComponentName',
  component: ComponentName,
} as Meta
```

### Internationalization

- Files: `apps/frontend/src/i18n/locales/features/[feature]/en-sg.ts`
- Usage: `const { t } = useTranslation()`
- Pattern: Nested keys by feature
- Currently: English (Singapore) only, but prepared for multi-language

---

## 🔌 API Development Patterns

### Route Organization

**Backend routing hierarchy**:
```
apps/backend/src/app/routes/
├── api/
│   ├── v3/                    # Current API version
│   │   ├── auth/
│   │   ├── forms/
│   │   ├── submissions/
│   │   └── ...routes.ts
│   └── public/
│       └── v1/                # Public API
├── singpass/                  # SingPass OIDC endpoints
└── index.ts                   # Root router
```

**File Pattern**:
- File: `*.routes.ts`
- Export: `export const [Name]Router = Router()`
- Registration: Imported and mounted in parent router

### Controller Patterns

**Middleware Array Composition**:
```typescript
// Position matters: validation → auth → business logic → handler
export const handleSubmission = [
  CaptchaMiddleware.validateCaptchaParams,
  AuthMiddleware.authenticate,
  ValidationMiddleware.validateBody,
  BusinessLogic.processSubmission,
  finalHandler,
] as ControllerHandler[]

// Register in router
Router.post('/submit', ...handleSubmission)
```

**Error Handling Pattern**:
```typescript
// In controller/handler
const result = await service.doSomething()
if (result.isErr()) {
  return res.status(400).json({ message: result.error })
}
return res.json(result.value)

// Using mapRouteError helper
return result
  .map((data) => res.json(data))
  .mapErr((error) => {
    logger.error({ error })
    return mapRouteError(error)
  })
```

### Database Patterns

**Mongoose Discriminator Pattern**:
```typescript
// Base schema
const FormSchema = new Schema({
  responseMode: { type: String, enum: Object.values(FormResponseMode) },
  // Common fields
})

// Discriminated models
const EmailFormModel = FormModel.discriminator('emailForm', EmailFormSchema)
const EncryptFormModel = FormModel.discriminator('encryptForm', EncryptFormSchema)

// Usage
form.responseMode // 'email' | 'encrypt' | 'multirespondent'
```

**Model Interfaces**:
- `I[Model]Schema` - Document interface (what's stored)
- `I[Model]Model` - Model static methods interface
- Example: `IFormSchema`, `IFormModel`

**Schema Location**:
- Models: `apps/backend/src/types/[model].ts`
- Schema files: Co-located with module or in `models/`

### Service Layer Pattern

**Result-based Services**:
```typescript
// Service returns Result/ResultAsync
export const createForm = (
  userId: string,
  formData: FormDto,
): ResultAsync<FormDto, DatabaseError | ValidationError> => {
  return validateForm(formData)
    .andThen((validated) => FormModel.create({ ...validated, admin: userId }))
    .map((form) => form.toObject())
    .mapErr((error) => new DatabaseError(error.message))
}
```

---

## 🔍 Search Strategy Recommendations

### For Locating Code

**Best tool order**:
1. `semantic_search` - For conceptual code search
2. `grep_search` - For exact string matches
3. `file_search` - For file name patterns
4. `read_file` - Once you know the file

### For Understanding Architecture

**Best tool order**:
1. `ask_question` (DeepWiki) - For conceptual overview
2. `semantic_search` - For related code
3. `read_file` - For specific implementations

### Common Search Patterns

**Finding middleware registration**:
```
semantic_search("middleware_name registration controller")
→ Returns controller files with middleware arrays
```

**Finding all usages**:
```
grep_search("functionName", includePattern: "**/*.ts")
→ Returns all files using the function
```

**Understanding a subsystem**:
```
1. ask_question("opengovsg/FormSG", "How does [subsystem] work?")
2. semantic_search("[subsystem] implementation")
3. read_file(identified files)
```

---

## 🚨 Common Pitfalls

### 1. Form Mode Confusion

❌ **Don't** assume all forms work the same way
✅ **Do** check `form.responseMode` and use appropriate type guards:
- `isFormEncryptMode(form)`
- `isFormMultirespondent(form)`

### 2. Virus Scanning

- Dev mode: Synchronous (one at a time)
- Production: Asynchronous (parallel)
- Ordering: Runs after files are uploaded to the quarantine bucket and before downstream processing that assumes the files are safe
- Files uploaded to quarantine bucket first, then scanned

### 3. Migration Scripts

- Located in `scripts/` with date prefixes (YYYYMMDD_description)
- Review recent migrations before schema changes
- Examples: `20240214_mrf-workflow-field-locking/`

### 4. Environment Variables

- Backend uses `convict` for config validation
- See `apps/backend/src/app/config/schema.ts` for all variables
- See `docs/configuration-reference.md` for documentation

### 5. Authentication Context

Singapore-specific:
- **SingPass**: Citizen authentication
- **CorpPass**: Corporate authentication
- **sgID**: Alternative digital identity
- **MyInfo**: Auto-prefill from government data
- **MockPass**: Local development emulator

### 6. Import Path Resolution

**Frontend**: `~` alias maps to `src/`, configured in `vite.config.ts`
**Shared Package**: Import from `formsg-shared/types`, `formsg-shared/constants`

---

## 🔀 Git Workflow

### Commit Messages

**Use Conventional Commits** format:
```
feat: add payment receipt download
fix: resolve form duplication bug
chore: update dependencies
docs: improve API documentation
test: add submission validation tests
```

**Types**: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `style`, `ci`

### Contributing

- Read [CONTRIBUTING.md](../CONTRIBUTING.md) before starting work
- Discuss changes via GitHub issue before opening PR
- Ensure tests pass: `pnpm test`
- Update README.md if adding environment variables or features
- Sign Contributor License Agreement (CLA)

---

## 📚 Additional Resources

- **Contributing Guide**: [CONTRIBUTING.md](../CONTRIBUTING.md)
- **GitBook**: https://ogp-international.gitbook.io/ogp-international-hub/self-hosting/formsg
- **User Guide**: https://guide.form.gov.sg/
- **SDK Docs**: `packages/sdk/README.md`
- **Local Docs**: `docs/` folder (quickstart, configuration reference, security)
- **DeepWiki**: https://deepwiki.com/opengovsg/FormSG (Ask questions about the codebase)

---

## 💡 Tips for Copilot Usage

### Cost Optimization

- DeepWiki queries: ~$0.01-0.014 each
- Workspace searches: ~$0.02-0.04 each
- Use DeepWiki for initial orientation, workspace for implementation

### When Working with Forms

1. Identify form mode first
2. Check corresponding module: `submission/{email,encrypt,multirespondent}-submission/`
3. Follow middleware pipeline in controller file
4. Examine middleware implementations

### When Debugging

1. Check error messages in console/logs
2. Use `semantic_search` to find error class definitions
3. Trace error handling in middleware chains
4. Look for `mapRouteError` functions

### When Adding Features

1. Ask DeepWiki about similar features
2. Find related code with `semantic_search`
3. Follow existing patterns (Result types, middleware composition)
4. Add tests in `__tests__/` directories

### When Working on Frontend

1. Check if component exists in `~components/` before creating new one
2. Use Chakra UI components as base
3. Follow feature-based structure: `features/[feature-name]/`
4. Use React Query for API calls (never fetch directly)
5. Add Storybook stories for new components
6. Use `~` path alias for imports within frontend

### When Working on Backend

1. Return `Result` or `ResultAsync` from services
2. Compose middleware in arrays for controllers
3. Use `mapRouteError` for consistent error responses
4. Add TypeScript interfaces for request/response types
5. Check form `responseMode` before processing submissions
6. Update Mongoose discriminators for form-type-specific logic

---

## 🔄 Version Info

- **Node.js**: See `.nvmrc` and `package.json#engines` for the supported version.
- **pnpm**: See `package.json#packageManager` and CI config for the required version.
- **MongoDB**: See local Docker/deployment configuration for the supported version.
- **Application version**: Refer to the repository/package metadata instead of hard-coded values in this file.

---
