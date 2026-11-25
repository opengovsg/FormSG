# Let load tests past the per-IP rate limits with a shared-secret header

The nightly k6 run sends every request from UAT's single NAT IP. FormSG's `limitRate` limiters are per IP and per task: UAT allows 200 submissions a minute and 60 OTP requests a minute. So a run of a few submissions a second turns into a stream of 429s within seconds.

We considered raising `SUBMISSIONS_RATE_LIMIT` on UAT instead. We rejected it because the limit would be weakened for all UAT traffic for good. UAT would then stop exercising the limiter, and UAT is where we rehearse production changes.

A per-request header keeps the limits on for every caller except the one that presents the secret.

## Consequences

- `limitRate` gains a `skip` that returns true when `x-load-test-key` matches `rateLimit.loadTestBypassKey` (env `LOAD_TEST_BYPASS_KEY`, empty by default).
- The bypass is refused outright when `envSiteName` is `prod`, and also when `envSiteName` is unset outside dev. UAT and prod both run with `NODE_ENV=production` in the same AWS account, so `NODE_ENV` cannot tell them apart.
- The same check skips the fire-and-forget WOGAA calls on form view, submit and feedback, so a run does not send its rate on to WOGAA's staging.
- `deploy/ecs-task-definition.json` is shared by every environment, so formsg-infra creates `/<site>/LOAD_TEST_BYPASS_KEY` with a random value in every stack. Production's value is never read. The infra change has to be applied in every account before the task definition change deploys anywhere, or task registration fails.
- The header is redacted in `createReqMeta` and blacklisted in the network logger, so the key never reaches logs or Datadog.
- Captcha is not bypassed. The fixture forms set `hasCaptcha: false`.
- Anyone holding the UAT key can exhaust UAT. That is the accepted trade.
