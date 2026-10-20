# Optional distribution setup

Use only when artifact packaging is selected. Preserve native release metadata
and package conventions. Clarify the required artifact, version/provenance needs
and reproducibility policy before adding build fields or diagnostics.

Choose identity fields that serve the actual delivery: package name/version,
commit or dirty state when available, and timestamp only if the reproducibility
policy permits it. An unavailable source baseline is reported as unavailable.
Native package metadata may fully satisfy this role; do not add a public endpoint,
CLI feature or machine-readable status command just because a template suggests it.

Build/import/package smoke checks verify scaffold delivery, not new product APIs.
Inspect real members, source maps/debug paths and private configuration exclusion;
Git ignore rules do not prove package exclusion. Use path remapping where needed.

An offline installed-checkout comparison is an additional opt-in choice. If used,
distinguish unknown/matching/mismatching identity and dirty-state limitations;
never treat matching commits as proof of byte-identical builds. It must not fetch,
install, restart an app or alter real runtime state as part of validation.

Test with disposable artifacts. Report unresolved delivery checks and required live
restarts separately; project preferences do not grant those external permissions.
