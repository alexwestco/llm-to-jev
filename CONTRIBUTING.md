# Contributing

Thanks for helping improve LLMtoJev.

## Before opening a pull request

1. Keep conversion logic in `src/compiler.js` independent from the interface.
2. Add or update a test for every conversion behavior change.
3. Run `npm test`.
4. Keep the project dependency-free unless a dependency solves a demonstrated problem.

## Good first contributions

- Add representative prompt fixtures.
- Improve detection of Choice, Score, or Noul questions.
- Report prompts that produce misleading output.
- Improve accessibility or mobile behavior.

Generated output is a proposal, not a guarantee of equivalent behavior. Changes should favor predictable, reviewable output over clever but opaque inference.
