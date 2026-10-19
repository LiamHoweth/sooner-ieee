---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Read the pinned guidelines in `references/guidelines.md` (in this skill's folder)
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

`references/guidelines.md` is a local snapshot of
`https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
taken 2026-10-19. Use the local copy so the rules cannot change underneath a review. Only
re-fetch upstream when the user asks to refresh the guidelines, and show the diff before
replacing the snapshot.

## Usage

When a user provides a file or pattern argument:
1. Read `references/guidelines.md`
2. Read the specified files
3. Apply all rules from the guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.
