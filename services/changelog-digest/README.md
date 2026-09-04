# Changelog digest scheduler

An EventBridge schedule and a Lambda that calls
`POST /api/v3/cron/generate-digest` once a week.

The Lambda is a clock with an HTTP client. Every decision — what merged, what is
worth reporting, whether there is enough to send at all — lives behind the API,
where it can reuse the backend's models, mailer and logging. See
`apps/backend/src/app/modules/changelog/README.md` for what happens on the other
side.

## When it runs

`cron(0 1 ? * MON *)` — Mondays at 01:00 UTC, which is 09:00 in Singapore.
EventBridge cron has no timezone option, so the offset is baked in. That stays
correct year round because Singapore does not observe daylight saving; the same
trick would drift twice a year for a timezone that does.

**Running weekly is not sending weekly.** A cycle that finds fewer than three
notable changes sends nothing and records nothing, so those changes are
reconsidered next Monday alongside whatever is new. Turning the schedule up
would not produce more digests, only more cycles deciding there is nothing worth
sending.

## What it needs

| Thing                               | Where it comes from                                                                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/<site>/CRON_CHANGELOG_API_SECRET` | pulumi, in formsg-infra. The backend reads the same parameter — one copy, because a drift between two would be silent: every run would 401 and the digest would simply never arrive. |
| Artifact S3 bucket                  | pulumi, in formsg-infra. Its generated name goes into `samconfig.yaml`.                                                                                                              |

## Environments

Only `stg-alt3` is configured. The digest is a prototype that emails one person,
so there is nothing to gain from standing it up everywhere. Adding an
environment is a copy of the `samconfig.yaml` block plus a caller workflow
alongside `deploy-changelog-digest-stg-alt3.yml`.

An entry still marked `TODO-` has not had pulumi applied. The deploy workflow
skips those cleanly rather than failing, so an unrelated push does not go red;
it starts deploying by itself once a real bucket name lands.

## Running it by hand

The schedule is a convenience, not the only way in. Any environment with the
secret configured accepts the same call the Lambda makes:

```sh
curl -X POST https://stg-alt3.form.gov.sg/api/v3/cron/generate-digest \
  -H "x-formsg-cron-changelog-secret: $CRON_CHANGELOG_API_SECRET"
```

Locally, `docker compose up` and the same call against `localhost:5001`.

Either way the digest goes only to `CHANGELOG_PREVIEW_RECIPIENT`. There is no
code path from the service to the real admin list.

## Local invoke

```sh
pnpm run sam-local-invoke
```
