# LLMtoJev

**Turn decision-shaped LLM prompts into proposed Jev primitives.**

[Try the live demo](https://alexwestco.github.io/llm-to-jev/) · [Read the Jev docs](https://docs.typesafe.ai/) · [Contribute](CONTRIBUTING.md)

LLMtoJev finds bounded decisions inside prompts written for GPT, Claude, or Gemini and proposes Jev `Choice`, `Score`, and `Noul` questions. It is designed for classification, scoring, routing, and yes/no judgments that do not require generated prose.

Each prompt is marked as fully convertible, partially convertible, or not convertible. For mixed prompts, the converter separates Jev-compatible decisions from writing, summarization, translation, and other generative work that must remain with an LLM.

## Example

**Input**

```text
Classify this support ticket as billing, technical, account access, or other.
Score its urgency from 0 to 1, and decide whether it needs human review.
```

**Detected primitives**

```json
{
  "suitability": "strong",
  "compatibility": "full",
  "questions": [
    { "id": "category", "type": "choice" },
    { "id": "urgency", "type": "score" },
    { "id": "needs_human_review", "type": "noul" }
  ]
}
```

The interface exports ready-to-review examples for TypeSafe's official JavaScript and Python SDKs, plus the complete neutral JSON representation.

## Why this exists

Many LLM calls do not need prose generation. They ask a model to choose from known options, assign an ordered score, or answer a boolean question. Jev provides primitives for those bounded decisions. LLMtoJev helps identify prompts that may be candidates for that migration.

This is a conversion assistant, not an automatic guarantee of equivalent behavior.

## Run locally

Requires Node.js 20 or newer. There are no dependencies or build steps.

```bash
git clone https://github.com/alexwestco/llm-to-jev.git
cd llm-to-jev
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

Run the test suite:

```bash
npm test
```

Run an optional live smoke test against Jev with your own API key:

```bash
TYPESAFE_API_KEY=your_key npm run test:live
```

The key is read from the process environment and is never stored or printed.

## Project structure

```text
index.html              Page structure
src/app.js              Browser interactions
src/compiler.js         Prompt compiler and code exporters
src/style.css           Interface styles
test/compiler.test.js   Compiler and exporter tests
scripts/serve.js        Tiny local development server
```

Everything runs locally in the browser. There is no framework, database, account, API, or server-side prompt processing. The site can be hosted on any static file host.

## Supported output

- JavaScript/TypeScript using `@typesafe-ai/sdk`
- Python using `typesafe-sdk`
- Ruby using the HTTP API
- Go using the HTTP API
- cURL using the HTTP API
- JSON for language-neutral integrations

## Limitations

- The compiler uses deterministic heuristics, not an LLM or evaluation model.
- It understands a deliberately small set of common prompt patterns.
- Generated instructions and criteria must be reviewed before production use.
- Score ranges such as `0 to 1` are translated into ordered Jev criteria.
- Prompts requiring open-ended prose are not a fit.

## Roadmap

- Build a fixture-based evaluation set from representative prompts.
- Make inferred instructions and criteria editable.
- Improve decomposition of multi-step and ambiguous prompts.
- Compare original LLM and Jev outputs, latency, and estimated cost.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

[MIT](LICENSE) © Alex West
