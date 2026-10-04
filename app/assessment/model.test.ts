import assert from "node:assert/strict";
import { test } from "node:test";
// @ts-expect-error Node's test runner loads this TypeScript source file directly.
import { targetJobIds, linkedRoutes, type Job } from "./model.ts";

const job = (code: string): Job => ({
  id: `onet:${code}`, path: "jobs", label: code, sectors: [], exposure: null,
  substitution: null, risk: null, salary: null, openings: null,
});

const degree = (id: string, cah3: string, codes: string[], status: Job["status"] = "approved"): Job => ({
  id, path: "degrees", label: id, sectors: ["cah2:02-02"], exposure: null,
  substitution: null, risk: null, salary: null, openings: null, onetCodes: codes,
  status, cah3: { code: cah3, label: "Biology" },
});

const units = [
  job("11-1111.00"), job("22-2222.00"), job("33-3333.00"), job("44-4444.00"),
  degree("hecos:100001", "CAH02-02-02", ["11-1111.00"]),
  degree("hecos:100002", "CAH02-02-02", ["22-2222.00"]),
  degree("hecos:100003", "CAH02-02-02", ["33-3333.00"], "needs_review"),
  degree("hecos:100004", "CAH03-01-01", ["44-4444.00"]),
];

test("a legacy CAH3 target resolves only through approved HECoS children", () => {
  assert.deepEqual([...targetJobIds(units, ["degree-02-02-02"])].sort(), [
    "onet:11-1111.00", "onet:22-2222.00",
  ]);
});

test("a selected HECoS subject does not inherit sibling jobs from its CAH group", () => {
  assert.deepEqual([...targetJobIds(units, ["hecos:100001"])], ["onet:11-1111.00"]);
});

test("a pending HECoS route cannot target a career even if codes are present", () => {
  assert.deepEqual([...targetJobIds(units, ["hecos:100003"])], []);
});

test("old degree links and unapproved HECoS links cannot appear in route cards", () => {
  const old = {...degree("degree-02-02-02", "CAH02-02-02", ["33-3333.00"]), roles: [2]};
  const unknown = {...degree("hecos:100099", "CAH02-02-02", ["33-3333.00"]), status: undefined};
  assert.deepEqual(linkedRoutes(job("33-3333.00"), [...units, old, unknown]), []);
  assert.ok(!targetJobIds([...units, old], [old.id]).has("onet:33-3333.00"));
  assert.deepEqual(linkedRoutes(job("11-1111.00"), units).map(route => route.id), ["hecos:100001"]);
});

test("the last published legacy dataset remains usable before the HECoS release", () => {
  const old = degree("degree-02-02-02", "CAH02-02-02", ["33-3333.00"]);
  const legacy = [job("33-3333.00"), old];
  assert.deepEqual([...targetJobIds(legacy, [old.id])], ["onet:33-3333.00"]);
  assert.deepEqual(linkedRoutes(legacy[0], legacy).map(route => route.id), [old.id]);
});
