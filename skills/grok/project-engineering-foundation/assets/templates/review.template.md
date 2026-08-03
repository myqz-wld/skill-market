---
review_id: <X>
reviewed_at: <YYYY-MM-DD>
baseline_commit: <full commit>  # Final code state this review covers; include fixes if landed.
expired: false               # Manual override; true forces inclusion in the next review.
skipped_expired:             # Expired files omitted from this round, with reasons.
  # - file: src/some.ts
  #   reason: formatting-only or comment-only batch
---

# REVIEW_X_<topic>: <short title>

## Scope

<User-requested, scheduled, before a major refactor, security review, or another trigger. State whether expired files were included.>

**Review method** (use the configured project review process; if none exists, name the human or single-agent fallback and keep the adjudication contract):
- <Reviewer A: model or human, reasoning effort, tool path, timeout>
- <Reviewer B: model or human, reasoning effort, tool path, timeout>

**Scope**: <N files, module list, and approximate line count>

```text
<Human-readable scope summary. Group by module when useful; prefer readability over compression.>
```

**Machine-readable scope** (for file-level review expiry; one repository-relative file path per line, sorted and deduplicated; no directories, globs, or brace expansion). List only files actually reviewed and covered by this record; do not include skipped expired files.

```review-scope
src/main/foo.ts
src/main/bar.ts
```

> `baseline_commit` is the coverage baseline for this review scope. Fill it with the full commit that represents the final code state covered by this review. If fixes landed, use the commit that includes them; if no fixes landed, use the reviewed HEAD commit. Do not create empty review records in advance.

**Constraints**: <known issues to suppress, output format, and severity scale such as CRITICAL/HIGH/MEDIUM/LOW/INFO>

## Findings

> Confirmed findings require direct evidence such as grep output, a targeted test, a command result, or a cited code path. Unverified findings stay in Partial / Unverified with severity MEDIUM or lower. Weak assertions belong only in unverified rows.

### Confirmed Issues

| # | Severity | File:Line | Issue | A | B | Evidence |
|---|---|---|---|---|---|---|

### Refuted Findings

| Reporter | Claim | Refutation Evidence |
|---|---|---|

### Partial / Unverified

| Area | A View | B View | Verified? | Conclusion |
|---|---|---|---|---|

## Validation / Evidence

<Commands, targeted tests, grep output, reviewer evidence, or manual checks used to confirm or refute findings.>

## Fixes Landed

<Fixes made because of this review, grouped by severity. Use `1. **<file:line>** - <one-sentence fix>` when fixes exist; use `1. None` under a severity with no fixes.>

### CRITICAL
1. None

### HIGH
1. None

### MEDIUM
1. None

### LOW
1. None

### INFO
1. None

## Residual Risk

<Unresolved risks, skipped expired files, accepted limitations such as do-not-split decisions, or `None`.>

## Follow-ups

<Open follow-up work, owner/date when known, or `None`.>
