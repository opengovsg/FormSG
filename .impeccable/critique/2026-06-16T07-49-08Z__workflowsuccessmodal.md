---
target: WorkflowSuccessModal
total_score: 26
p0_count: 0
p1_count: 0
timestamp: 2026-06-16T07-49-08Z
slug: workflowsuccessmodal
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Modal shows completion state clearly, but no section headers |
| 2 | Match System / Real World | 3 | Good plain language |
| 3 | User Control and Freedom | 3 | Can close via overlay or Done. No X button. |
| 4 | Consistency and Standards | 3 | Follows FormSG modal pattern |
| 5 | Error Prevention | 3 | n/a |
| 6 | Recognition Rather Than Recall | 2 | No labels on green/amber sections |
| 7 | Flexibility and Efficiency | 2 | Basic keyboard support only |
| 8 | Aesthetic and Minimalist Design | 2 | Functional but bland |
| 9 | Error Recovery | 3 | n/a |
| 10 | Help and Documentation | 2 | No guidance on what to do about left items |
| **Total** | | **26/40** | **Acceptable** |

### Priority Issues
- [P2] No section labels on done/left boxes - color alone for meaning
- [P2] Missing ModalCloseButton - breaks consistency
- [P2] Modal doesn't feel celebratory - no animation, small icon, static
- [P3] Large gap between headline and content
- [P3] Left items don't guide next action
