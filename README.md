# Skill Market

Skill Market 是一个仓库型市场，不提供服务、CLI、API 或安装器。Claude / Codex 通过安装后的
`skill-market` skill 直接读写这个仓库：浏览 registry、复制安装包、创建上传 PR。

## 核心原则

- 市场自身只保存 registry 和规则，不执行任何能力。
- Claude 和 Codex 的 skill / plugin 独立维护。
- 同名条目可以同时有 Claude variant 和 Codex variant，但内容不自动同步。
- 上传必须通过 PR 合并。PR 合并前，条目不算进入市场。

## 目录

```text
registry/
  INDEX.md
  skills/
    claude/<skill-name>/SKILL.md
    codex/<skill-name>/SKILL.md
  plugins/
    claude/<plugin-name>/
    codex/<plugin-name>/

market-skills/
  claude/skill-market/SKILL.md
  codex/skill-market/SKILL.md
```

## 安装 Market Skill

把对应 adapter 的 market skill 复制到用户 skill 目录：

```bash
mkdir -p ~/.claude/skills ~/.codex/skills
cp -R /Users/wanglidong/Repository/skill-market/market-skills/claude/skill-market ~/.claude/skills/
cp -R /Users/wanglidong/Repository/skill-market/market-skills/codex/skill-market ~/.codex/skills/
```

新开的 Claude / Codex 会话会读取各自的 `skill-market` skill。之后用户可以让 agent 使用
`skill-market` 完成浏览、安装、更新、下载、上传 PR。

## 管理流程

### 浏览

读 `registry/INDEX.md`，再按需查看 `registry/skills/<adapter>/<name>/` 或
`registry/plugins/<adapter>/<name>/`。

### 安装 / 更新

安装 skill 时复制对应目录：

```text
registry/skills/claude/<name>/ -> ~/.claude/skills/<name>/
registry/skills/codex/<name>/  -> ~/.codex/skills/<name>/
```

更新就是重新复制市场里的当前版本，替换本地同名目录。

### 下载

下载是不安装，只把 registry 中对应目录复制或打包到用户指定位置。

### 上传

上传必须走 PR：

1. 从 main 创建分支：`market/<type>/<adapter>/<name>`。
2. 把包放入对应 registry 目录。
3. 更新 `registry/INDEX.md`。
4. 提交 commit。
5. push 分支。
6. 创建 PR。
7. PR 合并后才算进入市场。

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。
