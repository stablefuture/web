import { test } from "node:test";
import assert from "node:assert/strict";
import { degreeTitle } from "./titleCase.mjs";

test("formats standard degree subjects as titles", () => {
  assert.equal(degreeTitle("childhood and youth studies"), "Childhood and Youth Studies");
  assert.equal(degreeTitle("history of art"), "History of Art");
  assert.equal(degreeTitle("teaching English as a foreign language"), "Teaching English as a Foreign Language");
  assert.equal(degreeTitle("human-computer interaction"), "Human-Computer Interaction");
});

test("preserves acronyms and existing proper nouns", () => {
  assert.equal(degreeTitle("artificial intelligence and AI"), "Artificial Intelligence and AI");
  assert.equal(degreeTitle("UK government/parliamentary studies"), "UK Government/Parliamentary Studies");
  assert.equal(degreeTitle("Northern Irish law"), "Northern Irish Law");
});
