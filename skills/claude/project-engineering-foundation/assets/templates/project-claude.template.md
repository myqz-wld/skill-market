# CLAUDE.md

> Repository-level instructions and the shared SSOT for paired AI-coding entries.
> This file contains the minimum repository workflow. Extra engineering or review skills, when present, are enhancement layers.
> `AGENTS.md` is the companion entry for runtime/tool differences. Keep shared repository rules here to avoid drift.

## 仓库基础

- OS / 包管理器：<例：macOS / pnpm 或 Linux / cargo 或 Windows / pip>
- 语言版本：<例：Node ≥ 18 / Go 1.22 / Python 3.11>
- 其他特殊环境约束：<可空，如必须用 docker compose up 起依赖>

## 改动后必做

先执行这三条最低规则，再按项目特定触发补充：

1. 改用户可见行为、文件结构、启动方式、端口、依赖或验证步骤 → 更新 `README.md` 对应章节；纯 bug 修复或内部重构不动 README。
2. 每个有意义的功能 / 行为 / API / 依赖变化 → 写 `ref/changelogs/CHANGELOG_X.md` 并更新 `ref/changelogs/INDEX.md`；debug / 性能 / 安全 / review-driven fix → 写 `ref/reviews/REVIEW_X.md` 并更新 `ref/reviews/INDEX.md`。
3. 反复用户反馈或重复 agent 踩坑先记入 `ref/conventions/tally.md`；`count >= 3` 后走本仓库 review 流程，升级为 `ref/conventions/<X>-<topic>.md` 并更新 `ref/conventions/INDEX.md`。

项目特定触发：

- <例：改 main / preload 后必须重启 dev>
- <例：改 DB schema 必须新增 migration 文件 + bump user_version>
- <例：改 IPC channel 后 preload facade 必须同步>

## 项目特定约定（设计要点速查）

> 反复出现过的设计决定，改动前注意。动态升级走 `ref/conventions/<X>-<topic>.md`；本节只保留必须在入口可见的项目不变量。

<!-- 模式（每个主题一节）：

### <主题（鉴权 / 状态机 / 数据迁移 / IPC 边界 / 事件去重 / CSS 陷阱 ...）>

- 一句话要点 + 为什么（避免后续推翻）
- 反例 / 已知踩坑 / 关联 CHANGELOG 编号
-->

## 验证流程

```bash
<typecheck 命令>
<build 命令>
<test 命令>
```

修改 <main / preload / native module / config ...> 后必须 <重启 dev / 重新加载 / 重新编译>。

## 部署 / 打包（如有）

<可空。每个步骤带 `#` 注释解释根因，便于将来 review 不退化。打包配置已踩的坑列清单，每条带 CHANGELOG 编号。>
