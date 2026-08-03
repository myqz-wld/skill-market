import {
  ADAPTERS,
  CATALOG_STATUSES,
  LOCAL_STATES,
  OWNERSHIP_STATES,
  PACKAGE_KINDS,
  UPDATE_STATES,
} from "./contracts.mjs";
import { SkillMarketError } from "./errors.mjs";

function normalizeSet(value, allowed, field, defaults) {
  const selected = value === undefined ? defaults : value;
  const values = Array.isArray(selected) ? selected : [selected];
  if (values.includes("all")) return [...allowed];
  const invalid = values.filter((entry) => !allowed.includes(entry));
  if (invalid.length > 0) {
    throw new SkillMarketError({
      code: "invalid-filter",
      message: `${field} contains unsupported values: ${invalid.join(", ")}.`,
      details: { field, received: values, allowed },
      nextAction: `Choose ${field} from: ${allowed.join(", ")}, or all.`,
    });
  }
  return [...new Set(values)];
}

export function normalizePagination({ offset = 0, limit = 20 } = {}) {
  const parsedOffset = Number(offset);
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
    throw paginationError("offset", offset, "a non-negative integer");
  }
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw paginationError("limit", limit, "an integer from 1 through 100");
  }
  return { offset: parsedOffset, limit: parsedLimit };
}

function paginationError(field, value, expected) {
  return new SkillMarketError({
    code: "invalid-pagination",
    message: `${field} must be ${expected}.`,
    details: { field, value },
    nextAction: `Set ${field} to ${expected}.`,
  });
}

function page(items, pagination) {
  const { offset, limit } = normalizePagination(pagination);
  const paged = items.slice(offset, offset + limit);
  return {
    items: paged,
    page: {
      offset,
      limit,
      count: paged.length,
      total: items.length,
      hasMore: offset + paged.length < items.length,
    },
  };
}

function tokens(value) {
  return String(value).toLowerCase().match(/[a-z0-9]+/gu) ?? [];
}

function rank(entry, query) {
  if (!query) return { bucket: "browse", order: 4 };
  const normalized = query.toLowerCase();
  const id = entry.id.toLowerCase();
  const name = entry.name.toLowerCase();
  if (id === normalized || name === normalized) return { bucket: "exact", order: 0 };
  if (id.startsWith(normalized) || name.startsWith(normalized)) {
    return { bucket: "prefix", order: 1 };
  }
  const queryTokens = tokens(normalized);
  const identityTokens = new Set(tokens([entry.id, entry.name, ...(entry.keywords ?? [])].join(" ")));
  if (
    queryTokens.length > 0 &&
    queryTokens.every((queryToken) =>
      [...identityTokens].some((identityToken) => identityToken.startsWith(queryToken)),
    )
  ) {
    return { bucket: "token", order: 2 };
  }
  const description = entry.description.toLowerCase();
  if (
    description.includes(normalized) ||
    (queryTokens.length > 0 && queryTokens.every((queryToken) => description.includes(queryToken)))
  ) {
    return { bucket: "description", order: 3 };
  }
  return null;
}

export function discoverCatalog({
  catalog,
  inventoryItems = [],
  freshness,
  query = "",
  adapters,
  kinds,
  statuses,
  offset,
  limit,
} = {}) {
  const selectedAdapters = normalizeSet(adapters, ADAPTERS, "adapter", ADAPTERS);
  const selectedKinds = normalizeSet(kinds, PACKAGE_KINDS, "kind", PACKAGE_KINDS);
  const selectedStatuses = normalizeSet(statuses, CATALOG_STATUSES, "status", ["active"]);
  const normalizedQuery = String(query ?? "").trim().toLowerCase();
  const local = new Map(inventoryItems.map((item) => [item.id, item]));
  const ranked = [];
  for (const entry of catalog.packages) {
    if (
      !selectedAdapters.includes(entry.adapter) ||
      !selectedKinds.includes(entry.kind) ||
      !selectedStatuses.includes(entry.status)
    ) {
      continue;
    }
    const ranking = rank(entry, normalizedQuery);
    if (!ranking) continue;
    const installed = local.get(entry.id) ?? null;
    ranked.push({
      id: entry.id,
      adapter: entry.adapter,
      kind: entry.kind,
      name: entry.name,
      version: entry.version,
      catalogStatus: entry.status,
      description: entry.description,
      path: entry.path,
      localState: installed?.localState ?? "absent",
      ownership: installed?.ownership ?? null,
      installedVersion: installed?.installedVersion ?? null,
      updateState: installed?.updateState ?? null,
      drifted: installed?.drifted ?? null,
      freshness,
      match: normalizedQuery ? ranking.bucket : null,
      _rank: ranking.order,
    });
  }
  ranked.sort((left, right) => left._rank - right._rank || left.id.localeCompare(right.id));
  const withoutInternalRank = ranked.map(({ _rank, ...entry }) => entry);
  return {
    query: normalizedQuery,
    filters: {
      adapters: selectedAdapters,
      kinds: selectedKinds,
      statuses: selectedStatuses,
    },
    ...page(withoutInternalRank, { offset, limit }),
  };
}

export function listInventory({
  inventory,
  adapters,
  kinds,
  localStates,
  ownership,
  updateStates,
  history = false,
  offset,
  limit,
} = {}) {
  const selectedAdapters = normalizeSet(adapters, ADAPTERS, "adapter", ADAPTERS);
  const selectedKinds = normalizeSet(kinds, PACKAGE_KINDS, "kind", PACKAGE_KINDS);
  const requestedLocalStates = normalizeSet(
    localStates,
    LOCAL_STATES,
    "local-state",
    history ? LOCAL_STATES : LOCAL_STATES.filter((state) => state !== "absent"),
  );
  const explicitLocalStates = Array.isArray(localStates) ? localStates : [localStates];
  if (!history && explicitLocalStates.includes("absent")) {
    throw new SkillMarketError({
      code: "history-required",
      message: "Absent package history is available only when history is explicitly enabled.",
      details: { localStates, history },
      nextAction: "Retry with --history, or remove absent from --local-state.",
    });
  }
  const selectedLocalStates = history
    ? requestedLocalStates
    : requestedLocalStates.filter((state) => state !== "absent");
  const selectedOwnership = normalizeSet(
    ownership,
    OWNERSHIP_STATES,
    "ownership",
    OWNERSHIP_STATES,
  );
  const selectedUpdateStates = normalizeSet(
    updateStates,
    UPDATE_STATES,
    "update-state",
    UPDATE_STATES,
  );
  const filtered = inventory.items.filter(
    (item) =>
      selectedAdapters.includes(item.adapter) &&
      selectedKinds.includes(item.kind) &&
      selectedLocalStates.includes(item.localState) &&
      selectedOwnership.includes(item.ownership) &&
      selectedUpdateStates.includes(item.updateState),
  );
  return {
    filters: {
      adapters: selectedAdapters,
      kinds: selectedKinds,
      localStates: selectedLocalStates,
      ownership: selectedOwnership,
      updateStates: selectedUpdateStates,
      history: Boolean(history),
    },
    catalog: inventory.catalog,
    warnings: inventory.warnings,
    ...page(filtered, { offset, limit }),
  };
}
