// Minimal dependency-free test runner for the heuristics engine.
// Run with: node tests/patterns.test.js

const assert = require("node:assert");
const { scanTextNode, CATEGORIES } = require("../src/patterns.js");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`ok - ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL - ${name}`);
    console.error(err);
  }
}

test("detects auto-renewal subscription language (IT)", () => {
  const r = scanTextNode("L'abbonamento si rinnova automaticamente ogni mese salvo disdetta.");
  assert.ok(r.some((f) => f.category === CATEGORIES.HIDDEN_SUBSCRIPTION));
});

test("detects auto-renewal subscription language (EN)", () => {
  const r = scanTextNode("Your subscription automatically renews unless you cancel before the trial ends.");
  assert.ok(r.some((f) => f.category === CATEGORIES.HIDDEN_SUBSCRIPTION));
});

test("detects added checkout fees", () => {
  const r = scanTextNode("Totale prodotto 19,90 euro + contributo spese di 4,90 euro");
  assert.ok(r.some((f) => f.category === CATEGORIES.ADDED_COST));
});

test("detects confirmshaming decline text", () => {
  const r = scanTextNode("No, preferisco pagare il prezzo pieno");
  assert.ok(r.some((f) => f.category === CATEGORIES.CONFIRMSHAMING));
});

test("detects scarcity / urgency claims", () => {
  const r = scanTextNode("Attenzione: solo 3 rimasti a questo prezzo!");
  assert.ok(r.some((f) => f.category === CATEGORIES.FAKE_URGENCY));
});

test("detects phone-only cancellation", () => {
  const r = scanTextNode("Per disdire chiama il nostro numero verde dal lunedi al venerdi");
  assert.ok(r.some((f) => f.category === CATEGORIES.HARD_TO_CANCEL));
});

test("does not flag neutral text", () => {
  const r = scanTextNode("Grazie per il tuo ordine, la consegna e prevista in 3 giorni lavorativi.");
  assert.strictEqual(r.length, 0);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
