# PR #10633 capture steps

Captured with browser UI controls. This is a replay checklist, not an executable agent-browser script.

## Setup and comparison

- Before frontend: baseline `7e93bc663e`; after frontend: `6998d48da`.
- Use the same local backend and same fixture forms for app screenshots. Enable the two preview flags on both sides through the local harness.
- Use a 1280 × 720 browser viewport. Match the form, step and page state before capturing each pair.
- These local flags do not enable shared GrowthBook or Render flags.
- Warning media uses the existing Storybook `pages-adminformpage-create-workflowtab--step-login-mixed-providers` fixture on each frontend, not a live form.

## App screenshots and recordings

1. Open the equipment-request form, Workflow, Requester step. Capture the default step editor before and after. Open Assigned fields where needed for the supplementary baseline screenshot. On the current frontend, record independently opening and collapsing Assigned fields and Login; capture collapsed summaries.
2. Open Settings → Login on that form. Capture before and after. On the current frontend, record the Finance step changing from no login to Singpass, wait for saved confirmation, then restore no login and wait for saved confirmation.
3. Open Create fields on the empty test form with no steps and no login. Capture the Singpass panel before and after. On the current frontend, select an unavailable Singpass field, capture the setup modal, and record following Go to Login Settings.
4. Open Create fields on the equipment-request form. Select a Corppass field while Corppass is unavailable, capture the modal, and record following Go to Workflow. Do not add fields or steps during capture.

## Warning fixture

1. Open the existing mixed-provider Storybook fixture, edit Approving officer, and open Login.
2. Select Singpass while the step uses Corppass. Capture the warning on baseline and current frontend.
3. On current frontend record opening the warning, reading it, and cancelling. Do not confirm field deletion.

## Recording format

Capture browser frames continuously at approximately 5 fps and store their timestamps in each clip's `frames.json`. Encode with `/tmp/formsg-encode-browser-frames.py`, preserving actual timestamp intervals and a median-interval hold on the final frame. H264, yuv420p, MP4 faststart, no audio. These are browser-frame recordings, not full-frame-rate motion capture.
