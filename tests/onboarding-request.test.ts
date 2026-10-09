import test from "node:test";
import assert from "node:assert/strict";
import { onboardingRequest, OnboardingRequestError } from "../lib/onboarding-request";

test("Safari Load failed is retried and recovered without losing the draft", async () => {
  let attempts = 0;
  const result = await onboardingRequest<{ draft: { version: string } }>("/api/ai/intake", {}, {
    fetcher: (async () => {
      attempts += 1;
      if (attempts < 3) throw new TypeError("Load failed");
      return Response.json({ draft: { version: "fixture" } });
    }) as typeof fetch,
    wait: async () => {},
  });
  assert.equal(result.draft.version, "fixture");
  assert.equal(attempts, 3);
});

test("A transient lost POST response may retry because identical draft writes are idempotent", async () => {
  let attempts = 0;
  const payload = JSON.stringify({ version: "fixture", goal: "strength" });
  const result = await onboardingRequest<{ ok: boolean }>("/api/ai/intake", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: payload,
  }, {
    fetcher: (async (_url, request) => {
      assert.equal(request?.body, payload);
      attempts++;
      if (attempts === 1) throw new TypeError("Load failed");
      return Response.json({ ok: true });
    }) as typeof fetch,
    wait: async () => {},
  });
  assert.equal(result.ok, true);
  assert.equal(attempts, 2);
});

test("Permanent connection error becomes a Danish recovery message, never Load failed", async () => {
  await assert.rejects(
    onboardingRequest("/api/ai/intake", {}, {
      fetcher: (async () => { throw new TypeError("Load failed"); }) as typeof fetch,
      wait: async () => {},
    }),
    (e: unknown) => e instanceof OnboardingRequestError &&
      /Forbindelsen blev afbrudt/.test(e.message) &&
      !/Load failed/.test(e.message),
  );
});

test("Authentication errors and invalid input are not retried", async () => {
  for (const code of [400, 401, 403]) {
    let calls = 0;
    await assert.rejects(onboardingRequest("/api/ai/intake",{},{
      fetcher: (async () => { calls++; return Response.json({ error: "Testfejl" }, { status: code }); }) as typeof fetch,
      wait: async () => {},
    }), (e: unknown) => e instanceof OnboardingRequestError && e.status === code);
    assert.equal(calls, 1);
  }
});

test("503 transient service errors are retried and expected JSON is delivered", async () => {
  let calls = 0;
  const result=await onboardingRequest<{ draft: null }>("/api/ai/intake",{},{
    fetcher:(async()=> { calls++; return calls === 1 ?
      Response.json({ error: "Service down" }, { status: 503 }) :
      Response.json({ draft: null }); }) as typeof fetch,
    wait: async () => {},
  });
  assert.equal(result.draft, null);
  assert.equal(calls, 2);
});
