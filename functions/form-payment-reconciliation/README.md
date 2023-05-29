# Form Payment Reconciliation

This function performs a payment reconciliation flow. There are two things that need to be done in this flow:

- reconcile our payment statuses with Stripe's payment intent statuses, and
- cancel payment intents older than 30 min.

## Deployment

### How to deploy

There are two ways to deploy this lambda.

#### Using the CLI

Start an AWS session via the CLI.

```
aws sts get-session-token --serial-number <mfa device serial number> --token-code <6 digit mfa code>
```

This should provide you with an AWS access key id, secret access key and session token. Then run

```
export AWS_ACCESS_KEY_ID=<access key id>
export AWS_SECRET_ACCESS_KEY=<secret access key>
export AWS_SESSION_TOKEN=<session token>
```

Now, run

```
npm run lambda:update:{ENV}
```

where `{ENV}` can be one of `['prod', 'staging', 'staging-alt', 'staging-alt2', 'uat']`.

#### Manually

To deploy manually, package the contents of this folder and upload them to AWS Lambda.

### Environment variables

The following environment variables are required within the Lambda itself:

- `SSM_ENV_SITE_NAME`: `['prod', 'staging', 'staging-alt', 'staging-alt2', 'uat']`

The required API secrets are stored in AWS Systems Manager Parameter Store, in the `{SSM_ENV_SITE_NAME}-cron-payment` parameter.

- `CRON_PAYMENT_API_SECRET`: a random string used to validate requests from the CRON job to the backend API.
- `SLACK_API_SECRET`: secret key provided by Slack to send compressed audit reports.

## Notes

This section contains notes about the logic of the function itself as well as corresponding routes in the main server code that perform the function. In particular, the backend API routes that serve this CRON job are:

- `GET /payments/reconcile/incompletePayments`
- `POST /payments/reconcile/account/:stripeAccount`

### Terminology

We consider an "incomplete" payment to be either in the `Pending` or `Failed` state. On Stripe's end, this would correspond to a `requires_*` payment intent status.

### Basic structure

Some considerations:

- We want the CRON job to run every half an hour, reconciling payment intents as it goes along. The key requirement is that every payment must have its status reconciled. (We only care about the pending state transitions, i.e. pending -> failed, pending -> succeeded and failed -> succeeded.)
- Since payment intents don't expire, cut-off times for payment creation actually don't do anything other than reduce the likelihood of race conditions. The race conditions are still not eliminated, and as we have experienced previously by Murphy's law, reducing the possibility is not enough. (Concretely, say the CRON ran at time T, and we only reconcile payments created before T-5, assuming most payments are complete within 5 min. No matter when the payment was created, either before T-5 or between T-5 and T, a user could still be trying to pay at time T, thus causing a race condition with status retrieval.) What this tells us is that having a min-age for payments doesn't affect correctness.
- Since events are the primary method which allow payment statuses to be advanced, we can trigger payment movement by ensuring that FormSG receives and correctly processes all Stripe events. By re-sending all failed event deliveries, we are guaranteed\* that we are consistent with Stripe.
- Nonetheless, we still want to have an explicit correctness guarantee, so at the end of the day we still need to check that "`stripe.payment_intent.status === formsg.payment.status`".

\*Assuming that our state machine is also consistent with Stripe.

Given this, the strategy is for the CRON job to simulate being a Stripe server and send events to FormSG servers, which will execute the exact same processing flow as the Stripe server.

Here is the plan of attack. First we devise a solution to ensure that the information in the DB is correct. Assume the CRON job runs once every 30 min, at time T.

1. Retrieve all payments still in pending states. Group them by Stripe accounts. For each Stripe account, do the following:
2. Retrieve from stripe all undelivered events [1]
3. Process all the undelivered events
4. Double-check each payment status with the Stripe payment status [2]

There are several things of note here.

[1] A race condition could occur here, as pointed out earlier. If a payment is being sent at the point when the CRON job is run, part of the undelivered events may include the latest in-flight event. Or, an undelivered event may be in progress of being retried at the point when the CRON job is run. However, regardless of the race condition, this works because the event handler is idempotent. We also check for duplicate events and return 200 OK in the webhook handler, so even if Stripe retries the event later on, or our event is the later one to have arrived, both will return the response with the latest payment.

[2] This is another place that a race condition could occur. Say that during Step 3, a payment was moved to completion. However, the webhook has not arrived yet. Then at Step 4, the status on Stripe would be a success while the status on Form would still be pending. This would result in a discrepancy that could be reconciled in a future CRON job. Nonetheless, at this point, it would still be considered as incorrect and will be flagged for manual checking.

### Cancelling payments

Retrieving all pending payments will make increasingly less sense, as this is a set that grows monotonically. We need to have a way to reduce the size of this set eventually. We want to cancel pending payments that are expired, after at least 30 min. Therefore, this flow has to be integrated with the payment cancellation flow.

Since we should only cancel payments that have been reconciled and verified to be still in pending states even on Stripe, we can modify the process to be the following.

4. Double-check each payment status with the Stripe payment status
   a. If the Stripe payment status is still pending, the FormSG payment status cannot be anything other than pending (otherwise our state machine is definitely incorrect!). If the payment is stale (i.e. 30 min has passed since creation), Cancel the payment. Otherwise, do nothing.
   b. If the Stripe payment status is successful and FormSG payment status is also successful, then reconciliation was successful and no further action needs to be taken.
   c. If the Stripe payment status is successful and FormSG payment status is pending, then report an error. A race condition likely occurred, and will be reconciled by a future webhook or the next CRON job.
