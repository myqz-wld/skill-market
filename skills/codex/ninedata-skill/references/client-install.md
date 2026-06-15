# Client Installation

## Configuration Location

After installation, edit the configuration file in the skill root:

```text
ninedata-skill/config.json
```

Recommended permission:

```bash
chmod 600 config.json
```

## Codex

Installation path example:

```text
~/.codex/skills/ninedata-skill/
```

Validation prompt:

```text
Use the NineData Skill to list my MySQL datasources.
```

## Claude Code

Installation path example:

```text
~/.claude/skills/ninedata-skill/
```

Validation prompt:

```text
Use ninedata-skill to list available NineData datasources.
```

## Cursor

Installation path example:

```text
~/.cursor/skills/ninedata-skill/
```

## Open Claw

Installation path example:

```text
~/.openclaw/skills/ninedata-skill/
```

## Hermes Agent

Installation path example:

```text
~/.hermes/skills/ninedata-skill/
```

## Qoder

Installation path example:

```text
~/.qoder/skills/ninedata-skill/
```

## Trae

Installation path example:

```text
~/.trae/skills/ninedata-skill/
```

## Open Code

Installation path example:

```text
~/.opencode/skills/ninedata-skill/
```

## Minimal Script Validation

```bash
scripts/validate-config.sh
scripts/list-datasource.sh --page-size 5
```
