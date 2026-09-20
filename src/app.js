import { compile, exportAll } from "./compiler.js"

const EXAMPLES = [
  "Classify this support ticket as billing, technical, account access, or other. Score its urgency from 0 to 1, and decide whether it needs human review. Return JSON.",
  "Review this inbound lead. Choose a segment: enterprise, startup, agency, or individual. Score purchase intent from 0 to 1. Decide if sales should follow up.",
  "Evaluate this user comment. Label it as safe, spam, harassment, or explicit. Rate severity from 0 to 1 and determine whether a moderator must review it."
]

const input = document.querySelector("#promptInput")
const output = document.querySelector("#codeOutput")
const count = document.querySelector("#charCount")
const copy = document.querySelector("#copyButton")
let language = "javascript"
let outputs = {}
let exampleIndex = 0

function render() {
  const typedPrompt = input.value.trim()
  const analysis = compile(typedPrompt || input.placeholder)
  outputs = exportAll(analysis)
  output.textContent = outputs[language]
  count.textContent = typedPrompt ? `${input.value.length} character${input.value.length === 1 ? "" : "s"}` : "Example prompt"
  document.querySelector("#fitLabel").textContent = analysis.suitability.replaceAll("_", " ")
  document.querySelector("#primitiveCount").textContent = `${analysis.questions.length} primitive${analysis.questions.length === 1 ? "" : "s"} found`
}

input.addEventListener("input", render)
document.querySelector("#clearButton").addEventListener("click", () => { input.value = ""; input.focus(); render() })
document.querySelector("#exampleButton").addEventListener("click", () => { exampleIndex = (exampleIndex + 1) % EXAMPLES.length; input.value = EXAMPLES[exampleIndex]; render() })
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
