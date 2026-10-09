/**
 * Keep a strict configured origin. Privacy-restricted browser submissions may
 * omit Origin or send null; only browser same-origin Fetch Metadata to the
 * canonical request URL is an acceptable fallback. Do not trust forwarded
 * headers, referrers, wildcards, client JSON, or an untrusted non-null Origin.
 */
export function requestOriginCheck(req: Request, appURL: string) {
  const supplied = req.headers.get("origin");
  const fetchSite = req.headers.get("sec-fetch-site");
  const originKind = supplied === null ? "missing" : supplied === "null" ? "null" : "present";
  try {
    const expected = new URL(appURL).origin;
    const targetMatches = new URL(req.url).origin === expected;
    if (supplied === expected) return { allowed: true, reason: "canonical-origin" as const };
    if ((supplied === null || supplied === "null") && fetchSite === "same-origin" && targetMatches) {
      return { allowed: true, reason: "same-origin-fetch-metadata" as const };
    }
    return {
      allowed: false,
      reason: "origin-rejected" as const,
      originKind,
      fetchSite: ["same-origin", "same-site", "cross-site", "none"].includes(fetchSite || "") ? fetchSite : "missing-or-other",
      targetMatches,
    };
  } catch {
    return { allowed: false, reason: "invalid-origin-configuration" as const, originKind };
  }
}
