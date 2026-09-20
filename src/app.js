import { compile, exportAll } from "./compiler.js"

const EXAMPLES = {
  support: "Classify this support ticket as billing, technical, account access, or other. Score its urgency from 0 to 1, and decide whether it needs human review. Return JSON.",
  lead: "Review this inbound lead. Choose a segment: enterprise, startup, agency, or individual. Score purchase intent from 0 to 1. Decide if sales should follow up.",
  moderation: "Evaluate this user comment. Label it as safe, spam, harassment, or explicit. Rate severity from 0 to 1 and determine whether a moderator must review it.",
  routing_reply: "Classify this support ticket as billing, technical, or other and write a friendly response.",
  review_summary: "Determine whether this contract needs human review, then summarize the key risks.",
  welcome_email: "Write a warm welcome email for our new customer."
}

const input = document.querySelector("#promptInput")
const output = document.querySelector("#codeOutput")
const count = document.querySelector("#charCount")
const copy = document.querySelector("#copyButton")
let language = "javascript"
let outputs = {}
const exampleSelect = document.querySelector("#exampleSelect")

function render() {
  const typedPrompt = input.value.trim()
  const analysis = compile(typedPrompt || input.placeholder)
  outputs = exportAll(analysis)
  output.textContent = outputs[language]
  count.textContent = typedPrompt ? `${input.value.length} character${input.value.length === 1 ? "" : "s"}` : "Example prompt"
  const compatibilityLabels = { full: "Fully convertible", partial: "Partially convertible", none: "Not convertible" }
  const compatibilityReasons = {
    full: "Every detected task maps to a bounded Jev decision.",
    partial: [...analysis.generationTasks.map(task => `${task} stays with an LLM`), ...analysis.missingDetails].join(". ") + ".",
    none: analysis.generationTasks.length ? `${analysis.generationTasks.join(", ")} requires an LLM.` : "No bounded Jev decision was detected."
  }
  const fitLabel = document.querySelector("#fitLabel")
  fitLabel.textContent = compatibilityLabels[analysis.compatibility]
  fitLabel.dataset.compatibility = analysis.compatibility
  document.querySelector("#compatibilityReason").textContent = compatibilityReasons[analysis.compatibility]
  document.querySelector("#primitiveCount").textContent = `${analysis.questions.length} primitive${analysis.questions.length === 1 ? "" : "s"} found`
}

input.addEventListener("input", () => {
  if (EXAMPLES[exampleSelect.value] !== input.value) exampleSelect.value = ""
  render()
})
document.querySelector("#clearButton").addEventListener("click", () => { input.value = ""; exampleSelect.value = ""; input.focus(); render() })
exampleSelect.addEventListener("change", () => {
  if (!exampleSelect.value) return
  input.value = EXAMPLES[exampleSelect.value]
  render()
  input.focus()
})
document.querySelectorAll(".language-tab").forEach(tab => tab.addEventListener("click", () => {
  language = tab.dataset.language
  document.querySelectorAll(".language-tab").forEach(item => item.classList.toggle("active", item === tab))
  output.textContent = outputs[language]
}))
copy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(outputs[language])
  const label = copy.querySelector("span")
  label.textContent = "Copied"
  window.setTimeout(() => { label.textContent = "Copy code" }, 1400)
})

render()
