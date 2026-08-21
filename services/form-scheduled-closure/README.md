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
EventBridge (every 10 min) → this Lambda → HTTPS → FormSG API → MongoDB
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
status flipping to closed. Product has accepted a lag here rather than requiring
an exact cut-off. If that changes, `SweepSchedule` in `template.yaml` is the
knob — but note that the guarantee a shorter interval buys is still
best-effort. Making the deadline exact means checking `closeAt` on the
submission path itself, not sweeping faster.

## Deployment

Deployed with AWS SAM, the same way as `services/pdf-gen-sparticuz`.

```
pnpm run sam-build
pnpm run sam-deploy --config-env stg
```

CI does this via `.github/workflows/deploy-scheduled-closure-lambda.yml`, which
is invoked per environment the same way pdf-gen is:

| Environment | Trigger |
| --- | --- |
| `stg-alt`, `stg-alt2`, `stg-alt3`, `uat` | push to the branch of that name |
| `stg`, `production` | `release.yml` (manual dispatch), which fans out to both |

To try a feature branch end to end, push it to `stg-alt`.

The EventBridge schedule is **not** created by hand — the `Events.Sweep` block
in `template.yaml` expands into the rule and its invoke permission, so changing
the cadence is a code change.

### Prerequisites, per environment

Neither of these lives in this repo, and the first deploy fails without them:

1. **An S3 bucket for SAM build artifacts.** The `s3_bucket` entries in
   `samconfig.yaml` are `TODO-` placeholders. The equivalent pdf-gen buckets are
   provisioned by pulumi in the `formsg-infra` repo; these need the same.
2. **An SSM parameter** named `<env>-cron-scheduled-closure`, containing:

   ```
   CRON_SCHEDULED_CLOSURE_API_SECRET = <random string>
   ```

   The same value must be set as `CRON_SCHEDULED_CLOSURE_API_SECRET` in the
   backend's environment, or every call is rejected with a 401.

The secret is deliberately separate from the payment cron job's secret, so a
leak of one does not expose the other.

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

## Not done yet

- **Admin notification.** The PRD requires admins and collaborators to be told
  when their form auto-closes. The endpoint already returns which forms it
  closed so the mail can be added without reshaping anything, but it does not
  send yet.
- **Manual reopen.** If an admin reopens a form whose `closeAt` is in the past,
  the next sweep closes it again. See PRD Q5 — undecided at time of writing.
