# CLAUDE.md

> Repository-level instructions and the shared SSOT for paired AI-coding entries.
> This file contains the minimum repository workflow. Extra engineering or review skills, when present, are enhancement layers.
> `AGENTS.md` is the companion entry for runtime/tool differences. Keep shared repository rules here to avoid drift.

## 仓库基础

- OS / 包管理器：<例：macOS / pnpm 或 Linux / cargo 或 Windows / pip>
- 语言版本：<例：Node ≥ 18 / Go 1.22 / Python 3.11>
- 其他特殊环境约束：<可空，如必须用 docker compose up 起依赖>

## 基础目录架构

创建或维护仓库时按这份结构落位；除非项目已有更强契约，不要为同类文件另建平行目录：

- `CLAUDE.md`：共享项目 SSOT，记录仓库基础、目录架构、改动后必做、plan/review 生命周期、review 过期规则、文件大小护栏、项目特定触发、项目特定约定和验证流程。
- `AGENTS.md`：入口 / 工具差异，只引用并遵守 `CLAUDE.md` 的共享规则。
- `README.md`：面向用户和维护者的启动、使用、验证和结构说明。
- `src/`：源码。
- `build/` 或 `dist/`：构建产物；按项目实际工具保留一个或两个名称。
- `ref/changelogs/INDEX.md`：终态 changelog 索引。
- `ref/reviews/INDEX.md`：终态 review 索引；终态 review 文件放 `ref/reviews/REVIEW_X.md`。
- `ref/plans/INDEX.md`：终态 plan 索引；终态 plan 文件放 `ref/plans/`。
- `ref/conventions/INDEX.md`：已升级项目约定索引；约定正文用 `ref/conventions/<X>-<topic>.md`。
- `ref/conventions/tally.md`：重复反馈 / 重复踩坑计数入口。
- `.refs/`：必须加入 `.gitignore`；只放未终态 plan/review 工作副本，不放终态记录。

## 改动后必做

动工前先 `ls ref/conventions ref/changelogs ref/plans ref/reviews 2>/dev/null || true` 了解既有记录；目录缺失时补建，不当作错误。改动后先执行这四条最低规则，再按项目特定触发补充：

1. 改用户可见行为、文件结构、启动方式、端口、依赖或验证步骤 → 更新 `README.md` 对应章节；纯 bug 修复或内部重构不动 README。
2. 每个有意义的功能 / 行为 / API / 依赖变化 → 写 `ref/changelogs/CHANGELOG_X.md` 并更新 `ref/changelogs/INDEX.md`；debug / 性能 / 安全 / review-driven fix → 写 `ref/reviews/REVIEW_X.md` 并更新 `ref/reviews/INDEX.md`。编号 `X` 取当前最大值的下一个整数，用 `ls` 确认，不要猜；INDEX 摘要 ≤ 80 字或一句简短英文。
3. `.refs/` 必须加入 `.gitignore`。未终态 plan 放在当前环境的 plan 工作区；无更强契约时用 `<repo>/.refs/plans/<plan-id>.md`。未终态 review 草稿 / reviewer 原始输出放在当前 review 工作区；无更强契约时用 `<repo>/.refs/reviews/<review-id>.md` 或会话输出。终态收口时必须移动最终记录并清理工作区副本：plan 归档到 `ref/plans/` 并更新 `ref/plans/INDEX.md`，review 归档到 `ref/reviews/REVIEW_X.md` 并更新 `ref/reviews/INDEX.md`。
4. 反复用户反馈或重复 agent 踩坑先记入 `ref/conventions/tally.md`：语义相同的已有条目计数 +1，否则新增 `count: 1` 行；`count >= 3` 后走本仓库 review 流程，升级为 `ref/conventions/<X>-<topic>.md` 并更新 `ref/conventions/INDEX.md`。

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

## Review 过期与最小复审范围

准备下一次 review 时按本节确定最小复审范围；`ref/reviews/` 是会过期的覆盖记录，不是永久豁免。

下一次 review 的最小范围：

```text
unreviewed files ∪ expired reviewed files ∪ scope_unknown files
```

自最近一次覆盖该文件的 REVIEW 基线以来，满足任一条件即过期：

- 净改动 ≥ `min(200 行, 当前 LOC 的 30%)`。
- 不同 commit 数 ≥ 3。
- 距今 ≥ 90 天且文件至少改过一次。
- REVIEW frontmatter 标记 `expired: true`。

准备 review 时在仓库根目录运行 `bash scripts/file-level-review-expiry.sh`（项目初始化时由 foundation 模板复制进来）；脚本缺失时按上述条件用 `git log` 手工判定。

## 文件大小护栏（500 行）

任何源码文件超过 500 LOC，提交前必须先尝试拆分；生成代码、lockfile、快照、migration、fixture 除外。

拆分优先级：

1. 抽出模块级纯函数 / 类型 / 常量。
2. 目录化为同目录子模块并保持 import 路径。
3. 仅在 plan/review 之后才用 facade + 共享上下文拆类。

确实不可拆分时，在相关 changelog 的 "do not split" 保护清单中记录文件和具体原因。

## 验证流程

```bash
<typecheck 命令>
<build 命令>
<test 命令>
```

修改 <main / preload / native module / config ...> 后必须 <重启 dev / 重新加载 / 重新编译>。

## 部署 / 打包（如有）

<可空。每个步骤带 `#` 注释解释根因，便于将来 review 不退化。打包配置已踩的坑列清单，每条带 CHANGELOG 编号。>
