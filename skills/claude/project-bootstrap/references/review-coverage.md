# Optional review coverage

Leave advanced coverage tracking out of ordinary scaffolding unless it is
requested or needed for this change. Reuse existing review policy. Missing
thresholds alone are not a reason to start another interview.
Keep shared policy in the project's existing owner/location.

Coverage records identify actual scope, reviewed time and the baseline that was
inspected. Use a full commit or an identified content snapshot/diff for uncommitted
work. Missing/ambiguous identity means unknown coverage. Fixes require re-review;
changing a baseline label to HEAD does not validate them.

## Policy choice

Only after a concrete need is established, resolve consequential invalidation
rules, enforcement mode and exclusions together; routine details can be chosen
and disclosed. Do not ask the entire threshold checklist. Relevant changes since
the baseline are a useful starting signal; calendar age alone is not proof of
invalidity. If numeric thresholds are wanted, base them on the project's change
rate and review practice. Do not automatically insert 200 lines, 30%, three commits
or 90 days from an example policy.

Within the actual requested scope, report unreviewed/covered/expired/unknown with
evidence and reasons. Do not trigger reviewers from a mechanical check or expand
the scope to the whole repository. Include dirty changes or report them uncovered.

## Verification

Use project-native tools and test missing baselines, unchanged old files, renamed
paths, overlapping reviews, unreviewed fixes and dirty work. A rename with no safe
scope mapping is unknown. Select relevant verifiable evidence, not the newest
unrelated record. Report actual checks; do not create empty review artifacts.
