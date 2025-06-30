# 🏛️ Government Masthead

This document clarifies **branding requirements** for any deployment or fork of FormSG.

## 🚫 Prohibited Use of Singapore Government Masthead

FormSG is open source, but **you must not use the official Singapore Government masthead or associated branding** in deployments outside authorized Singapore Government contexts.

![singapore-gov-masthead](image.png)

## Why This Matters

The masthead and official brand assets:
- Signal trust and authority to citizens
- Are regulated under Singapore law
- Could mislead end users of your deployment

Using them without authorization can:
- Create confusion about the legitimacy of your service
- Violate branding policies
- Trigger takedown or legal action

## What You MUST Do

If you fork or deploy FormSG:
- **Remove or replace the masthead** in all templates and front-end code
- Clearly indicate your deployment is *not* affiliated with the Singapore Government
- Use your own branding and disclaimers

## How to Remove the Masthead

In the source code:
- Check the React layout components for `GovtMasthead` references <!-- should be <GovtMasthead /> only? -->
- Remove or replace them with your own banner
- Audit CSS and static assets for `.gov.sg` logos
