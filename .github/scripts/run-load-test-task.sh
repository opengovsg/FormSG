#!/usr/bin/env bash

set -euo pipefail

TASK_DEFINITION=""
CONTAINER=""
COMMAND=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task-definition)
      TASK_DEFINITION="$2"
      shift 2
      ;;
    --container)
      CONTAINER="$2"
      shift 2
      ;;
    --command)
      COMMAND="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

: "${TASK_DEFINITION:?--task-definition is required}"
: "${CONTAINER:?--container is required}"
: "${COMMAND:?--command is required}"
: "${ECS_CLUSTER:?ECS_CLUSTER must be set}"
: "${AWS_REGION:?AWS_REGION must be set}"
: "${SUBNETS:?SUBNETS must be set, as a comma-separated list}"
: "${SECURITY_GROUP:?SECURITY_GROUP must be set}"

POLL_INTERVAL_SECONDS=15
MAX_WAIT_SECONDS=${MAX_WAIT_SECONDS:-3600}

overrides=$(
  jq -cn --arg name "$CONTAINER" --arg cmd "$COMMAND" \
    '{containerOverrides: [{name: $name, command: ($cmd | split(","))}]}'
)

echo "Starting $CONTAINER on $TASK_DEFINITION"
task_arn=$(
  aws ecs run-task \
    --cluster "$ECS_CLUSTER" \
    --launch-type FARGATE \
    --task-definition "$TASK_DEFINITION" \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNETS}],securityGroups=[${SECURITY_GROUP}],assignPublicIp=DISABLED}" \
    --overrides "$overrides" \
    --query 'tasks[0].taskArn' \
    --output text
)

if [[ -z "$task_arn" || "$task_arn" == "None" ]]; then
  echo "::error::run-task returned no task ARN"
  exit 1
fi

task_id="${task_arn##*/}"
echo "Task $task_id started"

log_options=$(
  aws ecs describe-task-definition --task-definition "$TASK_DEFINITION" --output json \
    | jq -c --arg name "$CONTAINER" \
      '.taskDefinition.containerDefinitions[] | select(.name == $name) | .logConfiguration.options // {}'
)
log_group=$(echo "$log_options" | jq -r '."awslogs-group" // empty')
log_stream_prefix=$(echo "$log_options" | jq -r '."awslogs-stream-prefix" // empty')
log_stream=""
if [[ -n "$log_group" && -n "$log_stream_prefix" ]]; then
  log_stream="${log_stream_prefix}/${CONTAINER}/${task_id}"
  echo "Logs: ${log_group} ${log_stream}"
fi

print_log_tail() {
  [[ -n "$log_stream" ]] || return 0
  echo "::group::Last 100 log lines from $CONTAINER"
  aws logs get-log-events --log-group-name "$log_group" --log-stream-name "$log_stream" \
    --limit 100 --query 'events[].message' --output text 2>&1 | tr '\t' '\n' || true
  echo "::endgroup::"
}

waited=0
while true; do
  status=$(
    aws ecs describe-tasks --cluster "$ECS_CLUSTER" --tasks "$task_arn" \
      --query 'tasks[0].lastStatus' --output text
  )
  if [[ "$status" == "STOPPED" ]]; then
    break
  fi
  if (( waited >= MAX_WAIT_SECONDS )); then
    echo "::error::Task $task_id still $status after ${MAX_WAIT_SECONDS}s, stopping it"
    aws ecs stop-task --cluster "$ECS_CLUSTER" --task "$task_arn" >/dev/null
    exit 1
  fi
  sleep "$POLL_INTERVAL_SECONDS"
  waited=$(( waited + POLL_INTERVAL_SECONDS ))
done

task=$(aws ecs describe-tasks --cluster "$ECS_CLUSTER" --tasks "$task_arn" --output json)
exit_code=$(
  echo "$task" | jq -r --arg name "$CONTAINER" \
    '.tasks[0].containers[] | select(.name == $name) | .exitCode // "null"'
)
stopped_reason=$(echo "$task" | jq -r '.tasks[0].stoppedReason // "unknown"')

case "$exit_code" in
  0)
    echo "$CONTAINER passed"
    ;;
  99)
    print_log_tail
    echo "::error::A threshold was breached. This is a finding, not a broken job."
    exit 1
    ;;
  null)
    print_log_tail
    echo "::error::$CONTAINER never reported an exit code. Stopped reason: ${stopped_reason}"
    exit 1
    ;;
  *)
    print_log_tail
    echo "::error::$CONTAINER exited ${exit_code}, so the script itself broke rather than the target. Stopped reason: ${stopped_reason}"
    exit 1
    ;;
esac
