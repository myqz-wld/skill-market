# Contributing to Skill Market

所有上传都必须通过 PR。不要直接在 main 上提交市场条目。

## Skill 上传规则

Claude skill:

```text
registry/skills/claude/<skill-name>/SKILL.md
```

Codex skill:

```text
registry/skills/codex/<skill-name>/SKILL.md
```

要求：

- `<skill-name>` 使用小写字母、数字和短横线。
- `SKILL.md` frontmatter 必须包含 `name` 和 `description`。
- `name` 必须等于目录名。
- Claude / Codex 内容独立维护，不允许用“同一份自动同步”替代审查。
- 如有 `references/`、`scripts/`、`assets/`，必须随对应 adapter variant 一起提交。

## Plugin 上传规则

Plugin 放在：

```text
registry/plugins/claude/<plugin-name>/
registry/plugins/codex/<plugin-name>/
```

每个 plugin 目录必须包含 `MARKET.md`，说明：

- plugin 名称
- 支持 adapter
- 安装方式
- 权限 / 外部依赖
- 维护者

## PR Checklist

PR 必须包含：

- [ ] 新增或更新的 registry 目录
- [ ] `registry/INDEX.md` 对应条目
- [ ] Claude / Codex adapter 标注正确
- [ ] 安装说明可由对应 agent 执行
- [ ] 没有把 Claude / Codex 内容误合成同一份
