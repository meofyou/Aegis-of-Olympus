# Collaboration Guide

This document defines how we work together on the **Aegis of Olympus** project.

## Branch Strategy

- Keep `main` always deployable.
- Create feature branches with clear names: `feature/<topic>`, `fix/<topic>`, `chore/<topic>`.
- Rebase or merge `main` frequently to avoid large conflicts.

## Commit Rules

- Write small, focused commits.
- Use clear commit messages in imperative style.
  - Example: `Add player movement input handling`
- Do not commit temporary files, secrets, or local environment settings.

## Pull Request Checklist

- Explain what changed and why.
- Link related issue/ticket when available.
- Include test notes (what was tested, how).
- Request at least one review before merge.

## Communication

- Share blockers early.
- Use issues/discussions for decisions that affect architecture or gameplay.
- Keep feedback specific, respectful, and action-oriented.

## Definition of Done

- Feature works as expected.
- No critical warnings/errors in local run.
- Relevant docs are updated.
- Code is reviewed and merged into `main`.
