#!/usr/bin/env node
/**
 * Validate that all SKILL.md files have valid YAML frontmatter
 * with required name and description fields.
 *
 * Usage: node scripts/validate-skills.js
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = resolve(__dirname, '../skills');
const AGENTS_DIR = resolve(__dirname, '../agents');

function findSkillFiles(dir) {
    const results = [];
    try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
            const fullPath = join(dir, entry);
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
                results.push(...findSkillFiles(fullPath));
            } else if (entry === 'SKILL.md') {
                results.push(fullPath);
            }
        }
    } catch (e) {
        // Directory doesn't exist yet
    }
    return results;
}

function findAgentFiles(dir) {
    const results = [];
    try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
            const fullPath = join(dir, entry);
            if (entry.endsWith('.md') && statSync(fullPath).isFile()) {
                results.push(fullPath);
            }
        }
    } catch (e) {
        // Directory doesn't exist yet
    }
    return results;
}

function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = {};
    const lines = match[1].split('\n');
    for (const line of lines) {
        const kv = line.match(/^(\w[\w-]*):\s*(.+)$/);
        if (kv) {
            frontmatter[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
        }
    }
    return frontmatter;
}

let errors = 0;
let warnings = 0;

console.log('=== Reliable-Agent Skills Validator ===\n');

// Validate skills
const skillFiles = findSkillFiles(SKILLS_DIR);
console.log(`Found ${skillFiles.length} skill files`);

for (const file of skillFiles) {
    const content = readFileSync(file, 'utf-8');
    const relative = file.replace(SKILLS_DIR + '/', '');

    const fm = parseFrontmatter(content);
    if (!fm) {
        console.error(`  ERROR: ${relative} — no valid YAML frontmatter`);
        errors++;
        continue;
    }

    if (!fm.name) {
        console.error(`  ERROR: ${relative} — missing 'name' in frontmatter`);
        errors++;
    }

    if (!fm.description) {
        console.error(`  ERROR: ${relative} — missing 'description' in frontmatter`);
        errors++;
    }

    // Check for required skill sections
    for (const section of ['Overview', 'Core Process', 'Verification']) {
        if (!content.includes('## ' + section)) {
            console.warn(`  WARN: ${relative} — missing '## ${section}' section`);
            warnings++;
        }
    }

    // Check for rationalizations table
    if (!content.includes('## Common Rationalizations')) {
        console.warn(`  WARN: ${relative} — missing '## Common Rationalizations' section`);
        warnings++;
    }

    // Check rigid/flexible type label consistency (skip meta-skill)
    if (fm.name !== 'using-reliable-agent') {
        const isRigid = content.includes('**刚性技能**');
        const isFlexible = content.includes('**灵活技能**');
        const hasHardGate = content.includes('<HARD-GATE>');

        if (!isRigid && !isFlexible) {
            console.warn(`  WARN: ${relative} — missing rigid/flexible type label (**刚性技能** or **灵活技能**)`);
            warnings++;
        } else if (isRigid && !hasHardGate) {
            console.error(`  ERROR: ${relative} — declared as **刚性技能** but missing <HARD-GATE> block`);
            errors++;
        }
    }

    // Check for next steps guidance (skip using-reliable-agent meta-skill)
    if (fm.name !== 'using-reliable-agent' && !content.includes('## 下一步指引')) {
        console.warn(`  WARN: ${relative} — missing '## 下一步指引' section`);
        warnings++;
    }

    console.log(`  OK: ${relative} (${fm.name})`);
}

// Validate agents
const agentFiles = findAgentFiles(AGENTS_DIR);
console.log(`\nFound ${agentFiles.length} agent files`);

for (const file of agentFiles) {
    const content = readFileSync(file, 'utf-8');
    const relative = file.replace(AGENTS_DIR + '/', '');

    const fm = parseFrontmatter(content);
    if (!fm) {
        console.error(`  ERROR: ${relative} — no valid YAML frontmatter`);
        errors++;
        continue;
    }

    if (!fm.name) {
        console.error(`  ERROR: ${relative} — missing 'name' in frontmatter`);
        errors++;
    }

    if (!fm.description) {
        console.error(`  ERROR: ${relative} — missing 'description' in frontmatter`);
        errors++;
    }

    // Check Composition section (agent isolation rule — 角色隔离铁律)
    if (!content.includes('Do not invoke from another persona') && !content.includes('绝不要从另一个角色内部调用')) {
        console.error(`  ERROR: ${relative} — missing agent isolation rule (角色隔离铁律, CLAUDE.md Section 5.2)`);
        errors++;
    }

    console.log(`  OK: ${relative} (${fm.name})`);
}

// Validate infrastructure files
console.log('\n--- Infrastructure Files ---');

const ROOT_DIR = resolve(__dirname, '..');
const EXPECTED_COMMANDS = 12;
const COMMAND_NAMES = [
    'ra-spec', 'ra-plan', 'ra-auto', 'ra-build', 'ra-verify',
    'ra-log', 'ra-request-review', 'ra-receive-review',
    'ra-update-doc', 'ra-ship', 'ra-evolve', 'ra-perf'
];

// Shared TOML validation for both .gemini/commands/ and commands/
function validateTomlCommands(dir, label) {
    try {
        const files = readdirSync(dir).filter(f => f.endsWith('.toml'));
        console.log(`  ${label}: ${files.length} .toml files`);
        if (files.length !== EXPECTED_COMMANDS) {
            console.error(`  ERROR: ${label} — expected ${EXPECTED_COMMANDS} .toml files, found ${files.length}`);
            errors++;
        }
        // Check each expected command exists
        const fileNames = new Set(files.map(f => f.replace('.toml', '')));
        for (const name of COMMAND_NAMES) {
            if (!fileNames.has(name)) {
                console.error(`  ERROR: ${label} — missing ${name}.toml`);
                errors++;
            }
        }
        // Check TOML structure with non-empty prompt
        for (const f of files) {
            const content = readFileSync(join(dir, f), 'utf-8');
            if (!content.includes('description =')) {
                console.error(`  ERROR: ${label}/${f} — missing 'description' field`);
                errors++;
            }
            const promptMatch = content.match(/prompt\s*=\s*"""([\s\S]*?)"""/);
            if (!promptMatch) {
                console.error(`  ERROR: ${label}/${f} — missing or malformed 'prompt = \"\"\"...\"\"\"' field`);
                errors++;
            } else if (promptMatch[1].trim().length === 0) {
                console.error(`  ERROR: ${label}/${f} — empty prompt body`);
                errors++;
            }
        }
        return files;
    } catch (e) {
        console.error(`  ERROR: ${label} not found`);
        errors++;
        return [];
    }
}

// Check .claude/commands/ .md files with frontmatter validation
const claudeCommandsDir = join(ROOT_DIR, '.claude', 'commands');
try {
    const claudeFiles = readdirSync(claudeCommandsDir).filter(f => f.endsWith('.md'));
    console.log(`  .claude/commands/: ${claudeFiles.length} .md files`);
    if (claudeFiles.length !== EXPECTED_COMMANDS) {
        console.error(`  ERROR: expected ${EXPECTED_COMMANDS} .md files, found ${claudeFiles.length}`);
        errors++;
    }
    // Check each expected command exists
    const claudeNames = new Set(claudeFiles.map(f => f.replace('.md', '')));
    for (const name of COMMAND_NAMES) {
        if (!claudeNames.has(name)) {
            console.error(`  ERROR: .claude/commands/ — missing ${name}.md`);
            errors++;
        }
    }
    // Validate frontmatter in each .md
    for (const f of claudeFiles) {
        const content = readFileSync(join(claudeCommandsDir, f), 'utf-8');
        const fm = parseFrontmatter(content);
        if (!fm) {
            console.error(`  ERROR: .claude/commands/${f} — missing or invalid YAML frontmatter`);
            errors++;
        } else if (!fm.description) {
            console.error(`  ERROR: .claude/commands/${f} — missing 'description' in frontmatter`);
            errors++;
        }
        if (!content.includes('Invoke the ra-')) {
            console.warn(`  WARN: .claude/commands/${f} — missing 'Invoke the ra-' directive`);
            warnings++;
        }
    }
} catch (e) {
    if (e.code === 'ENOENT') {
        console.log(`  .claude/commands/: not present (optional)`);
    } else {
        console.error(`  ERROR: .claude/commands/ — ${e.message}`);
        errors++;
    }
}

// Check .gemini/commands/ .toml files (shared validation)
validateTomlCommands(join(ROOT_DIR, '.gemini', 'commands'), '.gemini/commands/');

// Check commands/ .toml files (Antigravity — shared validation)
validateTomlCommands(join(ROOT_DIR, 'commands'), 'commands/');

// Check plugin.json (root — Antigravity) with content validation
if (!existsSync(join(ROOT_DIR, 'plugin.json'))) {
    console.error('  ERROR: plugin.json (root) not found');
    errors++;
} else {
    try {
        const rootPlugin = JSON.parse(readFileSync(join(ROOT_DIR, 'plugin.json'), 'utf-8'));
        if (!rootPlugin.name || !rootPlugin.version || !rootPlugin.description) {
            console.error('  ERROR: plugin.json (root) — missing required fields (name, version, description)');
            errors++;
        }
        if (!rootPlugin.skills || !rootPlugin.commands) {
            console.error('  ERROR: plugin.json (root) — missing skills or commands field');
            errors++;
        }
        console.log('  plugin.json: OK');
    } catch (e) {
        console.error(`  ERROR: plugin.json (root) — invalid JSON: ${e.message}`);
        errors++;
    }
}

// Check .claude-plugin/marketplace.json
if (!existsSync(join(ROOT_DIR, '.claude-plugin', 'marketplace.json'))) {
    console.error('  ERROR: .claude-plugin/marketplace.json not found');
    errors++;
} else {
    try {
        JSON.parse(readFileSync(join(ROOT_DIR, '.claude-plugin', 'marketplace.json'), 'utf-8'));
        console.log('  .claude-plugin/marketplace.json: OK');
    } catch (e) {
        console.error(`  ERROR: .claude-plugin/marketplace.json — invalid JSON: ${e.message}`);
        errors++;
    }
}

// Check .claude-plugin/plugin.json agents field with path resolvability
try {
    const cpPlugin = JSON.parse(readFileSync(join(ROOT_DIR, '.claude-plugin', 'plugin.json'), 'utf-8'));
    if (!cpPlugin.agents || !Array.isArray(cpPlugin.agents) || cpPlugin.agents.length < 5) {
        console.error('  ERROR: .claude-plugin/plugin.json — missing or insufficient agents array');
        errors++;
    } else {
        console.log(`  .claude-plugin/plugin.json agents: ${cpPlugin.agents.length} registered`);
        for (const agentPath of cpPlugin.agents) {
            const resolved = resolve(ROOT_DIR, agentPath);
            if (!existsSync(resolved)) {
                console.error(`  ERROR: .claude-plugin/plugin.json — agent path '${agentPath}' does not exist`);
                errors++;
            }
        }
    }
} catch (e) {
    console.error(`  ERROR: .claude-plugin/plugin.json — invalid: ${e.message}`);
    errors++;
}

// Check AGENTS.md — all 11 skills referenced
if (!existsSync(join(ROOT_DIR, 'AGENTS.md'))) {
    console.error('  ERROR: AGENTS.md not found');
    errors++;
} else {
    const agentsContent = readFileSync(join(ROOT_DIR, 'AGENTS.md'), 'utf-8');
    let allFound = true;
    for (const name of COMMAND_NAMES) {
        if (!agentsContent.includes(name)) {
            console.error(`  ERROR: AGENTS.md — missing reference to '${name}'`);
            errors++;
            allFound = false;
        }
    }
    if (allFound) console.log('  AGENTS.md: OK (all 12 skills referenced)');
}

// Check GEMINI.md + gemini-extension.json
if (!existsSync(join(ROOT_DIR, 'GEMINI.md'))) {
    console.error('  ERROR: GEMINI.md not found');
    errors++;
} else {
    const geminiMd = readFileSync(join(ROOT_DIR, 'GEMINI.md'), 'utf-8');
    if (!geminiMd.includes('using-reliable-agent')) {
        console.error('  ERROR: GEMINI.md — missing using-reliable-agent reference');
        errors++;
    } else {
        console.log('  GEMINI.md: OK');
    }
}
if (!existsSync(join(ROOT_DIR, 'gemini-extension.json'))) {
    console.error('  ERROR: gemini-extension.json not found');
    errors++;
} else {
    try {
        const geminiExt = JSON.parse(readFileSync(join(ROOT_DIR, 'gemini-extension.json'), 'utf-8'));
        if (!geminiExt.contextFileName || typeof geminiExt.contextFileName !== 'string') {
            console.error('  ERROR: gemini-extension.json — missing or invalid contextFileName');
            errors++;
        } else {
            console.log('  gemini-extension.json: OK');
        }
    } catch (e) {
        console.error(`  ERROR: gemini-extension.json — invalid JSON: ${e.message}`);
        errors++;
    }
}

// Check .codex-plugin/plugin.json
if (!existsSync(join(ROOT_DIR, '.codex-plugin', 'plugin.json'))) {
    console.error('  ERROR: .codex-plugin/plugin.json not found');
    errors++;
} else {
    try {
        JSON.parse(readFileSync(join(ROOT_DIR, '.codex-plugin', 'plugin.json'), 'utf-8'));
        console.log('  .codex-plugin/plugin.json: OK');
    } catch (e) {
        console.error(`  ERROR: .codex-plugin/plugin.json — invalid JSON`);
        errors++;
    }
}

// Check .cursor-plugin/plugin.json
if (!existsSync(join(ROOT_DIR, '.cursor-plugin', 'plugin.json'))) {
    console.error('  ERROR: .cursor-plugin/plugin.json not found');
    errors++;
} else {
    try {
        JSON.parse(readFileSync(join(ROOT_DIR, '.cursor-plugin', 'plugin.json'), 'utf-8'));
        console.log('  .cursor-plugin/plugin.json: OK');
    } catch (e) {
        console.error(`  ERROR: .cursor-plugin/plugin.json — invalid JSON`);
        errors++;
    }
}

// Summary
console.log(`\n=== Results ===`);
console.log(`Skills: ${skillFiles.length} files checked`);
console.log(`Agents: ${agentFiles.length} files checked`);
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors > 0) {
    console.log('\n❌ Validation FAILED — fix the errors above.');
    process.exit(1);
} else if (warnings > 0) {
    console.log('\n⚠️  Validation PASSED with warnings — review the warnings above.');
    process.exit(0);
} else {
    console.log('\n✅ All checks passed.');
    process.exit(0);
}
