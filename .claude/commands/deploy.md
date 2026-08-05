---
description: Monitor a deployment run — diagnose failures, drive a re-run to green, verify health.
argument-hint: '[staging|prod] [run-id]'
---

Monitor a deployment run — pinpoint why it failed, drive it to green on a re-run, and verify the app is serving. Deploys go through GitHub Actions (`workflow_dispatch` only); this command is about watching and diagnosing them, not replacing the pipeline.

## When this runs

Most deploys go green untouched and need no attention. The real use case is the other few percent: **a deploy failed, and you're re-running it and want eyes on this one.** Optimize for that — get to the failing job fast, classify it, fix the cause, re-trigger, and confirm the app is healthy afterward.

## Scope & guardrails

- **`gh` reads are free; the deploy trigger is not.** Reading runs, jobs, and logs (`gh run list/view/watch`) needs no confirmation. **Triggering or re-triggering a deploy** (`npm run deploy:*`, `gh workflow run`) is an outward-facing action — confirm the target (env + ref) with the user first, and default to watching a run they already started.
- **AWS is read-only here.** `describe-*` / `list-*` only. CloudFormation changes and stack deletions are the user's to run — never `create-stack`/`update-stack`/`delete-stack` directly.
- **Never deploy a feature branch to prod.** Production should ride a version tag or `release/*` branch produced by `create-release.yml`. **Nothing in the pipeline enforces this** — `prod.yml` has no ref guard, and `bin/deploy.sh` defaults to whatever you're currently on. So check the ref _before_ triggering, and when reviewing history (`gh run list --json headBranch,displayTitle`), flag any past prod run that rode a branch rather than a tag.
- **`bin/deploy.sh` defaults to the current branch.** `npm run deploy:prod` with no second argument deploys whatever branch is checked out. Always pass the ref explicitly for prod.
- **Output can be sensitive.** Failure logs name stack names, bucket names, App Runner ARNs, and account IDs. Don't paste raw infra detail into anything public; summarize.

## 1. Find the run

```bash
gh run list --workflow=staging.yml --limit 5     # or prod.yml
gh run view <run-id>                              # job-level status
gh run watch <run-id>                             # live, if it's in flight
```

The pipeline is a chain of dependent jobs, and the ordering is **serial by data dependency**, not parallel:

```
runner → test → create-deployment → deploy-s3 → build → deploy-app → deployment-successful
```

`deploy-s3` runs first because `build` needs its bucket outputs (static assets are uploaded and referenced by the image build), and `deploy-app` needs both the bucket outputs and the image tag. So a failure early in the chain means nothing downstream ran at all — find the **first** failed job.

Two gates worth knowing before you diagnose anything:

- **Staging is feature-flagged.** `staging.yml`'s first job is `if: vars.ENVIRONMENT_STAGING_ENABLED == 'true'`. If that variable isn't `true`, the whole run **skips** rather than fails — a run that "did nothing" almost instantly is this, not a broken workflow. Check `gh variable list`.
- **Prod is environment-gated.** `create-deployment` declares `environment: production`, so if required reviewers are configured on that GitHub Environment, the run **waits for approval** before any AWS mutation. A prod run sitting at "waiting" is working as designed.
- **Both environments share one concurrency group** (`roboledger-app-deploy`, `cancel-in-progress: false`). A staging deploy queues behind an in-flight prod deploy and vice versa. Don't fire a second deploy expecting it to preempt the first, and check for a queued run before concluding a deploy "isn't starting."

## 2. Pinpoint the failure

```bash
gh run view <run-id> --log-failed      # logs for only the failed step(s)
```

Classify by which stage broke — each has a different fix and blast radius:

- **`test`** — the reusable `test.yml`: vitest, typecheck, lint, `format:check`, **`npm run build`**, cfn-lint, Trivy. Code problem, nothing deployed. Note `npm run build` is here but **not** in `npm run test:all`, so a locally green gate can still fail CI — that's the most common surprise. Fix and re-run; nothing was touched in AWS.
- **`deploy-s3` (CloudFormation)** — the static-assets stack (`RoboLedgerAppS3{Staging,Prod}`). The dangerous class: a stack left in a rollback state usually **can't be updated again** until it's resolved, so a naive re-run fails identically. Read the stack events before re-triggering:
  ```bash
  aws cloudformation describe-stack-events --stack-name RoboLedgerAppS3Prod --max-items 20
  ```
- **`build`** — Docker image build and ECR push. This is where `NEXT_PUBLIC_*` values get baked in from GitHub Actions variables (`ROBOSYSTEMS_API_URL_*`, `TURNSTILE_SITE_KEY`, the app URLs, `MAINTENANCE_MODE_*`). A missing variable never fails the build: the workflow inputs all carry `||` fallbacks, so an unset var silently becomes either the hardcoded production default or an empty string, and surfaces later as an app pointed at the wrong API or a form with no CAPTCHA. Check `gh variable list` against `build.yml`'s inputs rather than trusting a green build.
- **`deploy-app`** — the main stack (`RoboLedgerApp{Staging,Prod}`) plus the App Runner rollout. Failures split three ways: a CloudFormation update failure, App Runner never reaching `RUNNING` (bad image, failed container start), or the final health check never returning 200. The step names in the log tell you which.
- **`handle-deployment-failure`** — the cleanup job, `if: always() && contains(needs.*.result, 'failure')`. Its presence in a run is a symptom, not the cause. Ignore it and look upstream.

## 3. Remediate, then re-deploy

Fix the root cause first (code fix + merge, a stuck stack resolved, a missing GitHub variable added via `npm run setup:gha`). Then, **with the user's confirmation**, re-trigger:

```bash
npm run deploy:staging              # bin/deploy.sh staging — current branch
npm run deploy:prod -- v1.0.0      # bin/deploy.sh prod <tag> — always name the tag
# equivalently: gh workflow run prod.yml --ref v1.0.0
```

Config changes need a full redeploy, not a restart: `NEXT_PUBLIC_*` is baked at build time, so a corrected GitHub variable only takes effect after `build` runs again.

## 4. Verify health

A green workflow means the pipeline finished, not that the app is serving what you expect. The pipeline's own check polls `https://<app-runner-host>/api/utilities/health` for a 200 — that's a **liveness** probe on the Next server. It does not check the RoboSystems API, and it does not go through CloudFront.

Confirm the rest yourself:

```bash
curl -sf https://roboledger.ai/api/utilities/health && echo OK   # prod, via CloudFront
curl -sf https://staging.roboledger.ai/api/utilities/health && echo OK
```

Then check what the health endpoint can't see:

- Load an authenticated page — if the API URL was baked wrong, health is 200 and every page is broken.
- If CloudFormation changed, re-read the stack outputs rather than assuming the previous values still hold.
- If only CSS or static assets look wrong, suspect the S3/CloudFront half (`deploy-s3`), not App Runner.

## Output

A short status: what failed and at which job, the root cause, what you changed, the re-run link, and the post-deploy health result. If nothing failed, say so — don't manufacture work.

$ARGUMENTS
