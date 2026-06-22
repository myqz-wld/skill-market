---
name: diff-walkthrough
description: "Use when walking a user through pull-request diffs or merge-conflict resolutions one fragment at a time with explanation and confirmation before continuing."
---

# Diff Walkthrough

Use this skill when the user asks to walk through, inspect, or understand a PR diff, patch, merge-conflict resolution, or resolved conflict.

## Inputs

Ask for only the missing input required to start the walkthrough.

- For PR walkthrough, use the diff, branch comparison, patch file, or changed files the user provides or identifies.
- For merge-conflict walkthrough, use the conflicted file, conflict markers, proposed resolved file, merge base, and each side of the conflict when available.
- If a suitable diff display tool exists in the environment, use it to inspect the current fragment. Otherwise show the relevant text diff in the response.

## Fragment Rule

Walk through exactly one fragment at a time. A fragment is one logical diff hunk, one related set of adjacent hunks, or one conflict block whose correctness can be judged together.

After each fragment, ask the user to confirm, revise, or stop. Do not continue to the next fragment until the user confirms that the current fragment is handled.

## PR Walkthrough

For each PR fragment:

1. Show or summarize the exact fragment being presented.
2. Explain what the changed code does, including relevant fields, functions, methods, data flow, and side effects.
3. Identify correctness issues, regression risks, missing tests, or unclear behavior. Say when no issue is found.
4. Explain why the proposed handling is correct, or why a different handling is needed.
5. Ask for confirmation before presenting another fragment.

## Merge-Conflict Walkthrough

For each conflict-resolution fragment:

1. Show or summarize the conflict inputs and the proposed resolution.
2. Explain what each side contributed and what the resolved code now does.
3. Check whether the resolution preserves required behavior, integrates both sides intentionally, and avoids duplicated, dropped, or incompatible logic.
4. Explain why the proposed conflict resolution is correct, or identify the smallest correction needed.
5. Ask for confirmation before presenting another fragment.

## Response Rules

- Keep the walkthrough focused on the current fragment; defer unrelated hunks until their turn.
- Tie every judgment to code evidence from the fragment or nearby context.
- If broader context is required to judge the fragment, inspect only the narrow related code needed for that judgment.
- Use concise severity labels for findings when helpful, but do not replace the required explanation with a label.
- When the user confirms a fragment, proceed to the next unhandled fragment using the same workflow.
