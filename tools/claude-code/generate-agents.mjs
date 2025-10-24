#!/usr/bin/env node

/**
 * CLI Tool: Generate Claude Code Agents from BMAD Agent Definitions
 *
 * Usage:
 *   node tools/claude-code/generate-agents.js
 *   npm run generate:agents
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';
import { AgentRegistry } from '../../src/core/claude-code/agent-registry.mjs';
import { AgentPromptGenerator } from '../../src/core/claude-code/generators/agent-prompt-generator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

async function main() {
  console.log(chalk.bold.cyan('\n🤖 BMAD Agent Generator for Claude Code\n'));

  // Step 1: Initialize Registry
  let spinner = ora('Initializing agent registry...').start();
  const registry = new AgentRegistry(PROJECT_ROOT);

  try {
    await registry.loadAllAgents();
    spinner.succeed(`Loaded ${registry.agents.size} agents`);
  } catch (error) {
    spinner.fail('Failed to load agents');
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // Step 2: Display discovered agents
  console.log(chalk.bold('\n📋 Discovered Agents:\n'));

  const agentsByModule = {};

  for (const agent of registry.getAllAgents()) {
    const module = agent.definition.metadata.module || 'core';

    if (!agentsByModule[module]) {
      agentsByModule[module] = [];
    }

    agentsByModule[module].push({
      id: registry.getAgentId(agent),
      name: agent.definition.metadata.name,
      title: agent.definition.metadata.title,
      icon: agent.definition.metadata.icon
    });
  }

  for (const [module, agents] of Object.entries(agentsByModule)) {
    console.log(chalk.bold(`  ${module.toUpperCase()}:`));
    agents.forEach(agent => {
      console.log(`    ${agent.icon} ${chalk.cyan(agent.id)} - ${agent.title} (${agent.name})`);
    });
    console.log('');
  }

  // Step 3: Generate Agent Prompts
  console.log(chalk.bold('📝 Generating Agent Prompts:\n'));

  const outputDir = path.join(PROJECT_ROOT, '.claude/agents');
  await fs.ensureDir(outputDir);

  const generator = new AgentPromptGenerator(registry);

  spinner = ora('Generating agent prompts...').start();

  try {
    const results = await generator.generateAll(outputDir);
    spinner.succeed(`Generated ${results.length} agent prompts`);

    console.log('');
    results.forEach(result => {
      const relativePath = path.relative(PROJECT_ROOT, result.outputPath);
      console.log(`  ✓ ${result.agentId} → ${chalk.gray(relativePath)}`);
    });
  } catch (error) {
    spinner.fail('Failed to generate agent prompts');
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // Step 4: Update .claude/settings.json
  console.log(chalk.bold('\n⚙️  Updating Claude Code Settings:\n'));

  spinner = ora('Updating .claude/settings.json...').start();

  try {
    await updateClaudeSettings(registry, PROJECT_ROOT);
    spinner.succeed('Updated .claude/settings.json');
  } catch (error) {
    spinner.fail('Failed to update settings');
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // Step 5: Generate Registry Export
  console.log(chalk.bold('\n📊 Generating Registry Export:\n'));

  const registryExport = registry.exportRegistry();
  const exportPath = path.join(PROJECT_ROOT, '.claude/agent-registry.json');

  await fs.writeJSON(exportPath, registryExport, { spaces: 2 });
  console.log(`  ✓ Exported registry → ${chalk.gray(path.relative(PROJECT_ROOT, exportPath))}`);

  // Success!
  console.log(chalk.bold.green('\n✨ Agent generation complete!\n'));

  console.log(chalk.bold('Next Steps:\n'));
  console.log(`  1. Review generated agents in ${chalk.cyan('.claude/agents/')}`);
  console.log(`  2. Check updated settings in ${chalk.cyan('.claude/settings.json')}`);
  console.log(`  3. Use agents in Claude Code with the ${chalk.cyan('Task')} tool`);
  console.log('');

  // Display example usage
  console.log(chalk.bold('Example Usage:\n'));
  console.log(chalk.gray('  // Invoke the PM agent'));
  console.log(chalk.cyan('  Task(bmad-bmm-john, "Create PRD for new feature", {...})'));
  console.log('');
  console.log(chalk.gray('  // Invoke the Dev agent'));
  console.log(chalk.cyan('  Task(bmad-bmm-amelia, "Implement story STORY-123", {...})'));
  console.log('');
}

/**
 * Update .claude/settings.json with agent definitions
 */
async function updateClaudeSettings(registry, projectRoot) {
  const settingsPath = path.join(projectRoot, '.claude/settings.json');

  // Read existing settings or create new
  let settings = {};

  if (await fs.pathExists(settingsPath)) {
    settings = await fs.readJSON(settingsPath);
  }

  // Ensure agentMode is on
  settings.agentMode = 'on';

  // Ensure bmad config exists
  if (!settings.bmad) {
    settings.bmad = {};
  }

  settings.bmad.enabled = true;
  settings.bmad.agentRegistry = '.claude/agent-registry.json';
  settings.bmad.generatedAt = new Date().toISOString();

  // Build agents configuration
  settings.agents = settings.agents || {};

  // Add Explore and general-purpose agents (keep existing ones)
  if (!settings.agents.Explore) {
    settings.agents.Explore = {
      enabled: true,
      description: 'Fast agent specialized for exploring codebases'
    };
  }

  if (!settings.agents['general-purpose']) {
    settings.agents['general-purpose'] = {
      enabled: true,
      description: 'General-purpose agent for complex tasks'
    };
  }

  // Add BMAD agents
  for (const agent of registry.getAllAgents()) {
    const agentId = registry.getAgentId(agent);
    const description = registry.getAgentDescription(agent);

    settings.agents[agentId] = {
      enabled: true,
      description,
      module: agent.definition.metadata.module || 'core',
      role: agent.definition.persona.role
    };
  }

  // Write updated settings
  await fs.writeJSON(settingsPath, settings, { spaces: 2 });

  return settings;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('\n❌ Error:'), error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

export { main as generateAgents };
