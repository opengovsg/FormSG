### Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [8.0.2](https://github.com/opengovsg/formsg/compare/sdk-v8.0.1...sdk-v8.0.2) (2026-08-06)


### Bug Fixes

* use tsconfigRootDir in SDK eslint config so pre-commit hook works (#9828) ([#9828](https://github.com/opengovsg/formsg/commit/b050e6ac899893b8d7618043e897189a9707f062))

## [8.0.1](https://github.com/opengovsg/formsg/compare/sdk-v8.0.0...sdk-v8.0.1) (2026-07-31)


### Bug Fixes

* **sdk:** improve large attachment decryption and handling (#9802) ([#9802](https://github.com/opengovsg/formsg/commit/a44f1e9cd351d951de61d888d76616b073e40b35))

## [8.0.0](https://github.com/opengovsg/formsg/compare/sdk-v7.7.0...sdk-v8.0.0) (2026-07-30)


### ⚠ BREAKING CHANGE

* **mrf:** MRF submissions are sent with version: 4 and
V4-shaped responses on the wire.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

* feat(frontend): make V4 the FE working format for previous MRF responses

decryptSubmission now serves previous-step responses as V4: V4 blobs
(mrfVersion 2) pass through untouched and V3 blobs (mrfVersion 1 /
legacy) are adapted up via the SDK's adaptV3ToV4 — the inverse of the
old behavior, which downgraded V4 to V3 as the working format.

extractMrfPreviousStepResponseValue is rewritten as the inverse of
createResponsesV4 (V4 answer shapes → form input values); the old
version relied on V3 shapes coinciding with input values, which does
not hold for V4. A round-trip test pins inputs → createResponsesV4 →
extract as the identity for every prefillable field type, since step
N+1 re-submits non-editable values through this exact loop.

Legacy pre-mrfVersion submissions embed attachment content inside the
encrypted blob; adaptV3ToV4 drops that key, so decryptSubmission now
harvests it pre-adaptation (legacyAttachmentContents) for the
provider's backward-compat path.

Also drops the previousResponses prop on FormFields, which was unused.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

* chore: clean up comments

* feat: make joi validation for provenance default to {}

* feat: Update apps/frontend/src/features/public-form/utils/decryptSubmission.ts

Co-authored-by: Eliot Lim <eliotlim@users.noreply.github.com>

### Features

* **mrf:** V4 response migration — PR 3/5 FE sends and works in V4 (#9782) ([#9782](https://github.com/opengovsg/formsg/commit/8929c1dce7379d2ab0e847719bb383ec13c41f32))

## [7.7.0](https://github.com/opengovsg/formsg/compare/sdk-v7.6.0...sdk-v7.7.0) (2026-07-29)


### Features

* **mrf:** step-token write-guard for MRF next-step submissions (S3) (#9758) ([#9758](https://github.com/opengovsg/formsg/commit/9b124b4018b7eac81de53448d327c185b3839702))

## [7.6.0](https://github.com/opengovsg/formsg/compare/sdk-v7.5.0...sdk-v7.6.0) (2026-07-23)


### Features

* reland v4 BE handling (reverts #9775) (#9785) ([#9775](https://github.com/opengovsg/formsg/commit/ed6bbd3fa548ce2d3d2d877bc04b398e9a3765ea))

## [7.5.0](https://github.com/opengovsg/formsg/compare/sdk-v7.4.1...sdk-v7.5.0) (2026-07-22)


### Features

* v4 be cherry pick commits (#9776) ([#9776](https://github.com/opengovsg/formsg/commit/fa29b661a6735ec36335b8873bba3865e549f320))

## [7.4.1](https://github.com/opengovsg/formsg/compare/sdk-v7.4.0...sdk-v7.4.1) (2026-07-22)


### Chores

* revert v4 be (#9775) ([#9775](https://github.com/opengovsg/formsg/commit/cdc25de38ec1ac6ed708ecbe612aff30cf5c28ba))

## [7.4.0](https://github.com/opengovsg/formsg/compare/sdk-v7.3.2...sdk-v7.4.0) (2026-07-20)


### Features

* **mrf:** V4 response migration — PR 2/5 BE V4-native + V3 wire shim (#9637) ([#9637](https://github.com/opengovsg/formsg/commit/2a47c47e707d5c429257092c9b9ce78f3ff8e118))

## [7.3.2](https://github.com/opengovsg/formsg/compare/sdk-v7.3.1...sdk-v7.3.2) (2026-07-16)


### Chores

* speed up jest runs by removing default local code coverage collection (#9757) ([#9757](https://github.com/opengovsg/formsg/commit/ab6c7015033aa970d633e642d6343c296ec375b2))

## [7.3.1](https://github.com/opengovsg/formsg/compare/sdk-v7.3.0...sdk-v7.3.1) (2026-06-10)


### Miscellaneous

* Merge pull request #9577 from opengovsg/feat/v4-encryption-improvements ([#9577](https://github.com/opengovsg/formsg/commit/f79c81e413546eb0408aa4eda2b479bb2904c5d9))

## [7.3.0](https://github.com/opengovsg/formsg/compare/sdk-v7.1.4...sdk-v7.3.0) (2026-06-08)


### Features

* answer object decryption (#9371) ([#9371](https://github.com/opengovsg/formsg/commit/7f630e84c519c50e3a76372941d1f731295f3c28))
* answer object encryption (#9502) ([#9502](https://github.com/opengovsg/formsg/commit/ebe965c733d8f73114b2f0ea2fdcfeb6c0ba3f1b))


### Chores

* **sdk:** bump version to 7.2.0 ([29f230e](https://github.com/opengovsg/formsg/commit/29f230e9b6c2bef26fe2b61129d804666e32c1ec))

## [7.2.0](https://github.com/opengovsg/formsg/compare/sdk-v7.1.4...sdk-v7.2.0) (2026-06-04)


### Features

* answer object decryption (#9371) ([#9371](https://github.com/opengovsg/formsg/commit/7f630e84c519c50e3a76372941d1f731295f3c28))
* answer object encryption (#9502) ([#9502](https://github.com/opengovsg/formsg/commit/ebe965c733d8f73114b2f0ea2fdcfeb6c0ba3f1b))

## [7.1.4](https://github.com/opengovsg/formsg/compare/sdk-v7.1.3...sdk-v7.1.4) (2026-04-27)


### Bug Fixes

* **sdk:** bump axios 1.15.2 (#9358) ([#9358](https://github.com/opengovsg/formsg/commit/ed2ec2f54ec5d94948818eaaf060534c37af6fae))

## [7.1.3](https://github.com/opengovsg/formsg/compare/sdk-v7.1.2...sdk-v7.1.3) (2026-04-20)

## [7.1.2](https://github.com/opengovsg/formsg/compare/sdk-v7.1.1...sdk-v7.1.2) (2026-04-16)


### Miscellaneous

* Merge pull request #9313 from opengovsg/release-al2 ([#9313](https://github.com/opengovsg/formsg/commit/41732190ff796e8d0bb10fbfea09cf6459547971))
* Merge pull request #9314 from opengovsg/fix/sdk/update-repository-provenance ([#9314](https://github.com/opengovsg/formsg/commit/13b992929b59b2bcbfae00e8a371fcfb4ac0087a))

## [7.1.1](https://github.com/opengovsg/formsg/compare/sdk-v7.1.0...sdk-v7.1.1) (2026-04-16)

## 7.1.0 (2026-04-16)


### Features

* **sdk:** bump axios 1.15.0 ([fb4d837](https://github.com/opengovsg/formsg/commit/fb4d8372a31ef0f38ebaf9e286efa17ddd9a8b72))
* **sdk:** enable publishing (#9305) ([#9305](https://github.com/opengovsg/formsg/commit/7b48aa5e1dd65b8e38d6090e7a135fdeb5267e89))
* **sdk:** migrate sdk monorepo (#9221) ([#9221](https://github.com/opengovsg/formsg/commit/0e7e721429f22737b980adb8ec03bd915b4562ff))

### Changelog

All notable changes to this project will be documented in this file. Dates are displayed in UTC.

Generated by [`auto-changelog`](https://github.com/CookPete/auto-changelog).

#### [v0.16.1](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.16.0...v0.16.1)

- remove version tagging in publish script [`#131`](https://github.com/opengovsg/formsg-javascript-sdk/pull/131)
- build: merge release to develop [`#130`](https://github.com/opengovsg/formsg-javascript-sdk/pull/130)
- Release v0.16.0 [`#129`](https://github.com/opengovsg/formsg-javascript-sdk/pull/129)

#### [v0.16.0](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.15.0...v0.16.0)

> 3 November 2025

- build: merge release to develop [`#125`](https://github.com/opengovsg/formsg-javascript-sdk/pull/125)
- fix: publish workflow [`#124`](https://github.com/opengovsg/formsg-javascript-sdk/pull/124)
- release: v0.15.0 [`#123`](https://github.com/opengovsg/formsg-javascript-sdk/pull/123)
- add publish script for OIDC support [`#122`](https://github.com/opengovsg/formsg-javascript-sdk/pull/122)
- build: release v0.9.0 - webhook attachments, linting, GitHub Actions [`#71`](https://github.com/opengovsg/formsg-javascript-sdk/pull/71)
- build: Release 0.8.4 - TypeScript refactor [`#57`](https://github.com/opengovsg/formsg-javascript-sdk/pull/57)
- resync version number [`03bab2a`](https://github.com/opengovsg/formsg-javascript-sdk/commit/03bab2a77bab200aa45fee7464839e2be2ab8e7d)

#### [v0.15.0](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.13.0...v0.15.0)

> 30 September 2025

- feat: add verified content to v3 [`#121`](https://github.com/opengovsg/formsg-javascript-sdk/pull/121)
- chore: remove build status from README.md [`#120`](https://github.com/opengovsg/formsg-javascript-sdk/pull/120)
- feat: add signature to supported form fields [`#118`](https://github.com/opengovsg/formsg-javascript-sdk/pull/118)
- fix: upgrade actions/cache [`#115`](https://github.com/opengovsg/formsg-javascript-sdk/pull/115)
- Release v0.13.0 [`#114`](https://github.com/opengovsg/formsg-javascript-sdk/pull/114)
- updated readme with address answerArray [`#112`](https://github.com/opengovsg/formsg-javascript-sdk/pull/112)
- build(deps-dev): bump braces from 3.0.2 to 3.0.3 [`#109`](https://github.com/opengovsg/formsg-javascript-sdk/pull/109)
- build(deps): bump follow-redirects from 1.15.4 to 1.15.6 [`#107`](https://github.com/opengovsg/formsg-javascript-sdk/pull/107)
- add signature to supported form fields [`31db628`](https://github.com/opengovsg/formsg-javascript-sdk/commit/31db628ce44e009b5c19f8c9910bd997d77df586)

#### [v0.13.0](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.12.0...v0.13.0)

> 15 January 2025

- add address to field type [`#111`](https://github.com/opengovsg/formsg-javascript-sdk/pull/111)

#### [v0.12.0](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.12.0-alpha.1...v0.12.0)

> 9 September 2024

- build(deps): bump axios from 1.6.4 to 1.7.4 [`#110`](https://github.com/opengovsg/formsg-javascript-sdk/pull/110)
- chore: update readme for paymentContent [`#105`](https://github.com/opengovsg/formsg-javascript-sdk/pull/105)
- fix: package.json & package-lock.json to reduce vulnerabilities [`#103`](https://github.com/opengovsg/formsg-javascript-sdk/pull/103)

#### [v0.12.0-alpha.1](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.11.0...v0.12.0-alpha.1)

> 15 December 2023

- build: bump version to 0.12.0-alpha.1 [`#102`](https://github.com/opengovsg/formsg-javascript-sdk/pull/102)
- feat: mrf crypto [`#101`](https://github.com/opengovsg/formsg-javascript-sdk/pull/101)

#### [v0.11.0](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.10.0...v0.11.0)

> 6 December 2023

- build: bump version to 0.11.0 [`#100`](https://github.com/opengovsg/formsg-javascript-sdk/pull/100)
- Create LICENSE [`#95`](https://github.com/opengovsg/formsg-javascript-sdk/pull/95)
- chore: upgrade axios to 1.6.2 [`#93`](https://github.com/opengovsg/formsg-javascript-sdk/pull/93)
- build(deps-dev): bump @babel/traverse from 7.16.3 to 7.23.3 [`#99`](https://github.com/opengovsg/formsg-javascript-sdk/pull/99)
- build(deps-dev): bump word-wrap from 1.2.3 to 1.2.5 [`#97`](https://github.com/opengovsg/formsg-javascript-sdk/pull/97)
- Update ci.yml [`#96`](https://github.com/opengovsg/formsg-javascript-sdk/pull/96)
- chore(readme): add wording for period inclusion of unstable fields [`#94`](https://github.com/opengovsg/formsg-javascript-sdk/pull/94)
- Update README.md to include existence of sister SDks [`#90`](https://github.com/opengovsg/formsg-javascript-sdk/pull/90)
- fix: upgrade axios from 0.24.0 to 0.25.0 [`#81`](https://github.com/opengovsg/formsg-javascript-sdk/pull/81)
- build(deps): bump json5 from 1.0.1 to 1.0.2 [`#88`](https://github.com/opengovsg/formsg-javascript-sdk/pull/88)
- build: release v0.10.0 [`#87`](https://github.com/opengovsg/formsg-javascript-sdk/pull/87)
- docs: add changelog and version script [`f207c3e`](https://github.com/opengovsg/formsg-javascript-sdk/commit/f207c3e42cb81347e1fbb9a080f506d6373b54df)

#### [v0.10.0](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.9.0...v0.10.0)

> 16 December 2022

- fix: allow empty field titles in decrypted responses [`#86`](https://github.com/opengovsg/formsg-javascript-sdk/pull/86)
- chore: run npm audit fix and update relevant deps [`#80`](https://github.com/opengovsg/formsg-javascript-sdk/pull/80)
- chore(deps): Upgrade vulnerable axios version [`#78`](https://github.com/opengovsg/formsg-javascript-sdk/pull/78)
- chore: merge v0.9.0 into develop [`#76`](https://github.com/opengovsg/formsg-javascript-sdk/pull/76)
- fix: run npm audit fix so typescript packages are the correct versions [`2bdbf89`](https://github.com/opengovsg/formsg-javascript-sdk/commit/2bdbf897614833cc50605554ddaa82ea567b8a09)
- chore: bump version to v0.10.0 [`e094041`](https://github.com/opengovsg/formsg-javascript-sdk/commit/e0940414e529012afc03c54165f82e9f5ce16b12)

#### [v0.9.0](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.8.2...v0.9.0)

> 16 December 2022

- build: add separate keypairs for dev environment [`#73`](https://github.com/opengovsg/formsg-javascript-sdk/pull/73)
- docs: specify version for attachment functionality [`#72`](https://github.com/opengovsg/formsg-javascript-sdk/pull/72)
- build(ci): migrate to GitHub Actions [`#70`](https://github.com/opengovsg/formsg-javascript-sdk/pull/70)
- refactor(crypto): minor refactor of decryptWithAttachments [`#69`](https://github.com/opengovsg/formsg-javascript-sdk/pull/69)
- feat: Adding eslint functionality for the repository [`#66`](https://github.com/opengovsg/formsg-javascript-sdk/pull/66)
- build(deps): bump lodash from 4.17.19 to 4.17.21 [`#64`](https://github.com/opengovsg/formsg-javascript-sdk/pull/64)
- add downloadAndDecryptAttachments for downloading and decrypting attachments [`#62`](https://github.com/opengovsg/formsg-javascript-sdk/pull/62)
- build(deps): bump y18n from 4.0.0 to 4.0.1 [`#59`](https://github.com/opengovsg/formsg-javascript-sdk/pull/59)
- Update README.md [`#61`](https://github.com/opengovsg/formsg-javascript-sdk/pull/61)
- build: merge Release 0.8.4 back to develop branch [`#58`](https://github.com/opengovsg/formsg-javascript-sdk/pull/58)
- build: release v0.8.4-beta.0 [`#56`](https://github.com/opengovsg/formsg-javascript-sdk/pull/56)
- Revert "build(npm): update repo entry (#43)" [`#55`](https://github.com/opengovsg/formsg-javascript-sdk/pull/55)
- fix: update .npmignore to ignore misc unneeded files [`#54`](https://github.com/opengovsg/formsg-javascript-sdk/pull/54)
- ref: use mode init parameter again [`#52`](https://github.com/opengovsg/formsg-javascript-sdk/pull/52)
- chore: Update JSDoc and print warning message if deprecated mode parameter is used [`#51`](https://github.com/opengovsg/formsg-javascript-sdk/pull/51)
- fix(FormField): account for table responses [`#44`](https://github.com/opengovsg/formsg-javascript-sdk/pull/44)
- build(npm): update repo entry [`#43`](https://github.com/opengovsg/formsg-javascript-sdk/pull/43)
- feat: add more webhook tests to check for undefined params [`#41`](https://github.com/opengovsg/formsg-javascript-sdk/pull/41)
- Bump lodash from 4.17.15 to 4.17.19 [`#42`](https://github.com/opengovsg/formsg-javascript-sdk/pull/42)
- fix: JSON body parser required for demo code to work [`#40`](https://github.com/opengovsg/formsg-javascript-sdk/pull/40)
- refactor: update verification HOF to Verification class [`#38`](https://github.com/opengovsg/formsg-javascript-sdk/pull/38)
- refactor: update crypto HOF to Crypto class [`#36`](https://github.com/opengovsg/formsg-javascript-sdk/pull/36)
- refactor: update webhooks HOF to Webhooks class [`#34`](https://github.com/opengovsg/formsg-javascript-sdk/pull/34)
- docs: fix code snippet typos [`#37`](https://github.com/opengovsg/formsg-javascript-sdk/pull/37)
- feat: add publicKey param to package initialization parameters [`#33`](https://github.com/opengovsg/formsg-javascript-sdk/pull/33)
- chore: add `test-ci` script for Travis to run instead of `test` [`#32`](https://github.com/opengovsg/formsg-javascript-sdk/pull/32)
- Release 0.8.3 - Allow tolerance for clock drift when authenticating webhooks [`#47`](https://github.com/opengovsg/formsg-javascript-sdk/pull/47)
- fix(epoch): allow for possible clock drift [`a3ce917`](https://github.com/opengovsg/formsg-javascript-sdk/commit/a3ce917c6c38a387edcfad06ae5176b1f92b0a46)
- fix(epoch): allow for possible clock drift [`5ba253d`](https://github.com/opengovsg/formsg-javascript-sdk/commit/5ba253d61d04d3082f4d752ecfc9efd3639acc0f)
- chore: bump version to 0.9.0 [`32111b1`](https://github.com/opengovsg/formsg-javascript-sdk/commit/32111b1a2c85955a33d478dbc06966dda7261e33)

#### [v0.8.2](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.4.1...v0.8.2)

> 4 June 2020

- Release v0.8.2 - Patch for encrypting non-UTF8 characters [`#35`](https://github.com/opengovsg/formsg-javascript-sdk/pull/35)
- Release v0.8.1 - Export types [`#29`](https://github.com/opengovsg/formsg-javascript-sdk/pull/29)
- Fix: Export declared types in the package [`#28`](https://github.com/opengovsg/formsg-javascript-sdk/pull/28)
- Replace tweetnacl-util with StableLib [`#27`](https://github.com/opengovsg/formsg-javascript-sdk/pull/27)
- v0.8.0 - Update decrypt signature [`#25`](https://github.com/opengovsg/formsg-javascript-sdk/pull/25)
- Test and build coverage badges with TravsiCI and Coveralls.io [`#23`](https://github.com/opengovsg/formsg-javascript-sdk/pull/23)
- chore: update README for increased clarity on decrypt [`#22`](https://github.com/opengovsg/formsg-javascript-sdk/pull/22)
- v0.7.0 - Verification module for SDK [`#19`](https://github.com/opengovsg/formsg-javascript-sdk/pull/19)
- fix: use req.get() in README sample code [`#21`](https://github.com/opengovsg/formsg-javascript-sdk/pull/21)
- Enforce minimum level of test coverage [`#20`](https://github.com/opengovsg/formsg-javascript-sdk/pull/20)
- Update encrypt/decryptFile function signature from blob to UInt8Array [`#18`](https://github.com/opengovsg/formsg-javascript-sdk/pull/18)
- Utility functions for attachments [`#17`](https://github.com/opengovsg/formsg-javascript-sdk/pull/17)
- Replace Joi with custom validation [`#16`](https://github.com/opengovsg/formsg-javascript-sdk/pull/16)
- Link GitHub to package.json [`#15`](https://github.com/opengovsg/formsg-javascript-sdk/pull/15)
- Fix broken links in readme [`#14`](https://github.com/opengovsg/formsg-javascript-sdk/pull/14)
- Extend crypto module for verified fields and migrate to TypeScript [`#12`](https://github.com/opengovsg/formsg-javascript-sdk/pull/12)
- Patch readme sample code [`#11`](https://github.com/opengovsg/formsg-javascript-sdk/pull/11)

#### [v0.4.1](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.4.0...v0.4.1)

> 30 March 2020

- Release v0.4.1 - Remove dangling reference to source in require [`#10`](https://github.com/opengovsg/formsg-javascript-sdk/pull/10)

#### [v0.4.0](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.3.2...v0.4.0)

> 30 March 2020

- Pre-publish transpile pipeline with Babel [`#9`](https://github.com/opengovsg/formsg-javascript-sdk/pull/9)

#### [v0.3.2](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.3.1...v0.3.2)

> 30 March 2020

- Avoid default arguments in destructuring [`#8`](https://github.com/opengovsg/formsg-javascript-sdk/pull/8)

#### [v0.3.1](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.3.0...v0.3.1)

> 30 March 2020

- Destructure options in the function body [`#7`](https://github.com/opengovsg/formsg-javascript-sdk/pull/7)

#### [v0.3.0](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.2.0...v0.3.0)

> 24 March 2020

- Release 0.3.0 [`#5`](https://github.com/opengovsg/formsg-javascript-sdk/pull/5)
- Add cryptographic functions to SDK [`#4`](https://github.com/opengovsg/formsg-javascript-sdk/pull/4)
- Update readme to clarify that this repository is the SDK and not the FormSG system. [`#3`](https://github.com/opengovsg/formsg-javascript-sdk/pull/3)

#### [v0.2.0](https://github.com/opengovsg/formsg-javascript-sdk/compare/v0.1.1...v0.2.0)

> 2 March 2020

- Version 0.2.0 - Add signing functions, end-to-end testing [`#2`](https://github.com/opengovsg/formsg-javascript-sdk/pull/2)

#### v0.1.1

> 2 March 2020

- Version 0.1.1 - Readme, configuration bugfix [`#1`](https://github.com/opengovsg/formsg-javascript-sdk/pull/1)
- Add signature authentication [`a23a6ff`](https://github.com/opengovsg/formsg-javascript-sdk/commit/a23a6ffee1aaa65f805207b3f7ed17ed05590010)
- gitignore [`1b288fa`](https://github.com/opengovsg/formsg-javascript-sdk/commit/1b288fa9cff6df70efb09bf477570159516605e1)
- install dependencies [`d8fc078`](https://github.com/opengovsg/formsg-javascript-sdk/commit/d8fc078b29ffb0043adbb105fe4a39abed5a8cf9)
