# bsh-next-persona

Install a **BSH customer persona** (e.g. Jonas) into **Claude Code** — an AI
customer grounded live in real NEXT AI customer feedback, callable via `/jonas`
or `@jonas`.

You need an **install code** from a BSH super-admin.

```bash
# Install (requires Claude Code — the `claude` CLI — on your PATH):
npx github:rickvdw1/bsh-next-persona install jonas-<code>

# Remove:
npx github:rickvdw1/bsh-next-persona uninstall jonas
```

What it does:

- Redeems your one-time code with `persona-mcp.nextapp.space`, which mints a
  **personal, revocable** access token.
- Registers a per-user MCP server (with your token) via `claude mcp add-json`.
- Writes `~/.claude/agents/<slug>.md` and `~/.claude/commands/<slug>.md`.

The NEXT AI credentials never touch your machine — only a token an admin can
revoke at any time. Every answer is grounded by a **live** tool call; nothing
about the customer data is baked in.
