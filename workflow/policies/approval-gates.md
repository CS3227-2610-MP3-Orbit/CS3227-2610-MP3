# Approval gates

These gates authorize review/merge/deployment, not ordinary local preparation. Agents may prepare a
sensitive patch and run safe local tests. Only a human teammate can approve it.

| Gate              | Trigger                                                                                                     | Eligible approver                                                        | Evidence                                                                                  | Enforcement point                                                                  | Invalidated by                                                                    | Remaining bypass / limitation                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Specification     | Feature implementation                                                                                      | Teammate other than spec author                                          | Spec diff, ACs, risks, open decisions, reviewed commit or `git hash-object <spec>` digest | Human review record plus protected PR                                              | Material behavior, permission, data contract, failure/security case, or AC change | Editable repo evidence is not authentication; branch review must confirm it       |
| Sensitive change  | Auth/authz; `.codex`, `.claude`, agent policy/hook/permission; CI/deploy; migrations; destructive operation | Independent teammate; relevant CODEOWNER where configured                | Diff, threat/failure impact, tests, classifier output                                     | PR review/CODEOWNERS before merge; human confirmation before destructive execution | Any relevant new commit/diff                                                      | Classifier is path-based and may miss sensitive code elsewhere                    |
| Merge to `master` | Release PR                                                                                                  | At least one independent teammate (teams may require more)               | Approved specs, handoffs, full diff, required CI, resolved findings                       | GitHub protected branch or ruleset                                                 | New relevant commit dismisses stale approval; failing/missing check               | Admin/bypass actors unless the ruleset disallows them; plan limitations may apply |
| Production        | Deployment job for `master`                                                                                 | Named GitHub `production` environment reviewer, not the initiating agent | Release PR, CI, migration plan, deployment diff                                           | GitHub environment approval before the job receives environment secrets            | New release commit, rejected/expired job, changed production config               | Repository admins/platform owners may retain emergency bypasses; verify in GitHub |

Typo/format-only spec changes that do not alter meaning need not renew product approval, but the PR
reviewer decides this—not the authoring agent. Local approval fields and handoff checkboxes are audit
evidence only.

## Install the remote gates (human repository administrator)

1. Merge these files only after independent review because the patch changes agent, CI, and deployment
   policy. Do not use an agent's handoff as that approval.
2. In GitHub **Settings → Branches** (or **Rules → Rulesets**), protect `master`: require a pull
   request, one approval, Code Owner review, last-push approval, dismissal of stale approvals,
   conversation resolution, and current branch before merge. Require the `Verify`, `Database rules`,
   and `End-to-end` checks after those exact contexts appear on a PR. Disable force pushes/deletion and
   restrict direct pushes/bypasses to the smallest human maintainer group supported by the plan.
   After the three check names have appeared, an administrator may apply the prepared REST payload:

   ```sh
   gh api --method PUT repos/OWNER/REPO/branches/master/protection \
     --input workflow/policies/master-branch-protection.json
   ```

   `restrictions: null` is used for repository compatibility; if the organization plan supports push
   restrictions/ruleset bypass actors, configure the smallest human maintainer team in the UI and
   verify that no bot or coding agent has bypass permission.

3. In **Settings → Environments → production**, add at least one teammate reviewer, prevent
   self-review when available, allow only `master`, and store production credentials only in this
   environment. Store separate development credentials in `development`.
4. Run `workflow/scripts/setup-github.sh OWNER/REPO SECRETS_FILE REVIEWER...` only from a trusted human
   shell if using the prepared environment setup. It expects separate `DEV_` and `PROD_` credentials
   and never prints values. It does not configure branch protection.
5. Open a harmless test PR. Confirm direct push and force-push are rejected, approval becomes stale
   after a new commit, required checks block merge, and only a production reviewer can release the
   production job/credentials. Record screenshots or URLs in a reviewed handoff; until then mark
   remote enforcement `not-run`.

GitHub references: [protected branches](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
and [deployment environments](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment).
