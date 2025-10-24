# Using BMAD Agents with Claude Code

This guide explains how to use BMAD-METHOD agents as Claude Code subagents for multi-agent workflows.

## Overview

BMAD-METHOD v6-alpha now supports Claude Code's multi-agent system, allowing each BMAD agent (PM, Analyst, Architect, Developer, etc.) to operate as an independent subagent with isolated context and parallel execution capabilities.

## Generated Agents

When you run `npm run generate:agents`, the system automatically:

1. Discovers all BMAD agent YAML definitions
2. Generates Claude Code agent prompt files in `.claude/agents/`
3. Updates `.claude/settings.json` with agent configurations
4. Creates an agent registry at `.claude/agent-registry.json`

### Available Agents

**Core Module:**
- `bmad-core-bmad-master` - Master orchestrator and BMad expert

**BMM Module (Software Development):**
- `bmad-bmm-mary` - Business Analyst
- `bmad-bmm-john` - Product Manager
- `bmad-bmm-winston` - System Architect
- `bmad-bmm-bob` - Scrum Master
- `bmad-bmm-amelia` - Developer
- `bmad-bmm-murat` - Test Architect
- `bmad-bmm-sally` - UX Expert

**BMM Module (Game Development):**
- `bmad-bmm-samus-shepard` - Game Designer
- `bmad-bmm-cloud-dragonborn` - Game Architect
- `bmad-bmm-link-freeman` - Game Developer

**CIS Module (Creative Intelligence):**
- `bmad-cis-maya` - Design Thinking Maestro
- `bmad-cis-carson` - Brainstorming Specialist
- `bmad-cis-dr.-quinn` - Problem Solver
- `bmad-cis-victor` - Innovation Strategist
- `bmad-cis-sophia` - Storyteller

**BMB Module (Builder):**
- `bmad-bmb-bmad-builder` - Agent and workflow builder

## Using Agents in Claude Code

### Invoking a Single Agent

Use the `Task` tool to invoke an agent:

```javascript
Task("bmad-bmm-john", "Create a PRD for a new mobile app feature", {
  inputs: {
    product_brief: "bmad/bmm/product-brief.md",
    research: "bmad/bmm/research/"
  },
  workflow: "prd",
  expectedOutputs: ["bmad/bmm/prd.md"]
})
```

### Agent Context Structure

When invoking an agent, provide context with:

```javascript
{
  // Input files or data
  inputs: {
    key: "value or path"
  },

  // Workflow to execute
  workflow: "workflow-name",

  // Previous agent in the chain
  previousAgent: "bmad-bmm-mary",

  // Handoff notes from previous agent
  handoffNotes: "Analyst completed research. Key findings: ...",

  // Expected outputs
  expectedOutputs: [
    "path/to/output1.md",
    "path/to/output2.yaml"
  ]
}
```

### Example Workflows

#### Example 1: Creating a PRD

```javascript
// Step 1: Analyst gathers requirements
Task("bmad-bmm-mary", "Research and create product brief for new feature", {
  workflow: "product-brief",
  expectedOutputs: ["bmad/bmm/product-brief.md"]
})

// Step 2: PM creates PRD
Task("bmad-bmm-john", "Create PRD based on product brief", {
  inputs: {
    product_brief: "bmad/bmm/product-brief.md"
  },
  workflow: "prd",
  previousAgent: "bmad-bmm-mary",
  expectedOutputs: ["bmad/bmm/prd.md"]
})
```

#### Example 2: Story Implementation

```javascript
// Step 1: SM prepares story
Task("bmad-bmm-bob", "Create story from backlog", {
  workflow: "create-story",
  expectedOutputs: ["bmad/bmm/stories/story-123.md"]
})

// Step 2: SM generates story context
Task("bmad-bmm-bob", "Generate story context for STORY-123", {
  inputs: {
    story: "bmad/bmm/stories/story-123.md",
    prd: "bmad/bmm/prd.md",
    architecture: "bmad/bmm/architecture.md"
  },
  workflow: "story-context",
  expectedOutputs: ["bmad/bmm/stories/story-123-context.xml"]
})

// Step 3: Dev implements story
Task("bmad-bmm-amelia", "Implement story STORY-123", {
  inputs: {
    story: "bmad/bmm/stories/story-123.md",
    context: "bmad/bmm/stories/story-123-context.xml"
  },
  workflow: "develop",
  previousAgent: "bmad-bmm-bob",
  expectedOutputs: ["implementation complete", "all tests passing"]
})

// Step 4: SM marks story done
Task("bmad-bmm-bob", "Mark story STORY-123 as done", {
  inputs: {
    story: "bmad/bmm/stories/story-123.md"
  },
  workflow: "story-done",
  previousAgent: "bmad-bmm-amelia"
})
```

