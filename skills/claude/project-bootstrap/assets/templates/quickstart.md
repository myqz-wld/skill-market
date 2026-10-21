# {{Project}}

{{State the actual deliverable and minimal supported behavior. Populate this outline
from delivered files and verified commands; merge into an existing README. Remove
private AI workflow/plan/context sections from a public README and place them only
in their internal owner. Public text, links and commands cannot refer to internal
files or require private setup. Public build/test/run must work independently. Remove
the authoring notes and all placeholders before delivery.}}

## Run locally

- Runtime: {{declared native runtime/version source}}
- Setup: {{actual dependency/setup command and required configuration}}
- Run or import: {{verified command or consumer example}}
- Expected result: {{observed readiness/response/output/API result}}
- Environment selection: {{actual selector/default and supported profiles, when applicable}}

{{Use synthetic configuration examples. Identify required external prerequisites
and local substitutes only when actually supported. Do not copy credentials.}}

## Development contract

{{Reuse the existing engineering authority when present. Otherwise record concise
actual choices here; link source configuration and distinguish defaults from confirmed
requirements. Omit irrelevant rows and avoid a second independently maintained policy.}}

| Surface | Project choice and owner | Enforcement/evidence |
|---|---|---|
| Source language and file formats | {{Native toolchain/configuration}} | {{Actual formatter/type/build checks}} |
| Document language | {{Language of documentation within this document's visibility}} | {{Relevant inspection or native tooling}} |
| UI/CLI locale | {{Default/supported locales and copy owner, or not applicable}} | {{Actual visible-output checks}} |
| Comments and machine names | {{Comment/diagnostic convention and native identifier/key policy}} | {{Applicable checks or review}} |
| File budgets | {{Applicable source/document limits, exclusions and severity}} | {{Native check or manual review and meaningful exceptions}} |
| Security and acceptance | {{Public configuration contract, package inputs and acceptance ownership}} | {{Effective controls checked and remaining limits}} |

## Project structure

| Responsibility | Actual path | Entry or public boundary |
|---|---|---|
| {{Runtime/composition/real module}} | {{Existing path}} | {{Actual entry/interface}} |

{{For a small project, keep the architecture and evolution explanation here.
For a larger one, link the project's actual architecture authority without
duplicating its module map. Do not paste unused branches of a reference tree.}}

## Find project knowledge

{{Point to the actual task map and verified source-search procedure, or put a compact
task/terms/current-source table here for a small project. Include module docs outside
the central docs root and distinguish current guidance from drafts/history. Avoid
preloading every document or linking to a proposed tool that does not exist.}}

## Verify

{{Native focused/fast/full checks, build/type checks where applicable and meaningful
smoke/regression commands with their scope. Include environment/configuration checks
when selected. These must be implemented commands, not proposed success scripts.
Link protected acceptance and effective review policy without implying an unconfigured
hook or remote gate already runs.}}

## Extend

{{Name the actual extension point for a new use case/integration and the dependency
rules to preserve. Link the project's concrete evolution guidance when separate.}}
