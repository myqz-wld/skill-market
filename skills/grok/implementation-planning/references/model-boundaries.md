# Conditional LLM design concerns

Read only when the proposed product or automation actually calls an LLM.
This section is not a mandatory part of ordinary feature/refactor plans.

Use model calls for semantic interpretation, synthesis or judgment. Exact copying,
sorting, filtering, hashing, persistence, schema checks and state transitions belong
in deterministic code/tools. Existing tools may be sufficient; do not build a new
framework merely to enforce that principle.

For a material model call, identify its responsibility, minimum context, smallest
useful output/delta schema, deterministic assembly and validation/failure behavior.
Keep accepted state outside the model; avoid asking it to regenerate unchanged
content byte for byte. Turn missing deterministic support into a bounded task only
when the design actually needs it.

Provider/model/cost/data-handling choices follow the ordinary consequential-decision
rules. Do not silently infer authority to send data, grant execution capability,
create accounts or change runtime settings from a planning request.
