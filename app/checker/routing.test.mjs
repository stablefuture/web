import { test } from "node:test";
import assert from "node:assert/strict";
import { overviewId } from "./routing.ts";

test("linked O*NET jobs open their SOC4 parent overview", () => {
  assert.equal(overviewId({ id: "onet:21-1023.00", soc4: "2461" }), "soc4:2461");
});

test("ordinary checker rows keep their own target", () => {
  assert.equal(overviewId({ id: "soc4:2461" }), "soc4:2461");
  assert.equal(overviewId({ id: "hecos:100497" }), "hecos:100497");
});
