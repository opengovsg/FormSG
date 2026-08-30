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

`POST /api/v3/cron/generate-digest` runs one cycle:

1. Work out the window: everything merged since the last digest was **sent**.
2. Fetch pull requests merged into `develop` during it.
3. Ask Claude for every change a form admin would care about, ranked most
   notable first.
4. If there are at least three, email the best three to
   `CHANGELOG_PREVIEW_RECIPIENT` and record the send. Otherwise send nothing.
5. Post the outcome to Slack for review.

## Holding items over

The cycle is meant to run weekly, but it does not send weekly. A digest carries
exactly three items or it does not go out, and the number is the same in both
directions on purpose: a digest of one or two items reads as though we had
nothing to say.

When a cycle finds too few, it records nothing. The watermark stays where it
was, so the next cycle's window still starts at the last _sent_ digest and those
changes are reconsidered alongside whatever is new. Two quiet weeks of two items
each therefore produce one digest of the best three, not two thin ones — the
generator ranks the combined four and the service takes the top three.

The consequence worth knowing: a genuinely notable change can sit unannounced
for as long as it takes two more to land. There is deliberately no maximum age
yet. If that becomes a problem the fix is a staleness escape hatch, not a lower
bar.

The route follows the RPC-shaped convention for scheduled jobs: one route is one
job's entire unit of work, authenticated with a shared secret rather than a user
session. In production a scheduler would call it; for now a person does.

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
- **Every run emails one person.** Scheduled and manual runs take the same path
  and reach the same single configured address.

## Configuration

| Variable                      | Purpose                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| `CRON_CHANGELOG_API_SECRET`   | Shared secret for the route. An unset secret authenticates nobody. |
| `ANTHROPIC_API_KEY`           | Drafting the items.                                                |
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

Stories live in `packages/react-email-preview/stories/`. They cover three items,
one item, no unsubscribe link, and long copy, which is where the card layout is
most likely to break.

### Running a full cycle

```sh
docker compose up

curl -X POST localhost:5001/api/v3/cron/generate-digest \
  -H 'Content-Type: application/json' \
  -H "x-formsg-cron-changelog-secret: $CRON_CHANGELOG_API_SECRET" \
  -d '{"since":"2026-08-01","until":"2026-08-15"}'
```

Omit the body to cover everything merged since the last digest was sent, which
is what a scheduled run does. Supplying a window is how you reproduce a
particular week without waiting for one — note that it bypasses the watermark,
so a windowed run that sends will still move it. `since` and `until` must be given
together.

The response body is the draft itself, so a run can be inspected without opening
anything else. The rendered email lands in maildev at
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

1. Persist a watermark, or consecutive runs repeat themselves.
2. Add the approval step.
3. Replace preview-only delivery with Postman.
4. Add a scheduler that calls the route.
5. Detect feature flag rollout so items are announced when users actually get
   them, not when the code merges. Most features land switched off, and the
   moment they are switched on leaves no trace in the repository.
