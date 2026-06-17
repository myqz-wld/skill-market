---
review_id: <X>
reviewed_at: <YYYY-MM-DD>
expired: false               # Manual override; true forces inclusion in the next review.
skipped_expired:             # Expired files omitted from this round, with reasons.
  # - file: src/some.ts
  #   reason: formatting-only or comment-only batch
---

# REVIEW_<X>: <topic>

## Trigger

<User-requested, scheduled, before a major refactor, security review, or another trigger. State whether expired files were included.>

## Method

**Review method** (use the configured project review process; if none exists, name the human or single-agent fallback and keep the adjudication contract):
- <Reviewer A: model, reasoning effort, tool path, or human fallback>
- <Reviewer B: model, reasoning effort, tool path, timeout, or human fallback>

**Scope**: <N files, module list, and approximate line count>

```text
<Human-readable scope summary. Group by module when useful; prefer readability over compression.>
```

**Machine-readable scope** (for file-level review expiry; one repository-relative file path per line, sorted and deduplicated; no directories, globs, or brace expansion):

```review-scope
src/main/foo.ts
src/main/bar.ts
```

> The commit that first adds this file to git is the coverage baseline for this review scope. Land this file with the review outcome or related fixes; do not create empty review records in advance.

**Constraints**: <known issues to suppress, output format, and severity scale such as CRITICAL/HIGH/MEDIUM/LOW/INFO>

## Adjudication

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

## Fixes Landed In CHANGELOG_<Y>

### CRITICAL
1. **<file:line>** - <one-sentence fix>

### HIGH
1. **<file:line>** - <one-sentence fix>

### MEDIUM
...

### LOW
...

### INFO
...

## Related Changelog

- `ref/changelogs/CHANGELOG_<Y>.md`: fixes landed in this task

## Agent Pitfall Candidates

This review produced N agent-pitfall candidates in `ref/conventions/tally.md`. If the same theme reaches count 3, promote it to `ref/conventions/<X>-<topic>.md` through the configured review process; do not copy promoted conventions back into project `CLAUDE.md`.
