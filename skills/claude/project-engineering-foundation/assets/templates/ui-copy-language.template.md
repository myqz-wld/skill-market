# UI/CLI Copy Language

This file is the source of truth for user-facing UI and CLI copy language. Update this file before changing the active copy language mode, default locale, or supported locales.

## Mode

Use exactly one mode. Delete the unused line during setup.

- `single-language`: <language and locale, such as English (en-US)>
- `multilingual`: <default locale and supported locales, such as default en-US with en-US and zh-CN>

## Scope

This file applies to text shown or spoken to users: UI labels, navigation, buttons, headings, form help, errors, notifications, empty states, onboarding, marketing copy inside the product, accessibility labels, CLI output, command help, prompts, confirmations, progress text, and user-facing terminal errors.

This file does not govern code identifiers, protocol names, logs, developer comments, test names, or third-party strings unless those strings are rendered to users.

## Rules

- For single-language projects, write new UI/CLI copy only in the selected language and locale.
- For multilingual projects, add or update UI/CLI copy through the project i18n source for every supported locale; keep keys stable and do not inline user-facing strings unless the project i18n tooling requires it.
- If a user requests UI/CLI copy in a language or locale not listed here, update this file first and then make the copy change.
- If project code and this file disagree, stop and update this file or ask for the intended language mode before changing UI/CLI copy.
