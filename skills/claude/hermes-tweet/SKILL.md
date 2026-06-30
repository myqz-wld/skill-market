---
name: hermes-tweet
description: "Use when installing, configuring, testing, or operating Hermes Tweet, the native Hermes Agent X/Twitter plugin for Xquik read workflows and approval-gated actions."
---

# Hermes Tweet

Use this skill when a user wants Hermes Agent to work with X/Twitter through Hermes Tweet.
Hermes Tweet is a native Hermes Agent plugin, not a generic HTTP wrapper.

## Source Truth

- Hermes Tweet README: `https://github.com/Xquik-dev/hermes-tweet#readme`
- Hermes Tweet package: `https://pypi.org/project/hermes-tweet/`
- Hermes plugin guide: `https://github.com/NousResearch/hermes-agent/blob/main/website/docs/guides/build-a-hermes-plugin.md`
- Hermes plugins guide: `https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/plugins.md`

## Workflow

1. Confirm Hermes Tweet is installed and enabled in the Hermes runtime.
2. Use `tweet_explore` first when the user asks what routes or capabilities exist.
3. Use `tweet_read` only for catalog-listed read-only `/api/v1/...` endpoints.
4. Use `tweet_action` only after explicit approval for private or account-changing work.
5. Keep all credentials in the Hermes runtime environment.

## Install Checks

Use these commands when the user asks for setup or runtime troubleshooting:

```bash
hermes plugins install Xquik-dev/hermes-tweet --enable
hermes plugins list
hermes tools list
```

Use this path when the user wants a PyPI install into the Hermes virtual environment:

```bash
uv pip install --python ~/.hermes/hermes-agent/venv/bin/python hermes-tweet
hermes plugins enable hermes-tweet
```

## Tool Routing

- If the user asks what Hermes Tweet can do, use `tweet_explore`.
- If `tweet_read` is unavailable, ask the user to configure `XQUIK_API_KEY` in the Hermes runtime environment.
- If `tweet_action` is unavailable, explain that actions require `HERMES_TWEET_ENABLE_ACTIONS=true`.
- If Hermes reports that the plugin is not enabled, tell the user to run `hermes plugins enable hermes-tweet`.
- If the user runs Hermes Desktop with a remote gateway profile, configure Hermes Tweet on the remote Hermes host where plugin code executes.

## Guardrails

- Never ask for API keys, passwords, cookies, signing keys, or TOTP secrets.
- Never pass credentials in tool arguments.
- Never invent endpoints, fields, pricing, limits, or capabilities.
- Never create direct HTTP fallbacks.
- Summarize side effects before any account-changing action.
- Stop after authorization, availability, or permission errors instead of retrying account-changing actions.

## Expected Availability

- `tweet_explore` can appear without `XQUIK_API_KEY`.
- `tweet_read` requires `XQUIK_API_KEY`.
- `tweet_action` requires `XQUIK_API_KEY` and `HERMES_TWEET_ENABLE_ACTIONS=true`.
- Third-party Hermes plugins must be enabled before tools run.
