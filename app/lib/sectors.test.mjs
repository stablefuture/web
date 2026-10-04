import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./sectors.ts", import.meta.url), "utf8");
const labels = Object.fromEntries(
  [...source.matchAll(/"(soc2:\d{2})": "([^"]+)"/g)].map(([, id, label]) => [id, label]),
);
const data = JSON.parse(readFileSync(new URL("../../public/v3.json", import.meta.url)));

test("every published job sector has one plain-English label", () => {
  for (const sector of data.sectors.jobs) assert.ok(labels[sector.id], sector.id);
});

test("labels name easily lost parts of broad SOC groups", () => {
  assert.match(labels["soc2:24"], /welfare.*public service/i);
  assert.match(labels["soc2:61"], /animal care/i);
  assert.match(labels["soc2:81"], /construction/i);
  assert.match(labels["soc2:92"], /admin.*warehouse/i);
});
