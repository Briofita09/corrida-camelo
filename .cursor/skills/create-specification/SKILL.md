# Create Feature Specification

## Purpose

Create a complete, unambiguous, implementation-independent specification for a feature.

This skill transforms a **Product Story created by the Product team** into a structured feature specification.

Its responsibility is to define:

- what must be built;
- why it must be built;
- who is affected;
- expected behavior;
- business rules;
- functional requirements;
- non-functional requirements when applicable;
- scope and boundaries;
- acceptance criteria;
- relevant dependencies and constraints.

The skill must not define how the feature will be technically implemented.

---

# Mandatory Project Context

Before performing any specification analysis, the skill MUST verify that a root `AGENTS.md` exists in the project.

`AGENTS.md` is a mandatory prerequisite for this skill.

The skill MUST NOT generate any specification artifact if `AGENTS.md` does not exist.

---

## AGENTS.md Gate

The first step of execution must be:

1. Locate the project's root `AGENTS.md`.
2. Verify that the file exists.
3. Read its complete contents.
4. Use its information as project-wide context for the specification process.

If `AGENTS.md` does not exist:

1. STOP execution immediately.
2. Do not create `spec.md`.
3. Do not create the Specification Plan.
4. Do not create any other specification artifact.
5. Inform the developer that `AGENTS.md` is required.
6. Instruct the developer to initialize the project context before running this skill again.

The skill MUST NOT:

- create `AGENTS.md` itself;
- infer the missing `AGENTS.md` content;
- continue using only the Product Story;
- generate a partial specification;
- bypass this requirement.

The `AGENTS.md` file must be created by the independent project-context skill.

---

# Output Language

The generated `spec.md` and the completion report must be written in **Brazilian Portuguese (pt-BR)** by default.

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

If the developer explicitly requests another language, use the requested language instead.

---

# Scope

This skill is responsible exclusively for the specification stage.

It must not:

- define technical architecture;
- choose frameworks or libraries;
- define implementation details;
- create implementation tasks;
- write production code;
- write automated tests;
- create the BDD artifact;
- create Gherkin scenarios as the final BDD artifact;
- create the technical implementation plan;
- modify application source code.

## Required Execution Order

The execution order is mandatory:

```text
Verify AGENTS.md
        ↓
Read AGENTS.md
        ↓
Receive Product Story
        ↓
Analyze Product Story
        ↓
Input Completeness Gate
        ↓
Ask developer if necessary
        ↓
Reassess completeness
        ↓
Generate spec.md