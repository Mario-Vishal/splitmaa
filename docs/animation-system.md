# Animation System

Animations in Splitmaa exist to make deterministic app actions visible. They must reflect validated execution steps, not raw model output.

Current foundation:

- Execution plans are generated in `@splitmaa/core`.
- The assistant shows execution steps before confirmation.
- Confirmed actions mark steps complete and record commentary.

Next work:

- Collapse expanded chat into a commentary bar during execution.
- Highlight affected contacts and group cards.
- Animate balance deltas after persistence succeeds.
