# Commit Style

This project practices **review-by-commit**. A reviewer should be able to read the diff one commit at a time, in order, and follow a logical narrative — each commit a single defensible step.

Implementation skills (`tdd` and any successor impl loops) follow this convention while they work. `prepare-for-review` trusts the commit history as-is when it assembles the PR's Review guide; if commits are wide or out of order, the Review guide will reflect that. There is no automated gate — commit discipline is enforced by convention here, not by tooling.

## What a good commit looks like

- **One logical change.** Refactor, new behavior, schema change, test addition — each its own commit. Don't bundle.
- **Scoped to one concern.** If the commit description needs the word "and", it should probably be two commits.
- **Tests live with the code they cover.** A new behavior + its tests = one commit. A pure test addition for existing behavior = a separate commit.
- **Refactors are pure.** Renames, moves, extractions that change no behavior travel alone, so a reviewer can skim them and focus elsewhere.
- **Commit message describes the *why*, not the *what*.** The diff already shows the what. A reader six months from now needs the motivation.

## Message format

This project mandates Conventional Commits. Subject line under ~70 characters, imperative mood, body wrapped at ~72. Reference an issue if one exists.

## When commits go wide

Sometimes a single change is genuinely large and cannot be sliced (a generated file, a sweeping rename, a vendor drop). Land it as one commit and put the reason in the message body — reviewers can then skim past it confidently. Don't synthesise fake boundaries.
