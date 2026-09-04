# Form Scheduled Closure

Periodic sweep that closes FormSG forms whose admin-set expiry date has passed.

## Why this exists

A form stops accepting responses when an admin closes it by hand or when it hits
its response limit. Neither covers the common case of a *deadline*. Admins can
now set an expiry date in Settings → General, but nothing in the system runs
code at that instant — so without this job, a form whose deadline passes while
nobody visits it keeps reporting itself as open.

## How it works

```
EventBridge (every minute) → this Lambda → HTTPS → FormSG API → MongoDB
```

The Lambda holds no business logic. It reads a shared secret from SSM Parameter
Store and calls one protected endpoint:

- `POST /api/v3/cron/close-expired-forms`

which finds public forms with `closeAt <= now`, flips them to private, and
reports which ones it closed. Everything that decides *what* to close lives in
the backend so it can reuse the existing models, logging and mailer.

The endpoint caps each sweep at 500 forms and returns `hasMore`. The Lambda
keeps calling until `hasMore` is false, bounded by `MAX_SWEEPS_PER_RUN`, so a
backlog after an outage drains without any single request being unbounded.

### Sweep interval and lag

The schedule interval is the worst-case lag between a form's deadline and its
*status* flipping to closed. It runs every minute, the floor EventBridge allows,
so an admin who published a deadline to the minute sees the form's status agree
with it within one.

Sweeping faster is cheap: when nothing is due, a run is one query against the
partial `{ status, closeAt }` index that matches nothing. What it buys, though,
is only how quickly the *status* catches up. Late responses are already rejected
at the instant of the deadline: `isFormPublic` in `form.service.ts` evaluates
`closeAt` on every load and submit rather than trusting `status`. So a shorter
interval tightens what the admin sees, not what respondents can do.

The Lambda's 120s timeout is longer than the interval, so a run draining a
backlog can overlap the next invocation. The sweep closes forms with a
status-guarded `updateMany`, so the overlapping run finds nothing left to close
rather than closing anything twice.

`SweepSchedule` in `template.yaml` is the knob, and no `samconfig.yaml`
environment overrides it.

## Deployment

Deployed with AWS SAM, the same way as `services/pdf-gen-sparticuz`.

```
pnpm run sam-build
pnpm run sam-deploy --config-env stg
```

CI does this via `.github/workflows/deploy-scheduled-closure-lambda.yml`, which
is invoked per environment the same way pdf-gen is:

| Environment | Trigger | Artifact bucket |
| --- | --- | --- |
| `stg-alt3` | push to the branch of that name | provisioned |
| `stg-alt`, `stg-alt2`, `uat` | push to the branch of that name | **not yet** — deploy skips |
| `stg`, `production` | `release.yml` (manual dispatch), which fans out to both | **not yet** — deploy skips |

To try a feature branch end to end, push it to `stg-alt3` — the only environment
currently provisioned.

The deploy step checks `samconfig.yaml` for its environment's bucket and skips
with a notice if it is still a `TODO-` placeholder, rather than failing. So an
unprovisioned environment produces a green, explanatory no-op rather than a red
check on an unrelated test push, and starts deploying by itself once a real
bucket name is pasted in.

`stg` and `production` deploy via `release.yml`, which fans out to
`deploy-scheduled-closure-stg.yml` and `-prod.yml`. Both call the same reusable
workflow, so they inherit the same bucket check: until pulumi has been applied to
those environments the job skips with a notice, and a release stays green rather
than reddening for everyone over a bucket that does not exist yet.

The EventBridge schedule is **not** created by hand — the `Events.Sweep` block
in `template.yaml` expands into the rule and its invoke permission, so changing
the cadence is a code change.

### Prerequisites, per environment

Neither of these lives in this repo, and an environment cannot deploy without them:

1. **An S3 bucket for SAM build artifacts.** Provisioned by pulumi in
   `formsg-infra` (`src/scheduledClosure.ts`). Pulumi generates the name with a
   random suffix, so it is only known after `pulumi up` — it is exported as the
   `scheduledClosureCodeZipBucket` stack output, then pasted into
   `samconfig.yaml`. `stg-alt3` is done; environments still showing `TODO-` have
   not had pulumi applied, and their deploy job skips rather than failing.
2. **An SSM parameter** at `/<ssm-env-site-name>/CRON_SCHEDULED_CLOSURE_API_SECRET`,
   holding a random string.

Both are created by `src/scheduledClosure.ts` in the formsg-infra repo. The
secret's value is set per stack with:

```bash
pulumi config set --secret CRON_SCHEDULED_CLOSURE_API_SECRET "$(openssl rand -hex 32)" --stack stg-alt3
```

This is the *same* parameter the backend reads for its own
`CRON_SCHEDULED_CLOSURE_API_SECRET` env var — one copy, read by both sides, so
they cannot drift. (The payment cron does it differently: a pulumi-managed
parameter for the backend plus a separate hand-created blob for its lambda. A
drift between two copies is silent — every sweep 401s and forms never close.)

It is a different secret from the payment cron's, so a leak of one does not
expose the other.

### A naming trap

`SsmEnvSiteName` is passed separately from `Environment` in `samconfig.yaml`
because they are not always the same string. formsg-infra's `src/constants.ts`
maps the `stg-alt2` stack to the site name `stg-alt21`, so deriving the SSM path
from `Environment` would look in the wrong place for that one environment.

## Testing locally

The backend endpoint can be exercised without any AWS. `docker-compose.yml`
sets the secret to `secretKey` for local development:

```bash
curl -X POST http://localhost:5001/api/v3/cron/close-expired-forms \
  -H "x-formsg-cron-scheduled-closure-secret: secretKey"
```

To give it something to close, backdate a form:

```bash
docker compose exec -T database mongo formsg --quiet --eval '
  db.forms.updateOne({ title: "<your form>" },
    { $set: { status: "PUBLIC", closeAt: new Date(Date.now() - 3600000) } })
'
```

## Notifications

Each closed form's admin and collaborators are emailed. The endpoint reports
`notifiedCount` and `notifyFailedCount` alongside the closures.

Sending is best-effort and **at-most-once**: a form only matches the sweep while
it is still public, so once closed it is never revisited and a failed email is
not retried. A non-zero `notifyFailedCount` therefore means some admins were
never told, and is worth alarming on. Making this at-least-once needs a
`closeNotifiedAt` marker on the form so a later sweep can pick up the stragglers.

Notification failures deliberately do not fail the request. The forms are
already closed, and a retry would close nothing while re-sending to everyone who
did receive an email.

## Manual reopen

Reopening a form whose expiry has already lapsed clears `closeAt`, so the sweep
does not immediately re-close it. A *future* expiry survives a reopen, letting an
admin schedule a deadline on a form that is not open yet. See PRD Q5.
