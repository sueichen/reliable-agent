#!/usr/bin/env bash
# SessionStart hook for reliable-agent plugin
# Injects the using-reliable-agent meta-skill into every session.
#
# Platform detection follows the superpowers-zh pattern:
# - Cursor:     CURSOR_PLUGIN_ROOT → additional_context (snake_case)
# - Claude Code: CLAUDE_PLUGIN_ROOT without COPILOT_CLI → hookSpecificOutput.additionalContext
# - Copilot CLI / unknown: additionalContext (SDK standard)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ---- JSON escape function (bash parameter substitution, same as superpowers-zh) ----
escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

# ---- Read the using-reliable-agent meta-skill ----
using_skill_content=$(cat "${PLUGIN_ROOT}/skills/using-reliable-agent/SKILL.md" 2>&1 || echo "Error reading using-reliable-agent skill")

using_skill_escaped=$(escape_for_json "$using_skill_content")

# ---- Build session context ----
session_context="<EXTREMELY-IMPORTANT>
You have reliable-agent installed. This plugin provides 11 phase-gated engineering workflow skills for reliable code engineering.

**Below is the full content of your 'reliable-agent:using-reliable-agent' skill — your introduction to using these skills. For all other skills, use the 'Skill' tool:**

${using_skill_escaped}

<IMPORTANT>
When a project contains a CLAUDE.md file, read it first before any implementation work — it defines the project's constitution, code standards, and boundaries.

When a project contains a .reliable-agent/experiences.md file, read it when debugging, reviewing, or before making changes in areas with recorded experiences — it contains structured knowledge of past error patterns, optimization discoveries, and recurring review issues.
</IMPORTANT>
</EXTREMELY-IMPORTANT>"

# ---- Output platform-specific JSON ----
# Uses printf instead of heredoc to work around bash 5.3+ heredoc hang.
# See: https://github.com/obra/superpowers/issues/571

if [ -n "${CURSOR_PLUGIN_ROOT:-}" ]; then
  # Cursor sets CURSOR_PLUGIN_ROOT (may also set CLAUDE_PLUGIN_ROOT)
  printf '{\n  "additional_context": "%s"\n}\n' "$session_context"
elif [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -z "${COPILOT_CLI:-}" ]; then
  # Claude Code sets CLAUDE_PLUGIN_ROOT without COPILOT_CLI
  printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$session_context"
else
  # Copilot CLI (sets COPILOT_CLI=1) or unknown platform — SDK standard format
  printf '{\n  "additionalContext": "%s"\n}\n' "$session_context"
fi

exit 0
