/**
 * Agent Prompt Generator for Claude Code
 *
 * Generates Claude Code agent prompt files from BMAD agent YAML definitions
 */

import fs from 'fs-extra';
import path from 'path';

export class AgentPromptGenerator {
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Generate a Claude Code agent prompt from a BMAD agent definition
   */
  generatePrompt(agent) {
    const { metadata, persona, critical_actions, menu, prompts } = agent.definition;

    const sections = [];

    // Header with icon and title
    sections.push(`# ${metadata.icon} ${metadata.title}: ${metadata.name}`);
    sections.push('');

    // Role and Identity
    sections.push('## Role');
    sections.push(persona.role);
    sections.push('');

    sections.push('## Identity');
    sections.push(persona.identity);
    sections.push('');

    // Communication Style
    sections.push('## Communication Style');
    sections.push(persona.communication_style);
    sections.push('');

    // Principles
    sections.push('## Principles');
    sections.push('');
    if (Array.isArray(persona.principles)) {
      persona.principles.forEach(principle => {
        sections.push(`- ${principle}`);
      });
    }
    sections.push('');

    // Critical Actions (if any)
    if (critical_actions && critical_actions.length > 0) {
      sections.push('## Critical Actions');
      sections.push('');
      sections.push('**MANDATORY - Execute these actions when initialized:**');
      sections.push('');
      critical_actions.forEach((action, idx) => {
        sections.push(`${idx + 1}. ${action}`);
      });
      sections.push('');
    }

    // Available Workflows
    sections.push('## Available Workflows');
    sections.push('');
    sections.push('You have access to the following workflows:');
    sections.push('');

    if (menu && menu.length > 0) {
      menu.forEach(item => {
        sections.push(`### ${item.trigger}`);
        sections.push(item.description);
        sections.push('');

        // Add workflow path information
        if (item.workflow) {
          sections.push(`**Workflow:** \`${item.workflow}\``);
          sections.push('');
        } else if (item.exec) {
          sections.push(`**Exec:** \`${item.exec}\``);
          sections.push('');
        } else if (item.action) {
          sections.push(`**Action:** ${item.action}`);
          sections.push('');
        }
      });
    }

    // Custom Prompts (if any)
    if (prompts && prompts.length > 0) {
      sections.push('## Custom Prompts');
      sections.push('');
      prompts.forEach(prompt => {
        sections.push(`### ${prompt.id}`);
        sections.push(prompt.description || 'No description');
        sections.push('');
        sections.push('```');
        sections.push(prompt.content);
        sections.push('```');
        sections.push('');
      });
    }

    // Agent Instructions
    sections.push('## Your Mission');
    sections.push('');
    sections.push(`You are the **${metadata.title}** for the BMAD-METHOD framework.`);
    sections.push('');
    sections.push('When invoked by the orchestrator or another agent, you should:');
    sections.push('');
    sections.push('1. **Understand the context** - Review the task, inputs, and any provided context');
    sections.push('2. **Execute your workflow** - Follow the appropriate workflow based on the request');
    sections.push('3. **Follow your principles** - Always adhere to your stated principles and critical actions');
    sections.push('4. **Communicate clearly** - Use your communication style to interact with users and other agents');
    sections.push('5. **Produce results** - Create the expected outputs (documents, code, analysis, etc.)');
    sections.push('6. **Provide handoff info** - When complete, provide clear information for the next agent or step');
    sections.push('');

    // Output Format
    sections.push('## Output Format');
    sections.push('');
    sections.push('When completing your task, structure your output as:');
    sections.push('');
    sections.push('```markdown');
    sections.push('## Task Summary');
    sections.push('[Brief description of what you did]');
    sections.push('');
    sections.push('## Results');
    sections.push('[Main deliverables, files created/modified, decisions made]');
    sections.push('');
    sections.push('## Files Modified');
    sections.push('- path/to/file1.md');
    sections.push('- path/to/file2.yaml');
    sections.push('');
    sections.push('## Next Steps');
    sections.push('[Recommended next actions or which agent should be invoked next]');
    sections.push('');
    sections.push('## Handoff Context');
    sections.push('[Any critical information the next agent needs]');
    sections.push('```');
    sections.push('');

    // Collaboration Notes
    sections.push('## Working with Other Agents');
    sections.push('');
    sections.push('You are part of a multi-agent BMAD team. Common collaboration patterns:');
    sections.push('');
    sections.push('- **Analyst** → gathers requirements and research');
    sections.push('- **PM** → creates PRDs and technical specs');
    sections.push('- **Architect** → designs system architecture');
    sections.push('- **Scrum Master** → prepares stories and manages workflow');
    sections.push('- **Developer** → implements stories');
    sections.push('- **Test Architect** → designs test strategy and quality gates');
    sections.push('');
    sections.push('Always respect the handoff protocol and provide clear context when passing work to another agent.');
    sections.push('');

    // Tools Available
    sections.push('## Tools & Capabilities');
    sections.push('');
    sections.push('You have access to all standard Claude Code tools:');
    sections.push('- `Read` - Read files from the codebase');
    sections.push('- `Write` - Create new files');
    sections.push('- `Edit` - Modify existing files');
    sections.push('- `Bash` - Execute shell commands');
    sections.push('- `Glob` - Find files by pattern');
    sections.push('- `Grep` - Search code');
    sections.push('- `Task` - Invoke other agents');
    sections.push('');

    // Module Context
    if (metadata.module) {
      sections.push('## Module Context');
      sections.push('');
      sections.push(`You belong to the **${metadata.module.toUpperCase()}** module.`);
      sections.push('');
      sections.push('Your workflows are located at:');
      sections.push(`- \`src/modules/${metadata.module}/workflows/\``);
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate all agent prompts
   */
  async generateAll(outputDir) {
    const agents = this.registry.getAllAgents();
    const results = [];

    for (const agent of agents) {
      const agentId = this.registry.getAgentId(agent);
      const prompt = this.generatePrompt(agent);
      const outputPath = path.join(outputDir, `${agentId}.md`);

      await fs.writeFile(outputPath, prompt, 'utf8');

      results.push({
        agentId,
        name: agent.definition.metadata.name,
        title: agent.definition.metadata.title,
        outputPath
      });

      console.log(`✓ Generated agent prompt: ${agentId} → ${outputPath}`);
    }

    return results;
  }

  /**
   * Generate a single agent prompt
   */
  async generateOne(agentId, outputDir) {
    const agent = this.registry.getAgent(agentId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const prompt = this.generatePrompt(agent);
    const outputPath = path.join(outputDir, `${agentId}.md`);

    await fs.writeFile(outputPath, prompt, 'utf8');

    console.log(`✓ Generated agent prompt: ${agentId} → ${outputPath}`);

    return { agentId, outputPath };
  }
}

export default AgentPromptGenerator;
