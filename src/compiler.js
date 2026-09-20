const DEFAULT_OPTIONS = ["option_a", "option_b", "other"]

const RUBRICS = {
  urgency: ["Not urgent", "Moderately urgent", "Extremely urgent"],
  purchase_intent: ["No purchase intent", "Considering a purchase", "Ready to purchase"],
  severity: ["Low severity", "Moderate severity", "High severity"],
  quality: ["Low quality", "Acceptable quality", "High quality"]
}

const SCORE_INSTRUCTIONS = {
  urgency: "How urgent is `input`?",
  purchase_intent: "How strong is the purchase intent in `input`?",
  severity: "How severe is the issue in `input`?",
  quality: "How high-quality is `input`?"
}

const NOUL_INSTRUCTIONS = {
  needs_moderator_review: "Does `input` need moderator review?",
  sales_follow_up: "Should sales follow up on `input`?",
  needs_human_review: "Does `input` need human review?",
  should_block: "Should `input` be blocked?"
}

const normalizeId = value => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")

function extractOptions(prompt) {
  const match = prompt.match(/(?:\bas\b|segment:|label(?:\s+(?:it|this\s+\w+))?(?:\s+as)?|choose(?: one of)?(?: a)?(?: segment)?:)\s+(.+?)(?=\.\s*(?:Score|Rate|Decide|Determine|Return)|\.|$)/i)
  if (!match) return DEFAULT_OPTIONS
  const options = match[1].replace(/\b(?:and|or)\b/gi, ",").split(",").map(normalizeId).filter(Boolean)
  return options.length >= 2 && options.length <= 12 ? [...new Set(options)] : DEFAULT_OPTIONS
}

function choiceQuestion(prompt, lowered) {
  if (!/classif|categor|label|choose|segment/.test(lowered)) return null
  const id = lowered.includes("segment") || lowered.includes("lead") ? "segment" : lowered.includes("label") || lowered.includes("comment") || lowered.includes("moderation") ? "label" : "category"
  return { id, type: "choice", instructions: `Which ${id.replaceAll("_", " ")} best describes \`input\`?`, criteria: Object.fromEntries(extractOptions(prompt).map(option => [option, null])) }
}

function scoreQuestion(prompt, lowered) {
  if (!/\b(score|rate|rank)\b/.test(lowered)) return null
  let id = "score"
  if (lowered.includes("purchase intent")) id = "purchase_intent"
  else if (lowered.includes("severity")) id = "severity"
  else if (lowered.includes("quality")) id = "quality"
  else if (lowered.includes("urgency") || lowered.includes("urgent")) id = "urgency"
  else {
    const match = prompt.match(/(?:score|rate|rank)\s+(?:its|the)?\s*([a-z][a-z ]+?)(?:\s+from|\s+on|\s+between|\.|,|$)/i)
    id = normalizeId(match?.[1] || "score")
  }
  return { id, type: "score", instructions: SCORE_INSTRUCTIONS[id] || `How does \`input\` score for ${id.replaceAll("_", " ")}?`, criteria: RUBRICS[id] || ["Low", "Medium", "High"] }
}

function noulQuestion(prompt) {
  const match = prompt.match(/(?:decide|determine|check)\s+(?:whether|if)\s+(.+?)(?:\.|$)/i)
  if (!match) return null
  const condition = match[1].trim()
  let id
  if (/moderator/i.test(condition)) id = "needs_moderator_review"
  else if (/sales.*follow up/i.test(condition)) id = "sales_follow_up"
  else if (/human.*review/i.test(condition)) id = "needs_human_review"
  else if (/should.*block/i.test(condition)) id = "should_block"
  else id = normalizeId(condition).split("_").slice(0, 5).join("_")
  let statement = condition.replace(/^it\s+/i, "`input` ")
  if (!statement.includes("`input`")) statement = `\`input\` ${statement}`
  return { id, type: "noul", instructions: NOUL_INSTRUCTIONS[id] || `Is it true that ${statement.replace(/\?$/, "")}?`, criteria: null }
}

export function compile(prompt) {
  const cleanPrompt = String(prompt).trim()
  const lowered = cleanPrompt.toLowerCase()
  const questions = [choiceQuestion(cleanPrompt, lowered), scoreQuestion(cleanPrompt, lowered), noulQuestion(cleanPrompt)].filter(Boolean)
  const warnings = []
  if (!questions.length) warnings.push("No bounded Choice, Score, or Noul question was detected.")
  if (questions.some(question => question.type === "score")) warnings.push("Review the generated Score rubric; Jev scores ordered criteria, not an arbitrary 0-to-1 range.")
  return { suitability: questions.length >= 2 ? "strong" : questions.length ? "partial" : "not_a_fit", questions, warnings }
}

const quote = value => JSON.stringify(value)

export function exportJavaScript(analysis) {
  const questions = analysis.questions.map(question => {
    let value
    if (question.type === "choice") {
      const criteria = Object.entries(question.criteria).map(([key, description]) => `      ${quote(key)}: ${description ? quote(description) : "null"}`).join(",\n")
      value = `choice(${quote(question.instructions)}, {\n${criteria}\n    })`
    } else if (question.type === "score") value = `score(${quote(question.instructions)}, ${JSON.stringify(question.criteria)})`
    else value = `noul(${quote(question.instructions)})`
    return `    ${quote(question.id)}: ${value}`
  }).join(",\n")
  return `import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";\n\nconst client = new TypeSafeClient();\nconst response = await client.systemOne({\n  state: { input: content },\n  questions: {\n${questions}\n  },\n});`
}

function pythonLiteral(value) {
  if (value === null) return "None"
  if (Array.isArray(value)) return `[${value.map(pythonLiteral).join(", ")}]`
  if (typeof value === "object") return `{${Object.entries(value).map(([key, item]) => `${quote(key)}: ${pythonLiteral(item)}`).join(", ")}}`
  return quote(value)
}

export function exportPython(analysis) {
  const questions = analysis.questions.map(question => {
    const className = question.type[0].toUpperCase() + question.type.slice(1)
    const args = [`instructions=${quote(question.instructions)}`]
    if (question.criteria) args.push(`criteria=${pythonLiteral(question.criteria)}`)
    return `            ${quote(question.id)}: ${className}(${args.join(", ")})`
  }).join(",\n")
  return `from typesafe_sdk import Choice, Noul, Score, TypeSafeClient\n\nwith TypeSafeClient() as client:\n    response = client.system_one(\n        state={"input": content},\n        questions={\n${questions}\n        },\n    )`
}

export function exportAll(analysis) {
  return { javascript: exportJavaScript(analysis), python: exportPython(analysis), json: JSON.stringify(analysis, null, 2) }
}
