<!-- tyto-docs
tyto_docs: 1
kind: questions
unit: frontend/src/app/terms
-->

# Questions raised by this unit

This file is a worker's outbox, not the answer state. Write questions here; the tick merges
them into the repository's `DOCS/QUESTIONS.md` at the end of the run, and that is the file a
person answers in. An answer typed *here* is not read by anything.

One question is one `## ` section whose heading is its key in backticks, exactly as in
`DOCS/QUESTIONS.md`:

````markdown
## `example.key`

**Unit:** `packages/example`

Does anything here read the process working directory?
````

## `critic.rework.7ebf1ee2`

<a id="critic.rework.7ebf1ee2"></a>

**Unit:** `frontend/src/app/terms`

**Asked By:** critic

**Asked At:** 2026-09-14T11:51:11Z

**Earliest Action Tick:** after:20260914T105112Z

Critic finding critic.frontend-src-app-terms.ebd3c353 was still present after the configured rework cap: The research records no finding for the page's 'Acceptance of Terms' section (page.tsx L39-L46), which is the first section of the page; the document's 'How it works' prose and its behaviour diagram therefore enumerate the page's sections without it, so the document's claim of 'Terms sections, in fixed order' does not fully represent the page it documents.
