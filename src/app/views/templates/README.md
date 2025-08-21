# Email Templates

We currently have a **mix of legacy HTML (used for EJS renders)** and **React Email components**.

## Migration Guidelines

When modifying or creating templates:

- ✅ Migrate HTML/EJS templates to **React Email** components
- ✅ Add **Chromatic Storybook tests** to catch visual regressions

## Goal

Over time, all templates should be standardized on **React Email + Chromatic** for consistency, maintainability, and reliability.
