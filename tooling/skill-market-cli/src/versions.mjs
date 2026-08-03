const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/u;

export function parseSemver(value) {
  if (typeof value !== "string") {
    return null;
  }
  const match = SEMVER.exec(value);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split(".") ?? [],
  };
}

export function isSemver(value) {
  return parseSemver(value) !== null;
}

function comparePrerelease(left, right) {
  if (left.length === 0 || right.length === 0) {
    return left.length === right.length ? 0 : left.length === 0 ? 1 : -1;
  }
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (a === undefined || b === undefined) {
      return a === b ? 0 : a === undefined ? -1 : 1;
    }
    if (a === b) continue;
    const aNumber = /^\d+$/u.test(a) ? Number(a) : null;
    const bNumber = /^\d+$/u.test(b) ? Number(b) : null;
    if (aNumber !== null && bNumber !== null) return Math.sign(aNumber - bNumber);
    if (aNumber !== null) return -1;
    if (bNumber !== null) return 1;
    return a.localeCompare(b);
  }
  return 0;
}

export function compareSemver(leftValue, rightValue) {
  const left = parseSemver(leftValue);
  const right = parseSemver(rightValue);
  if (!left || !right) {
    throw new TypeError("compareSemver requires valid semantic versions");
  }
  for (const field of ["major", "minor", "patch"]) {
    if (left[field] !== right[field]) {
      return Math.sign(left[field] - right[field]);
    }
  }
  return comparePrerelease(left.prerelease, right.prerelease);
}
