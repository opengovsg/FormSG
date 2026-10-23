# Side navigation before and after

Captured 2026-10-23 for `codex/standardise-side-navs`.

- Before application source: `c28deea250b52520a18c678053f01b275a172160`.
- After application source: `204665282ba22a260fbbb80fc2cb9dcbe99bb5b8`.
- Desktop viewport: 1440 × 1000. Mobile viewport: 390 × 844.
- Both use matching existing Storybook mock users, forms and responses, feature flags, fonts and viewport decorators. No production data.
- Before runs the actual base application source in a separate snapshot. Three page-story files were overlaid solely to provide the matching fixtures and viewport wrappers. A blob-hash audit checked all 1858 base frontend source files; those story overlays were the only differences.
- Results table captures wait for loaded mock response rows. The collapsed mobile screenshot is after-only because Settings had no collapse control before this change.

## Pairs

1. Settings desktop.
2. Results desktop, unlocked responses table.
3. Settings mobile, expanded.
4. Results desktop, locked.
5. Create desktop.

Each pair uses the same numbered prefix with `before.png` and `after.png`. Image 06 shows Settings mobile collapsed after the change.
