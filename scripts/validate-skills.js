#!/usr/bin/env node
/**
 * Validate that all SKILL.md files have valid YAML frontmatter
 * with required name and description fields.
 *
 * Usage: node scripts/validate-skills.js
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const SKILLS_DIR = resolve(import.meta.dirname || '.', '../skills');
const AGENTS_DIR = resolve(import.meta.dirname || '.', '../agents');

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

    // Check Composition section (agent isolation rule)
    if (!content.includes('Do not invoke from another persona') && !content.includes('绝不要从另一个角色内部调用')) {
        console.warn(`  WARN: ${relative} — missing agent isolation rule in Composition section`);
        warnings++;
    }

    console.log(`  OK: ${relative} (${fm.name})`);
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
