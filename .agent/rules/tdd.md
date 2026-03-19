# TDD Policy & Testing Rules

As an AI coding assistant for this project, you MUST adhere to the following rules regarding testing and development:

## Core Philosophy: TDD (Test-Driven Development)

1. **Test First**: Before implementing any new feature or fixing a bug, write a failing test that defines the expected behavior.
2. **Red-Green-Refactor**: 
   - **Red**: Write a test and see it fail.
   - **Green**: Write the minimum amount of code to make the test pass.
   - **Refactor**: Clean up the code while ensuring tests remain green.

## Mandatory Testing Rules

- **Every feature needs tests**: No new functionality should be merged without corresponding tests.
- **Bug Fixes**: Every bug fix must include a regression test that would have caught the bug.
- **Backend**: Use `pytest` for all backend Python code. Organize tests in the `tests/` directory.
- **Frontend**: (To be defined, but prioritize testing for logic/components).
- **Mocks**: Use mocking for external services (GenAI, Pinecone, etc.) to ensure tests are fast and deterministic.

## Task Workflow

- When starting a task, always include "Write Tests" in the `task.md`.
- In the `implementation_plan.md`, explicitly list the files being tested and the test cases.
- Verification MUST include running the test suite.
