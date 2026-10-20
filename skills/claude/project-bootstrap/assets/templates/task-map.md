# Task navigation

{{Keep only recurring tasks relevant to this project. Resolve role ids through
the selected manifest/equivalent; do not copy their paths here. Put a few rows in
an existing entry if a separate map is unnecessary. Remove absent capability roles.
These routes support later development; bootstrap only verifies their navigation.}}

| Task | Relevant roles | Search cue / authority |
|---|---|---|
| Locate a module boundary | module_map, modules | Module/domain name; current ownership and public entrypoints |
| Locate an interface contract | module_map, api_contract, contract_tests | Route, operation or message name; contract source |
| Locate data ownership | module_map, migrations | Dataset/table name; owning module and migration configuration |
| Locate UI structure | modules, tokens, ui_flows | Feature/component name; current source and selected flow docs |
| Locate runtime configuration | environments, config_schema, observability | Actual environment/key; current config and runbook |
| Trace an architecture decision | architecture, adr | Decision/topic; accepted rationale and superseded links |

Search the known file/module first, then expand when evidence requires it.
Routine lookups omit unrelated archive/build/dependency paths; historical or
generation questions explicitly include them. Active plans express intent;
old review results apply to their recorded baseline, not automatically to HEAD.
