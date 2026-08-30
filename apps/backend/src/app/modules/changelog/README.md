# Changelog digest

Drafts the weekly product digest email for FormSG form admins and sends it to a
single preview address for review.

This is the prototype stage of the digest RFC. It covers generation, the email,
the Slack notification, and the weekly schedule. It deliberately does not cover
the changelog page, an entry store, an approval UI, or Postman delivery.

The schedule lives in `services/changelog-digest` — an EventBridge rule and a
Lambda that call the endpoint every Monday at 09:00 Singapore time. Running
weekly is not sending weekly; see "Holding items over" below.

## What it does

Two endpoints, deliberately separate.

**`POST /cron/generate-digest`** drafts and persists. It sends nothing.

1. If a digest already exists for this ISO week, return it and stop.
2. Read pull requests merged since a digest was last **sent**.
3. Ask the model for every change a form admin would care about, ranked most
   notable first.
4. Persist the result: `draft` if there are at least three, `held` if not.
5. Post the outcome to Slack.

**`POST /cron/approve-digest?digestId=...`** emails the best three of a draft to
`CHANGELOG_PREVIEW_RECIPIENT` and marks it `sent`. This is the only route that
sends mail.

**`GET /cron/digests`** lists recent digests, newest first, because approving
needs an id and the run that produced it was a scheduled job nobody watched.

Only generation is on a timer — Mondays at 09:00 Singapore time, from
`services/changelog-digest`. Approval is a deliberate act, and a draft nobody
approves is a normal outcome rather than a failed run.

### Why they are separate

A digest that exists only as mail cannot be read before it is sent, cannot
survive a mail failure without losing the drafting work, and cannot be approved
by anyone other than the process that drafted it. Splitting them costs one extra
call today and is what the approval flow is built on.

## Statuses

| Status       | Means                                                                     |
| ------------ | ------------------------------------------------------------------------- |
| `draft`      | Enough to send, waiting for approval.                                     |
| `held`       | Too few notable changes to be worth sending.                              |
| `sent`       | Approved and emailed. Only this moves the line the next cycle reads from. |
| `superseded` | A later cycle drafted over it before it was approved.                     |

`held` and `superseded` both mean "no email that week", but collapsing them
would hide which. The first is the pipeline working as designed; the second
means a draft sat unapproved long enough to be overtaken.

## Holding items over

The cycle runs weekly. It does not send weekly.

A digest carries exactly three items or it does not go out, and the number is
the same in both directions on purpose: a digest of one or two items reads as
though we had nothing to say.

A week that finds too few is recorded as `held`. Because only a `sent` digest
moves the line the next cycle reads from, those changes are reconsidered next
week alongside whatever is new. Two quiet weeks of two items each therefore
produce one digest of the best three, not two thin ones — the generator ranks
the combined four and approval sends the top three.

The consequence worth knowing: a genuinely notable change can sit unannounced
for as long as it takes two more to land. There is deliberately no maximum age
yet. If that becomes a problem the fix is a staleness escape hatch, not a lower
bar.

## Idempotency

Generation is keyed on the ISO week and enforced by a unique index, not by
looking before inserting. A retry, an overlapping invocation, and someone
running it by hand on the same day all return the digest that already exists.
This is what lets the schedule and a person share one endpoint.

## Safety constraints

These are deliberate and worth preserving until the approval flow exists.

- **The routes exist only where the digest is configured.** The guard is on the
  router, so it travels with the routes, and returns 404 rather than 403. It
  keys on the shared secret being set rather than on `NODE_ENV`: a
  development-only guard could not survive the job being scheduled, since a
  Lambda calling a deployed environment would have got a 404 forever. An
  environment nobody has set up for the digest still does not expose it.
- **There is no code path to the real admin list.** The service knows only about
  the configured preview address, and `MailService.sendChangelogDigest` takes
  recipients as a parameter rather than resolving them.
- **Nothing is emailed on a schedule.** Generation is the only timed step, and
  it sends nothing. Mail requires someone to approve a specific digest by id.
- **Approval emails one person.** The single configured address, and there is no
  code path from the service to the real admin list.

## Configuration

| Variable                      | Purpose                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| `CRON_CHANGELOG_API_SECRET`   | Shared secret for the route. An unset secret authenticates nobody. |
| `AZURE_OPENAI_*`              | Drafting the items. Shared with the form builder's assistance feature — already provisioned, nothing new to set up. |
| `CHANGELOG_GITHUB_TOKEN`      | Read access to pull requests.                                      |
| `CHANGELOG_GITHUB_REPO`       | Defaults to `opengovsg/FormSG`.                                    |
| `CHANGELOG_SLACK_WEBHOOK_URL` | Optional. Unset means the Slack step is skipped, not failed.       |
| `CHANGELOG_PREVIEW_RECIPIENT` | The only address a digest is ever sent to.                         |

## Working on it locally

### Iterating on the email design

Storybook renders the template without a backend, a network call, or an API key,
and hot-reloads on save:

```sh
pnpm --filter formsg-react-email-preview storybook
```

Stories live in `packages/react-email-preview/stories/`. Every one carries three
items, because a digest carries three or it is not sent; they vary the
unsubscribe link and the copy length, which is where the card layout is most
likely to break.

### Running a cycle

```sh
docker compose up

# 1. Draft this week's digest. Idempotent — run it twice, nothing happens twice.
curl -X POST localhost:5001/api/v3/cron/generate-digest \
  -H "x-formsg-cron-changelog-secret: $CRON_CHANGELOG_API_SECRET"

# 2. Find the id, if you did not keep the response.
curl localhost:5001/api/v3/cron/digests \
  -H "x-formsg-cron-changelog-secret: $CRON_CHANGELOG_API_SECRET"

# 3. Approve it, which is what actually sends the mail.
curl -X POST "localhost:5001/api/v3/cron/approve-digest?digestId=<id>" \
  -H "x-formsg-cron-changelog-secret: $CRON_CHANGELOG_API_SECRET"
```

Step 1 returns the digest, including every candidate the generator found — not
just the three that would be emailed. That is the point of looking at a draft
before approving it.

Approving anything that is not a `draft` returns 409 rather than sending: a
`sent` digest would go out twice, and a `held` or `superseded` one would send
something the pipeline decided against.

The rendered email lands in maildev at
[localhost:1080](http://localhost:1080), which also offers the raw source and a
downloadable `.eml`. Send that `.eml` to yourself in Outlook once before
shipping any template change: Outlook is where table-based email layouts break,
which is why the template uses spacer rows rather than margins.

### Iterating on the prompt

Getting the tone right is most of the work, and it is not the email or the
GitHub call that needs iterating. Call `generateDigestItems` directly against a
fixed array of pull requests rather than running the whole cycle each time.

The target register is "Save your progress and finish later", not "Implement
draft persistence for form builder".

## Before this can send to real admins

1. Move approval from a curl to a person — Slack, or an admin-facing view. The
   endpoint and the states it moves between already exist; what is missing is a
   way to approve that is not a shared secret in a terminal.
2. Resolve real recipients, and gate them on a GrowthBook flag. `adminEmail` is
   already an established targeting attribute on the backend, so an email
   whitelist is a targeting rule rather than new machinery.
3. Replace preview-only delivery with Postman.
4. Detect feature flag rollout so items are announced when users actually get
   them, not when the code merges. Most features land switched off, and the
   moment they are switched on leaves no trace in the repository.
