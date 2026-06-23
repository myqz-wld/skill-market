---
name: diff-walkthrough
description: "Use when the user wants to be walked, guided, or stepped through a diff, a set of code changes, a patch, or a merge-conflict resolution one fragment at a time, with explanation and confirmation before each next fragment. Prefer this over a one-pass or adversarial review when the request is to go through / walk through / step through changes sequentially rather than get a single batched list of findings. Trigger anchors: walk through the diff, go over the diff, step through the changes, walkthrough, explain the diff fragment by fragment, 过一下 diff, 过一下当前改动, 逐段看, 逐段讲解."
---

# Diff Walkthrough

Use this skill when the user asks to walk through, inspect, or understand a PR diff, patch, merge-conflict resolution, or resolved conflict.

Prefer this skill over a one-pass or adversarial review when the user wants to be guided through the changes step by step — for example "walk through the diff", "go over the diff", "step through the changes", "walkthrough", "explain it fragment by fragment", or equivalents such as 过一下 diff / 过一下当前改动 / 逐段看 — rather than a single batched list of findings.

## Inputs

Ask for only the missing input required to start the walkthrough.

- For PR walkthrough, use the diff, branch comparison, patch file, or changed files the user provides or identifies.
- For merge-conflict walkthrough, use the conflicted file, conflict markers, proposed resolved file, merge base, and each side of the conflict when available.
- Default: use an interactive presentation tool for every fragment when one is available. Identify it by capability: it can render before/after diff content or conflict content and blocks until the user returns a structured approve/revise decision or a stop/end signal.
- Use inline text only as a fallback when no interactive presentation tool with those capabilities exists.

## Presenting Each Fragment

Present exactly one fragment and wait for the user's structured decision before continuing.

- For PR or patch fragments, present a before/after two-column shape. When one fragment spans multiple hunks, include the unified diff as supporting context so the relationship between hunks stays visible.
- For merge-conflict fragments, present a three-way shape with ours, theirs, and the proposed resolution.
- Presented diff or conflict content may include concise inserted notes or comments around fields, functions, methods, code snippets, references, callers, logic, or usage when they make the fragment easier to judge. Keep these annotations clearly distinguishable from the actual before/after or conflict content.
- If the user approves the fragment, advance to the next unhandled fragment.
- If the user asks for revision, update or clarify the current fragment and present the same fragment again.
- If the user stops, or the presentation tool times out, end the walkthrough instead of advancing.

## Fragment Rule

Walk through exactly one fragment at a time. A fragment is one logical diff hunk, one related set of adjacent hunks, or one conflict block whose correctness can be judged together.

After each fragment, get an approve, revise, or stop decision through the presentation step. In inline fallback, present the relevant text in the response and ask explicitly for approve, revise, or stop. Do not continue to the next fragment until the current fragment is approved.

## PR Walkthrough

For each PR fragment:

1. Present the exact before and after content for the fragment, plus unified diff context for multi-hunk fragments.
2. Explain what the changed code does, including relevant fields, functions, methods, data flow, and side effects.
3. Identify correctness issues, regression risks, missing tests, or unclear behavior. Say when no issue is found.
4. Explain why the proposed handling is correct, or why a different handling is needed.
5. Wait for the presentation decision before presenting another fragment.

## Merge-Conflict Walkthrough

For each conflict-resolution fragment:

1. Present the ours, theirs, and proposed resolution content for the fragment.
2. Explain what each side contributed and what the resolved code now does.
3. Check whether the resolution preserves required behavior, integrates both sides intentionally, and avoids duplicated, dropped, or incompatible logic.
4. Explain why the proposed conflict resolution is correct, or identify the smallest correction needed.
5. Wait for the presentation decision before presenting another fragment.

## Response Rules

- Keep the walkthrough focused on the current fragment; defer unrelated hunks until their turn.
- Tie every judgment to code evidence from the fragment or nearby context.
- If broader context is required to judge the fragment, inspect only the narrow related code needed for that judgment.
- Use concise severity labels for findings when helpful, but do not replace the required explanation with a label.
- When the user approves a fragment, proceed to the next unhandled fragment using the same workflow.
- Treat the presentation decision as the source of truth for advancing: approved advances, revise redoes the current fragment, and stop or timeout ends the walkthrough.
