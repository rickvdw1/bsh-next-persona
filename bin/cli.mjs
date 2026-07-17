#!/usr/bin/env node
/**
 * mcp-next-persona — install a BSH customer persona into Claude Code.
 *
 *   npx github:rickvdw1/mcp-next-persona install <persona>-<code>
 *   npx github:rickvdw1/mcp-next-persona uninstall <persona>
 *
 * `install` redeems the one-time code with the BSH persona service, then:
 *   - registers a per-user MCP server pointing at the service (with your token),
 *   - writes ~/.claude/agents/<slug>.md and ~/.claude/commands/<slug>.md.
 * The NEXT token never touches your machine — only a revocable install token.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

const SERVICE =
  process.env.BSH_PERSONA_MCP_URL?.replace(/\/$/, "") ||
  "https://persona-mcp.nextapp.space";
const CLAUDE_DIR = join(homedir(), ".claude");

const [, , cmd, arg] = process.argv;

try {
  if (cmd === "install") await install(arg);
  else if (cmd === "uninstall") uninstall(arg);
  else usage();
} catch (err) {
  console.error(`\n✖ ${err?.message || err}`);
  process.exit(1);
}

function usage() {
  console.log(`BSH persona installer

  npx github:rickvdw1/mcp-next-persona install <persona>-<code>     e.g. install <persona>-A1B2C3
  npx github:rickvdw1/mcp-next-persona uninstall <persona>          e.g. uninstall <persona>

Requires Claude Code (the \`claude\` CLI) to be installed.`);
  process.exit(cmd ? 1 : 0);
}

async function install(input) {
  if (!input) throw new Error("Provide an install code, e.g. `install <persona>-A1B2C3`.");
  process.stdout.write("→ Redeeming your install code… ");
  const res = await fetch(`${SERVICE}/api/install/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: input.trim() }),
  });
  if (!res.ok) {
    let msg = `The service returned ${res.status}.`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  console.log("done.");

  const { persona, installToken, mcpUrl, mcpServerName, files } = data;

  // 1. Register the MCP server (user scope) via the Claude Code CLI.
  process.stdout.write(`→ Registering MCP server "${mcpServerName}"… `);
  const mcpJson = JSON.stringify({
    type: "http",
    url: mcpUrl,
    headers: { Authorization: `Bearer ${installToken}` },
  });
  ensureClaudeCli();
  // Replace any prior registration so re-installs are idempotent.
  try {
    execFileSync("claude", ["mcp", "remove", mcpServerName, "--scope", "user"], {
      stdio: "ignore",
    });
  } catch {}
  execFileSync("claude", ["mcp", "add-json", mcpServerName, mcpJson, "--scope", "user"], {
    stdio: "ignore",
  });
  console.log("done.");

  // 2. Write the persona subagent + slash command.
  writeFileUnder(files.agentPath, files.agentContent);
  writeFileUnder(files.commandPath, files.commandContent);

  console.log(`\n✓ Installed ${persona.name} (${persona.role}).`);
  console.log(`\nOpen Claude Code and talk to them:`);
  console.log(`  • /${persona.slug} <your question>`);
  console.log(`  • or @${persona.slug} in a message`);
  console.log(
    `\nRemove later with:  npx github:rickvdw1/mcp-next-persona uninstall ${persona.slug}`,
  );
}

function uninstall(slug) {
  if (!slug) throw new Error("Provide the persona slug, e.g. `uninstall <persona>`.");
  const server = `bsh-${slug}`;
  ensureClaudeCli();
  try {
    execFileSync("claude", ["mcp", "remove", server, "--scope", "user"], { stdio: "ignore" });
  } catch {}
  for (const rel of [`agents/${slug}.md`, `commands/${slug}.md`]) {
    const p = join(CLAUDE_DIR, rel);
    if (existsSync(p)) rmSync(p);
  }
  console.log(`✓ Uninstalled ${slug} from Claude Code.`);
  console.log(`(Your access token stays valid until a BSH admin revokes it.)`);
}

function ensureClaudeCli() {
  try {
    execFileSync("claude", ["--version"], { stdio: "ignore" });
  } catch {
    throw new Error(
      "Claude Code (the `claude` CLI) wasn't found on your PATH. Install it first: https://docs.claude.com/claude-code",
    );
  }
}

function writeFileUnder(relPath, content) {
  const full = join(CLAUDE_DIR, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, "utf8");
  console.log(`→ Wrote ~/.claude/${relPath}`);
}
