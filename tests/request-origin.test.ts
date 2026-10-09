import test from "node:test";
import assert from "node:assert/strict";
import { requestOriginCheck } from "../lib/request-origin";
const app = "https://shaz-test-staging.up.railway.app";
const request = (headers: Record<string, string>, target = app) => new Request(target + "/api/auth/sign-in/email", { method: "POST", headers });
test("canonical Origin is accepted; unrelated, same-site and malformed origins are rejected", () => {
  assert.equal(requestOriginCheck(request({origin:app}), app).allowed, true);
  for (const origin of ["https://attacker.example", "https://shaz-production.up.railway.app", app+".attacker.example", app+"/", "http://shaz-test-staging.up.railway.app"]) {
    assert.equal(requestOriginCheck(request({origin,"sec-fetch-site":"same-origin"}),app).allowed,false);
  }
});
test("null or omitted Origin requires browser same-origin metadata AND the canonical request target", () => {
  for (const origin of [undefined, "null"]) {
    const headers: Record<string,string> = origin === undefined ? {} : {origin};
    assert.equal(requestOriginCheck(request({...headers,"sec-fetch-site":"same-origin"}),app).allowed,true);
    for (const site of [undefined,"cross-site","same-site","none"]) {
      const h = site ? {...headers,"sec-fetch-site":site} : headers;
      assert.equal(requestOriginCheck(request(h),app).allowed,false);
    }
    assert.equal(requestOriginCheck(request({...headers,"sec-fetch-site":"same-origin"},"https://attacker.example"),app).allowed,false);
    assert.equal(requestOriginCheck(request({...headers,"sec-fetch-site":"same-origin"},"http://localhost:8080"),app).allowed,false);
  }
});
test("forwarded headers, referer and request credentials cannot authorize a rejected origin or appear in diagnostics", () => {
  const h={origin:"https://attacker.example",referer:app,"x-forwarded-host":"shaz-test-staging.up.railway.app","x-forwarded-proto":"https",cookie:"session=private-test-value",authorization:"Bearer private-test-value"};
  const result=requestOriginCheck(request(h),app);
  assert.equal(result.allowed,false);
  assert.doesNotMatch(JSON.stringify(result),/attacker|private-test-value|session|Bearer|shaz-test/);
  assert.equal(requestOriginCheck(request(h),"not-a-url").allowed,false);
});
