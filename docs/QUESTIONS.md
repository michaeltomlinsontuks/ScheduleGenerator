<!-- tyto-docs
tyto_docs: 1
kind: questions
-->

# Open questions

This file is the state. Nothing generates it and nothing regenerates over it, so an answer
typed here is the answer the tool reads.

To answer a question, find its heading and write a line reading `**Answer:**` followed by
the answer. That is the whole format:

````markdown
## `example.key`

**Unit:** `packages/example`

Does anything here read the process working directory?

**Answer:**

No. Every command takes `--repository-root`.
````

The answer may be one line or many: everything below `**Answer:**`, down to the next `##`
heading, is the answer. A question with no `**Answer:**` line is still open. The `**Unit:**`
line is optional and belongs directly under the heading.

A near miss such as `Answer:` or `**Answer**:` is refused with an error naming the line,
rather than read as ordinary prose — a near miss that parsed as prose would lose the answer
without saying so. Check this file with
`tyto-docs-engine lint --repository-root . --file DOCS/QUESTIONS.md` before anything else
reads it.

## Draft answers

A `**Draft answer:**` line is a model's proposal, not a ruling. A question carrying one is
still **open**: it is still dispatched, and the tool still waits for a person. Only
`**Answer:**` resolves a question, and only a person writes that.

The distinction exists because a model answer written as `**Answer:**` is byte-identical to
a developer's, so nothing downstream can tell them apart — the question would be silently
resolved by the same system that asked it. A good draft is genuinely useful, so it is kept
and shown rather than thrown away; confirming one is a matter of changing the two words above
it, or replacing the text underneath.

## `critic.rework.7ebf1ee2`

<a id="critic.rework.7ebf1ee2"></a>

**Unit:** `frontend/src/app/terms`

**Asked By:** critic

**Asked At:** 2026-09-14T11:51:11Z

**Earliest Action Tick:** after:20260914T105112Z

Critic finding critic.frontend-src-app-terms.ebd3c353 was still present after the configured rework cap: The research records no finding for the page's 'Acceptance of Terms' section (page.tsx L39-L46), which is the first section of the page; the document's 'How it works' prose and its behaviour diagram therefore enumerate the page's sections without it, so the document's claim of 'Terms sections, in fixed order' does not fully represent the page it documents.
