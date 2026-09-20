const apiKey = process.env.TYPESAFE_API_KEY

if (!apiKey) {
  console.error("TYPESAFE_API_KEY is required. The key is read from your environment and is never printed.")
  process.exit(1)
}

const response = await fetch("https://api.typesafe.ai/v1/systemone", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    state: { input: "My card was charged twice and I need a refund today." },
    model: "jev-latest",
    questions: {
      category: {
        type: "choice",
        instructions: "Which category best describes `input`?",
        criteria: { billing: "Charges, invoices, or refunds", technical: "Bugs or outages", other: "Anything else" }
      },
      urgency: {
        type: "score",
        instructions: "How urgent is `input`?",
        criteria: ["Not urgent", "Moderately urgent", "Extremely urgent"]
      },
      needs_human_review: {
        type: "noul",
        instructions: "Does `input` need human review?"
      }
    }
  })
})

const result = await response.json()
if (!response.ok) throw new Error(`TypeSafe API returned ${response.status}: ${JSON.stringify(result)}`)

const { category, urgency, needs_human_review: review } = result.answers || {}
if (!["billing", "technical", "other"].includes(category?.choice)) throw new Error("Choice answer has an unexpected shape.")
if (typeof urgency?.score !== "number") throw new Error("Score answer has an unexpected shape.")
if (typeof review?.noul !== "number") throw new Error("Noul answer has an unexpected shape.")

console.log("Live Jev smoke test passed.")
console.log(`Model: ${result.model}`)
console.log(`Choice: ${category.choice}; Score: ${urgency.score}; Noul: ${review.noul}`)
