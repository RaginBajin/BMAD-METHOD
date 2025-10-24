/**
 * BMAD Agent Registry for Claude Code
 *
 * This module provides functionality to:
 * 1. Discover all BMAD agent YAML files
 * 2. Parse agent definitions
 * 3. Register agents for Claude Code multi-agent system
 */

import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { glob } from 'glob';

export class AgentRegistry {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.agents = new Map();
  }

  /**
   * Discover all agent YAML files in the project
   */
  async discoverAgents() {
    const pattern = path.join(this.projectRoot, 'src/**/*.agent.yaml');
    const agentFiles = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/bmad/**'],
      absolute: true
    });

    console.log(`Found ${agentFiles.length} agent files`);
    return agentFiles;
  }

  /**
   * Load and parse a single agent YAML file
   */
  async loadAgent(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const agentDef = yaml.load(content);

      if (!agentDef?.agent) {
        throw new Error(`Invalid agent file: ${filePath} - missing 'agent' root`);
      }

      // Extract relative path for module detection
      const relativePath = path.relative(this.projectRoot, filePath);

      return {
        filePath,
        relativePath,
        definition: agentDef.agent,
        fileName: path.basename(filePath, '.agent.yaml')
      };
    } catch (error) {
      console.error(`Error loading agent from ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Load all discovered agents
   */
  async loadAllAgents() {
    const agentFiles = await this.discoverAgents();
    const loadPromises = agentFiles.map(file => this.loadAgent(file));
    const loadedAgents = await Promise.all(loadPromises);

    // Filter out any failed loads and store in registry
    const validAgents = loadedAgents.filter(agent => agent !== null);

    for (const agent of validAgents) {
      const agentId = this.getAgentId(agent);
      this.agents.set(agentId, agent);
    }

    console.log(`Loaded ${this.agents.size} agents into registry`);
    return this.agents;
  }

  /**
   * Generate a unique agent ID for Claude Code
   */
  getAgentId(agent) {
    const metadata = agent.definition.metadata;

    // Use module and name to create ID
    // e.g., "bmad-pm", "bmad-analyst", "bmad-dev"
    if (metadata.module) {
      // Module agent: bmad-{module}-{name}
      return `bmad-${metadata.module}-${metadata.name.toLowerCase().replace(/\s+/g, '-')}`;
    } else {
      // Core agent: bmad-core-{name}
      return `bmad-core-${metadata.name.toLowerCase().replace(/\s+/g, '-')}`;
    }
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by module
   */
  getAgentsByModule(moduleName) {
    return this.getAllAgents().filter(agent =>
      agent.definition.metadata.module === moduleName
    );
  }

  /**
   * Get core agents (no module)
   */
  getCoreAgents() {
    return this.getAllAgents().filter(agent =>
      !agent.definition.metadata.module
    );
  }

  /**
   * Export agent registry as JSON for introspection
   */
  exportRegistry() {
    const registry = {};

    for (const [agentId, agent] of this.agents.entries()) {
      registry[agentId] = {
        id: agentId,
        name: agent.definition.metadata.name,
        title: agent.definition.metadata.title,
        icon: agent.definition.metadata.icon,
        module: agent.definition.metadata.module || 'core',
        role: agent.definition.persona.role,
        filePath: agent.relativePath
      };
    }

    return registry;
  }

  /**
   * Get Claude Code subagent type name
   */
  getSubagentType(agent) {
    return this.getAgentId(agent);
  }

  /**
   * Get agent description for Claude Code
   */
  getAgentDescription(agent) {
    const { metadata, persona } = agent.definition;
    return `${metadata.icon} ${metadata.title} - ${persona.role}`;
  }
}

export default AgentRegistry;
