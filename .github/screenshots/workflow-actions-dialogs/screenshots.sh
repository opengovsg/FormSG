#!/usr/bin/env bash
set -euo pipefail
BASE_URL=${BASE_URL:-http://localhost:5175}
OUT=${OUT:-/tmp/workflow-actions-review-screenshots}
mkdir -p "$OUT"
python3 "$(dirname "$0")/build-harness.py"
agent-browser --session workflow-pr set viewport 1440 1100
agent-browser --session workflow-pr open "$BASE_URL/workflow-review-temp.html?variant=after&modal=assign"
agent-browser --session workflow-pr wait --text 'Assign new people to this step'
agent-browser --session workflow-pr find text 'Assign new people to this step' click --exact
agent-browser --session workflow-pr screenshot "$OUT/after-assign.png"
agent-browser --session workflow-pr find role button click --name 'Assign new people' --exact
agent-browser --session workflow-pr wait --text 'Enter at least one email address'
agent-browser --session workflow-pr screenshot "$OUT/after-assign-empty-error.png"
agent-browser --session workflow-pr open "$BASE_URL/workflow-review-temp.html?variant=after&modal=stop"
agent-browser --session workflow-pr wait --text 'Stop this workflow'
agent-browser --session workflow-pr find text 'Stop this workflow' click --exact
agent-browser --session workflow-pr screenshot "$OUT/after-stop.png"
agent-browser --session workflow-pr open "$BASE_URL/workflow-review-temp.html?variant=before&modal=assign"
agent-browser --session workflow-pr wait --text 'Current assignees can still respond.'
agent-browser --session workflow-pr find text 'Add someone to respond to this step. Current assignees can still respond.' click --exact
agent-browser --session workflow-pr screenshot "$OUT/before-assign.png"
agent-browser --session workflow-pr open "$BASE_URL/workflow-review-temp.html?variant=before&modal=stop"
agent-browser --session workflow-pr wait --text 'Who will be notified'
agent-browser --session workflow-pr find role textbox focus --name 'Any email addresses you choose(optional)'
agent-browser --session workflow-pr press Tab
agent-browser --session workflow-pr find text 'Stop this workflow?' click --exact
agent-browser --session workflow-pr screenshot "$OUT/before-stop.png"
agent-browser --session workflow-pr close
