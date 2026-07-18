---
'number-flow': patch
---

Avoid forced reflows from redundant layout measurement: skip identity-equal `data` re-sets (React 19 double-sets `data` on mount) and skip the `willUpdate` measurement pass when animations can't run
