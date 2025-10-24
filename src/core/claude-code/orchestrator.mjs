/**
 * BMAD Multi-Agent Orchestrator for Claude Code
 *
 * Coordinates multi-agent workflows and manages agent invocations
 */

import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

export class BMadOrchestrator {
  constructor(registry, projectRoot) {
    this.registry = registry;
    this.projectRoot = projectRoot;
    this.executionHistory = [];
  }

  /**
   * Invoke a single agent with a task
   *
   * @param {string} agentId - The agent ID (e.g., "bmad-pm")
   * @param {string} task - Task description for the agent
   * @param {object} context - Context and inputs for the agent
   * @returns {Promise<object>} Agent execution result
   */
  async invokeAgent(agentId, task, context = {}) {
    const agent = this.registry.getAgent(agentId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const invocation = {
      agentId,
      agentName: agent.definition.metadata.name,
      agentTitle: agent.definition.metadata.title,
      task,
      context,
      timestamp: new Date().toISOString()
    };

    console.log(`\n🎯 Invoking ${agent.definition.metadata.icon} ${agent.definition.metadata.title}...`);
    console.log(`   Task: ${task}`);

    // Record invocation
    this.executionHistory.push(invocation);

    // In actual implementation, this would use the Task tool
    // For now, we prepare the invocation data structure
    return {
      invocation,
      prompt: this.buildAgentPrompt(agent, task, context),
      expectedOutputs: context.expectedOutputs || []
    };
  }

  /**
   * Build a complete prompt for an agent invocation
   */
  buildAgentPrompt(agent, task, context) {
    const sections = [];

    sections.push(`# Task for ${agent.definition.metadata.title}`);
    sections.push('');
    sections.push(`**Task:** ${task}`);
    sections.push('');

    // Add context
    if (Object.keys(context).length > 0) {
      sections.push('## Context');
      sections.push('');

      if (context.inputs) {
        sections.push('### Inputs');
        sections.push('');
        for (const [key, value] of Object.entries(context.inputs)) {
          sections.push(`- **${key}:** ${value}`);
        }
        sections.push('');
      }

      if (context.workflow) {
        sections.push(`### Workflow: ${context.workflow}`);
        sections.push('');
      }

      if (context.previousAgent) {
        sections.push(`### Previous Agent: ${context.previousAgent}`);
        sections.push('');
      }

      if (context.handoffNotes) {
        sections.push('### Handoff Notes');
        sections.push(context.handoffNotes);
        sections.push('');
      }
    }

    // Expected outputs
    if (context.expectedOutputs) {
      sections.push('## Expected Outputs');
      sections.push('');
      context.expectedOutputs.forEach(output => {
        if (typeof output === 'string') {
          sections.push(`- ${output}`);
        } else {
          sections.push(`- **${Object.keys(output)[0]}:** ${Object.values(output)[0]}`);
        }
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Coordinate a workflow with multiple agents
   *
   * @param {object} workflowDef - Workflow definition with agent steps
   * @returns {Promise<object>} Workflow execution result
   */
  async coordinateWorkflow(workflowDef) {
    console.log(`\n📋 Coordinating workflow: ${workflowDef.name || 'Unnamed'}`);

    const results = [];
    let previousResult = null;

    for (const step of workflowDef.steps) {
      if (step.agentInvocation) {
        const { agent, task, context } = step.agentInvocation;

        // Merge previous result into context if needed
        const mergedContext = {
          ...context,
          previousResult
        };

        const result = await this.invokeAgent(agent, task, mergedContext);
        results.push(result);
        previousResult = result;
      }
    }

    return {
      workflow: workflowDef.name,
      steps: results,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Party mode - invoke multiple agents for collaborative discussion
   *
   * @param {string} topic - Discussion topic
   * @param {string[]} agentIds - Array of agent IDs to participate
   * @returns {Promise<object>} Party mode results
   */
  async partyMode(topic, agentIds) {
    console.log(`\n🎉 Party Mode: ${topic}`);
    console.log(`   Participants: ${agentIds.join(', ')}`);

    const invocations = [];

    for (const agentId of agentIds) {
      const agent = this.registry.getAgent(agentId);

      if (agent) {
        const invocation = await this.invokeAgent(
          agentId,
          `Participate in group discussion: ${topic}`,
          {
            discussionType: 'party-mode',
            topic,
            participants: agentIds
          }
        );

        invocations.push(invocation);
      }
    }

    return {
      topic,
      participants: agentIds,
      invocations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get execution history
   */
  getExecutionHistory() {
    return this.executionHistory;
  }

  /**
   * Get workflow status from BMAD workflow status file
   */
  async getWorkflowStatus() {
    const statusPath = path.join(
      this.projectRoot,
      'bmad/bmm/bmm-workflow-status.md'
    );

    if (await fs.pathExists(statusPath)) {
      const content = await fs.readFile(statusPath, 'utf8');
      return this.parseWorkflowStatus(content);
    }

    return null;
  }

  /**
   * Parse workflow status markdown
   */
  parseWorkflowStatus(content) {
    // Simple parser - can be enhanced
    const status = {
      phase: null,
      currentStory: null,
      backlog: [],
      inProgress: [],
      done: []
    };

    // Extract phase
    const phaseMatch = content.match(/Current Phase:\s*(\d+)/);
    if (phaseMatch) {
      status.phase = parseInt(phaseMatch[1]);
    }

    return status;
  }

  /**
   * Recommend next agent based on workflow status
   */
  async recommendNextAgent() {
    const status = await this.getWorkflowStatus();

    if (!status) {
      return {
        agent: 'bmad-bmm-john',
        workflow: 'workflow-status',
        reason: 'No workflow status found - start with PM to check status'
      };
    }

    // Simple recommendation logic
    if (status.phase === 1) {
      return {
        agent: 'bmad-bmm-mary',
        workflow: 'brainstorm-project',
        reason: 'Phase 1: Analysis - Analyst should gather requirements'
      };
    } else if (status.phase === 2) {
      return {
        agent: 'bmad-bmm-john',
        workflow: 'plan-project',
        reason: 'Phase 2: Planning - PM should create PRD'
      };
    } else if (status.phase === 3) {
      return {
        agent: 'bmad-bmm-winston',
        workflow: 'create-architecture',
        reason: 'Phase 3: Solutioning - Architect should design system'
      };
    } else if (status.phase === 4) {
      if (status.inProgress.length > 0) {
        return {
          agent: 'bmad-bmm-amelia',
          workflow: 'develop',
          reason: 'Phase 4: Story in progress - Developer should implement'
        };
      } else if (status.backlog.length > 0) {
        return {
          agent: 'bmad-bmm-bob',
          workflow: 'create-story',
          reason: 'Phase 4: Stories in backlog - SM should prepare next story'
        };
      }
    }

    return {
      agent: 'bmad-bmm-john',
      workflow: 'workflow-status',
      reason: 'Default: Check workflow status'
    };
  }

  /**
   * Export orchestration data for inspection
   */
  exportOrchestrationData() {
    return {
      registry: this.registry.exportRegistry(),
      executionHistory: this.executionHistory,
      timestamp: new Date().toISOString()
    };
  }
}

export default BMadOrchestrator;
