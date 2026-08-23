# Agent Execution & Autonomy Rules

- **Direct Execution / Full Autonomy**: Always proceed directly with actions. Do not stop to ask for confirmation or approval before editing files, creating files, or running terminal commands.
- **Skip Plan Approval**: Implement solutions immediately without blocking on plan approval unless explicitly requested by the user.
- **Full Tooling Access**: Use terminal commands (`npm run ...`, `npx ...`, `git ...`), file operations, and subagents with full autonomy to complete tasks end-to-end.
- **Follow Project Standards**: Ensure all four Definition of Done checks pass before completing tasks: `npm run lint && npm run typecheck && npm test && npm run build`.