#### Example 3: Parallel Agent Execution

```javascript
// Run multiple agents in parallel for different tasks
[
  Task("bmad-bmm-sally", "Design UX for login flow", {
    workflow: "ux-spec",
    expectedOutputs: ["bmad/bmm/ux/login-flow.md"]
  }),

  Task("bmad-bmm-murat", "Design test strategy for authentication", {
    workflow: "test-design",
    expectedOutputs: ["bmad/bmm/tests/auth-test-plan.md"]
  }),

  Task("bmad-bmm-winston", "Review architecture for security concerns", {
    workflow: "solutioning-gate-check",
    expectedOutputs: ["bmad/bmm/architecture-review.md"]
  })
]
```

## Agent Output Format

Each agent returns results in this format:

```markdown
## Task Summary
Brief description of what the agent accomplished

## Results
Main deliverables, files created/modified, decisions made

## Files Modified
- path/to/file1.md
- path/to/file2.yaml

## Next Steps
Recommended next actions or which agent should be invoked next

## Handoff Context
Critical information for the next agent in the workflow
```

## Regenerating Agents

If you modify agent YAML definitions, regenerate the Claude Code agents:

```bash
npm run generate:agents
```

This will:
- Rediscover all agent definitions
- Regenerate `.claude/agents/*.md` files
- Update `.claude/settings.json`
- Update `.claude/agent-registry.json`

## Configuration

### .claude/settings.json

Agent configuration is stored in `.claude/settings.json`:

```json
{
  "agentMode": "on",
  "agents": {
    "bmad-bmm-john": {
      "enabled": true,
      "description": "📋 Product Manager - Investigative Product Strategist",
      "module": "bmm",
      "role": "Investigative Product Strategist + Market-Savvy PM"
    }
  },
  "bmad": {
    "enabled": true,
    "agentRegistry": ".claude/agent-registry.json",
    "generatedAt": "2025-10-24T02:02:51.995Z"
  }
}
```

### Agent Registry

The agent registry (`.claude/agent-registry.json`) contains metadata about all agents:

```json
{
  "bmad-bmm-john": {
    "id": "bmad-bmm-john",
    "name": "John",
    "title": "Product Manager",
    "icon": "📋",
    "module": "bmm",
    "role": "Investigative Product Strategist + Market-Savvy PM",
    "filePath": "src/modules/bmm/agents/pm.agent.yaml"
  }
}
```

## Benefits of Multi-Agent Architecture

1. **Isolation**: Each agent runs in its own context with focused responsibilities
2. **Parallelization**: Multiple agents can work simultaneously on different tasks
3. **Scalability**: Easy to add new specialized agents
4. **Debugging**: Clear agent boundaries make troubleshooting easier
5. **Reusability**: Agents can be invoked from any workflow or context
6. **State Management**: Clear handoff points between agents ensure proper context transfer

## Troubleshooting

### Agent Not Found

If you get an "Agent not found" error:

1. Run `npm run generate:agents` to regenerate agents
2. Check that the agent exists in `.claude/settings.json`
3. Verify the agent ID matches the generated ID

### Agent Generation Fails

If agent generation fails:

1. Ensure you're on the v6-alpha branch or have merged it
2. Run `npm install` to ensure dependencies are installed
3. Check that agent YAML files are valid
4. Review error messages for specific issues

### Agents Not Working as Expected

1. Review the generated agent prompt in `.claude/agents/`
2. Check that the workflow paths are correct
3. Ensure required input files exist
4. Verify the agent's critical actions are being followed

## Next Steps

- Review the [Claude Code Multi-Agent Architecture](./architecture/claude-code-multi-agent-design.md)
- Explore [BMM Workflows](../src/modules/bmm/workflows/README.md)
- Learn about [Creating Custom Agents](../src/modules/bmb/workflows/create-agent/README.md)

## Support

For questions or issues:
- 💬 [Discord Community](https://discord.gg/gk8jAdXWmj)
- 🐛 [Issue Tracker](https://github.com/bmad-code-org/BMAD-METHOD/issues)
- 📚 [Documentation](../README.md)
