import test from "node:test"
import assert from "node:assert/strict"
import { compile, exportJavaScript, exportPython } from "../src/compiler.js"

const prompt = "Classify this support ticket as billing, technical, account access, or other. Score its urgency from 0 to 1, and decide whether it needs human review. Return JSON."

test("extracts Choice, Score, and Noul questions", () => {
  const result = compile(prompt)
  assert.equal(result.suitability, "strong")
  assert.deepEqual(result.questions.map(question => question.type), ["choice", "score", "noul"])
  assert.deepEqual(Object.keys(result.questions[0].criteria), ["billing", "technical", "account_access", "other"])
})

test("marks prose generation as not a fit", () => {
  const result = compile("Write a warm welcome email for our new customer.")
  assert.equal(result.suitability, "not_a_fit")
  assert.equal(result.questions.length, 0)
})

test("exports official SDK-shaped examples", () => {
  const result = compile(prompt)
  assert.match(exportJavaScript(result), /@typesafe-ai\/sdk/)
  assert.match(exportJavaScript(result), /client\.systemOne/)
  assert.match(exportJavaScript(result), /"category": choice/)
  assert.match(exportPython(result), /client\.system_one/)
  assert.match(exportPython(result), /Noul/)
})

test("extracts lead segments and purchase intent", () => {
  const result = compile("Choose a segment: enterprise, startup, agency, or individual. Score purchase intent from 0 to 1.")
  assert.equal(result.questions[0].id, "segment")
  assert.deepEqual(Object.keys(result.questions[0].criteria), ["enterprise", "startup", "agency", "individual"])
  assert.equal(result.questions[1].id, "purchase_intent")
})

test("extracts moderation labels and review decision", () => {
  const result = compile("Label this comment as safe, spam, harassment, or explicit. Determine whether it needs moderator review.")
  assert.equal(result.questions[0].id, "label")
  assert.equal(result.questions[1].id, "needs_moderator_review")
  assert.equal(result.questions[1].type, "noul")
})

test("uses a generic ordered rubric for unknown scores", () => {
  const result = compile("Rate the relevance from 0 to 1.")
  assert.deepEqual(result.questions[0].criteria, ["Low", "Medium", "High"])
  assert.match(result.warnings[0], /ordered criteria/)
})

test("marks a single bounded decision as a partial fit", () => {
  const result = compile("Classify this request as sales or support.")
  assert.equal(result.suitability, "partial")
  assert.equal(result.questions.length, 1)
})

test("limits malformed choice lists to safe defaults", () => {
  const options = Array.from({ length: 13 }, (_, index) => `option ${index + 1}`).join(", ")
  const result = compile(`Classify this as ${options}.`)
  assert.deepEqual(Object.keys(result.questions[0].criteria), ["option_a", "option_b", "other"])
})

test("exports neutral JSON without changing the analysis", async () => {
  const { exportAll } = await import("../src/compiler.js")
  const result = compile(prompt)
  assert.deepEqual(JSON.parse(exportAll(result).json), result)
})
