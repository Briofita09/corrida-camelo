# # Initialize Project Context

## Purpose

Initialize or update the project's root `AGENTS.md`.

This skill is completely independent of SDD, BDD, TDD, Cursor, Claude Code, GitHub Copilot, Codex, or any other specific development methodology or AI agent.

Its purpose is to create a reliable, agent-agnostic project context document that allows any AI coding agent to understand and continue working on the repository.

---

## Output Language

The generated `AGENTS.md` must be written in **Brazilian Portuguese (pt-BR)** by default.

Technical identifiers must remain unchanged when they are project identifiers, such as:

- filenames;

- directory names;

- class/function/component names;

- commands;

- environment variable names;

- package names;

- API routes;

- technology names.

Code blocks must preserve the syntax and exact technical content required by the project.

If the user explicitly requests another language, use the requested language instead.

---

## Scope

This skill is responsible only for project context.

It may document:

- project purpose;

- goals and non-goals;

- technology stack;

- architecture;

- project structure;

- development conventions;

- testing strategy;

- infrastructure;

- external services;

- security requirements;

- environment and configuration;

- verified development commands;

- stable project-wide constraints;

- general instructions for AI coding agents.

It must not define or implement SDD.

It must not create SDD artifacts.

It must not require the project to use SDD.

If the project already uses SDD, the skill may document that fact at a high level, but the detailed SDD process belongs to separate project documentation.

---

# Core Principles

## 1. The Repository Is the Source of Truth

Use available project evidence before asking the user for information.

Relevant sources include:

1. Explicit user-provided information.

2. Existing `AGENTS.md`.

3. README and project documentation.

4. Package/dependency manifests.

5. Lockfiles.

6. Source code.

7. Tests and test configuration.

8. Build configuration.

9. Linting and formatting configuration.

10. CI/CD configuration.

11. Infrastructure configuration.

12. Scripts and project metadata.

---

## 2. Never Invent Project Facts

Do not silently invent:

- technologies;

- versions;

- architecture;

- conventions;

- commands;

- business requirements;

- deployment processes;

- external services;

- environment variables;

- security requirements;

- project constraints.

If a fact cannot be reliably inferred and is important to the project context, ask the user.

---

## 3. Prefer Evidence Over Convention

Do not document what a project "should" use.

Document what the project actually uses.

For example, if the project contains Jest configuration, do not document Vitest because it is preferred by the agent.

Existing project conventions take precedence over personal preferences.

---

## 4. Keep [AGENTS.md](http://AGENTS.md) Focused on Stable Context

`AGENTS.md` should contain project-wide information that is useful across many development tasks.

Do not turn it into:

- a task log;

- a feature specification;

- a changelog;

- an implementation diary;

- a copy of the README;

- a copy of architectural decision records;

- a detailed coding tutorial.

Feature-specific and historical information belongs in the appropriate project documentation.

---

# Execution Workflow

## Phase 1 — Inspect the Repository

Before generating or modifying `AGENTS.md`, inspect the repository.

Determine:

### Project Identity

Identify:

- project name;

- project purpose;

- primary language(s);

- application type;

- repository type.

### Technology Stack

Inspect relevant manifests and configuration to identify:

- languages;

- frameworks;

- libraries;

- runtimes;

- package managers;

- databases;

- ORMs;

- build tools;

- test tools;

- linters;

- formatters;

- infrastructure;

- deployment tools;

- external services.

Do not assume a particular ecosystem.

Examples of files to inspect when they exist:

- `package.json`

- `pnpm-workspace.yaml`

- `pyproject.toml`

- `requirements.txt`

- `go.mod`

- `Cargo.toml`

- `pom.xml`

- `build.gradle`

- `.csproj`

- `composer.json`

- `Gemfile`

### Project Structure

Identify important:

- source directories;

- test directories;

- application entry points;

- modules;

- shared code;

- scripts;

- infrastructure;

- configuration;

- documentation.

### Testing

Determine the actual testing strategy from:

- test configuration;

- test scripts;

- test directories;

- test files;

- CI configuration;

- coverage configuration.

### Development Commands

Identify verified commands for:

- installation;

- development;

- testing;

- linting;

- formatting;

- building;

- deployment, when applicable.

Only document commands supported by the repository.

### Architecture

Infer architecture from:

- source structure;

- imports/dependencies;

- module boundaries;

- configuration;

- existing documentation;

- established patterns.

Do not describe an architecture that exists only in theory.

### Security and Configuration

Identify relevant:

- environment files;

- environment variable definitions;

- authentication mechanisms;

- authorization mechanisms;

- secret-management conventions;

- security tooling.

Never copy secret values into `AGENTS.md`.

---

# Phase 2 — Inspect Existing [AGENTS.md](http://AGENTS.md)

Check for `AGENTS.md` files relevant to the repository.

At minimum, inspect the root `AGENTS.md` if it exists.

If nested `AGENTS.md` files exist, be aware that they may define more local context. Do not merge local instructions into the root document unless they are genuinely project-wide.

## If Root [AGENTS.md](http://AGENTS.md) Does Not Exist

Create:

```text

[AGENTS.md](http://AGENTS.md)