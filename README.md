# mcp-next-persona

Install a **NEXT-native customer persona** into **Claude Code** — an AI customer
grounded live in real NEXT AI customer feedback, callable via `/<persona>`
or `@<persona>`.

You need an **install code** from a BSH super-admin. The code names which
persona you're installing (`<persona>-<code>`).

```bash
# Install (requires Claude Code — the `claude` CLI — on your PATH):
npx github:rickvdw1/mcp-next-persona install <persona>-<code>

# Remove:
npx github:rickvdw1/mcp-next-persona uninstall <persona>
```

What it does:

- Redeems your one-time code with `persona-mcp.nextapp.space`, which mints a
  **personal, revocable** access token.
- Registers a per-user MCP server (with your token) via `claude mcp add-json`.
- Writes `~/.claude/agents/<persona>.md` and `~/.claude/commands/<persona>.md`.

The NEXT AI credentials never touch your machine — only a token an admin can
revoke at any time. Every answer is grounded by a **live** tool call; nothing
about the customer data is baked in.
