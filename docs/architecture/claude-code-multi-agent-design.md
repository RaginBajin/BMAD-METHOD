# BMAD-METHOD Claude Code Multi-Agent Architecture

## Overview

This document describes the architecture for integrating BMAD-METHOD agents with Claude Code's multi-agent system, enabling each BMAD agent to operate as an independent subagent.

## Design Goals

1. **Agent Isolation**: Each BMAD agent runs in its own context
2. **Workflow Integration**: Workflows can invoke agents via Task tool
3. **Backward Compatibility**: Maintain existing agent definitions (YAML)
4. **Orchestration**: Coordinate multi-agent workflows
5. **Parallel Execution**: Enable concurrent agent operations

## Architecture Components

### 1. Agent Definition Layer

**Current**: YAML-based agent definitions in `src/modules/{module}/agents/*.agent.yaml`

**Enhancement**: Add Claude Code agent metadata

```yaml
agent:
  metadata:
    id: bmad/bmm/agents/pm.md
    name: John
    title: Product Manager
    icon: 📋
    module: bmm
    # NEW: Claude Code integration
    claude_code:
      subagent_type: bmad-pm
      description: "Product Manager agent for BMM workflows"
      tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
```

### 2. Agent Registry System

**New Component**: `src/core/claude-code/agent-registry.js`

Generates Claude Code agent type definitions from BMAD agent YAML files:

```javascript
// Reads all agent YAML files
// Generates agent type definitions
// Creates agent prompt templates
// Registers agents with Claude Code
```

**Output**: `.claude/agents/` directory with agent definitions

```
.claude/
└── agents/
    ├── bmad-pm.md          # Product Manager agent
    ├── bmad-analyst.md     # Business Analyst agent
    ├── bmad-architect.md   # Architect agent
    ├── bmad-sm.md          # Scrum Master agent
    ├── bmad-dev.md         # Developer agent
    └── bmad-tea.md         # Test Architect agent
```

### 3. Agent Prompt Template

Each agent gets a markdown prompt file:

```markdown
# {Agent Title} ({Agent Name})

{persona.identity}

## Role
{persona.role}

## Communication Style
{persona.communication_style}

## Principles
{persona.principles}

## Critical Actions
{critical_actions}

## Available Workflows

{menu items converted to workflow descriptions}

## Instructions

You are the {title} agent for the BMAD-METHOD framework. Your role is to {role description}.

When invoked, you should:
1. Understand the task context from the prompt
2. Execute the appropriate workflow
3. Follow your principles and critical actions
4. Return results in the expected format

Available workflows:
{workflow list with triggers and descriptions}

## Output Format

Return your results as structured markdown with:
- Clear sections
- Action items
- References to created/modified files
- Next recommended steps
```

### 4. Workflow Agent Invocation

**Current**: Workflows execute inline within single conversation

**New**: Workflows use Task tool to invoke agents

**Example Workflow Change**:

**Before** (inline execution):
```yaml
steps:
  - instruction: "PM agent creates PRD"
    action: "Execute PRD creation workflow"
```

**After** (agent invocation):
```yaml
steps:
  - instruction: "Invoke PM agent to create PRD"
    agent_invocation:
      agent: bmad-pm
      task: "Create PRD for the project"
      context:
        workflow: "prd"
        inputs:
          - product_brief: "{path}/product-brief.md"
          - research: "{path}/research/"
      outputs:
        - prd_document: "{path}/prd.md"
```

### 5. Agent Orchestrator

**New Component**: `src/core/claude-code/orchestrator.js`

Manages multi-agent workflows:

```javascript
class BMadOrchestrator {
  async invokeAgent(agentType, task, context) {
    // Prepare agent invocation
    // Call Task tool with agent type
    // Wait for results
    // Process and return
  }

  async coordinateWorkflow(workflowDef) {
    // Parse workflow YAML
    // Identify agent invocations
    // Execute in sequence or parallel
    // Coordinate handoffs between agents
  }

  async partyMode(topic, agents) {
    // Invoke multiple agents in parallel
    // Collect responses
    // Synthesize discussion
  }
}
```

### 6. Agent Communication Protocol

**Agent Handoff Format**:

```json
{
  "from_agent": "bmad-sm",
  "to_agent": "bmad-dev",
  "context": {
    "story_id": "STORY-123",
    "story_path": "bmad/bmm/stories/story-123.md",
    "story_context_path": "bmad/bmm/stories/story-123-context.xml",
    "status": "approved"
  },
  "task": "Implement story STORY-123",
  "expected_output": {
    "implementation_complete": true,
    "tests_passing": true,
    "files_modified": []
  }
}
```

## Implementation Phases

### Phase 1: Agent Registry & Generation
- [ ] Create agent registry system
- [ ] Generate Claude Code agent prompts from YAML
- [ ] Test single agent invocation

### Phase 2: Workflow Integration
- [ ] Update workflow schema to support agent invocations
- [ ] Implement orchestrator
- [ ] Test sequential agent workflows

### Phase 3: Multi-Agent Coordination
- [ ] Implement party mode with agents
- [ ] Enable parallel agent execution
- [ ] Test complex multi-agent scenarios

### Phase 4: Migration
- [ ] Update all BMM workflows to use agents
- [ ] Update all CIS workflows
- [ ] Documentation and examples

## Example: Story Implementation Flow

### Current Flow (Single Conversation)
```
User loads SM agent
→ SM: create-story workflow (inline)
→ User switches to Dev agent
→ Dev: develop workflow (inline)
→ User switches to SM agent
→ SM: story-done workflow (inline)
```

### New Flow (Multi-Agent)
```
User invokes orchestrator
→ Task(bmad-sm, "create-story", {...})
  → SM agent creates story in isolated context
  → Returns story path and context
→ Task(bmad-dev, "implement-story", {story_path, context_path})
  → Dev agent implements in isolated context
  → Returns completion status
→ Task(bmad-sm, "story-done", {story_path})
  → SM agent marks done
  → Returns updated status
```

## Benefits

1. **Isolation**: Each agent operates independently
2. **Parallelization**: Multiple agents can work simultaneously
3. **Scalability**: Easy to add new agents
4. **Debugging**: Clear agent boundaries for troubleshooting
5. **Reusability**: Agents can be invoked from any context
6. **State Management**: Clear handoff points between agents

## Backward Compatibility

- Keep existing YAML agent definitions
- Maintain web bundle support (single conversation)
- Support both modes: IDE (multi-agent) and Web (single conversation)
- Agent customization still works via sidecar files

## File Structure

```
BMAD-METHOD/
├── .claude/
│   ├── agents/                    # Generated agent definitions
│   │   ├── bmad-pm.md
│   │   ├── bmad-analyst.md
│   │   ├── bmad-architect.md
│   │   ├── bmad-sm.md
│   │   ├── bmad-dev.md
│   │   └── bmad-tea.md
│   └── settings.json              # Agent mode configuration
│
├── src/
│   ├── core/
│   │   └── claude-code/           # NEW: Claude Code integration
│   │       ├── agent-registry.js  # Agent registration
│   │       ├── orchestrator.js    # Multi-agent orchestration
│   │       ├── templates/         # Agent prompt templates
│   │       └── generators/        # Agent generation tools
│   │
│   └── modules/
│       └── bmm/
│           ├── agents/            # Existing YAML agents
│           └── workflows/         # Updated workflows
│
└── tools/
    └── claude-code/
        └── generate-agents.js     # CLI to generate agents
```

## Configuration

### .claude/settings.json

```json
{
  "agentMode": "on",
  "bmad": {
    "enabled": true,
    "agentRegistry": "bmad/_cfg/agent-manifest.csv",
    "orchestrator": "bmad-orchestrator"
  },
  "agents": {
    "bmad-pm": {
      "enabled": true,
      "description": "Product Manager for BMAD Method"
    },
    "bmad-analyst": {
      "enabled": true,
      "description": "Business Analyst for BMAD Method"
    },
    "bmad-architect": {
      "enabled": true,
      "description": "System Architect for BMAD Method"
    },
    "bmad-sm": {
      "enabled": true,
      "description": "Scrum Master for BMAD Method"
    },
    "bmad-dev": {
      "enabled": true,
      "description": "Developer Agent for BMAD Method"
    },
    "bmad-tea": {
      "enabled": true,
      "description": "Test Architect for BMAD Method"
    }
  }
}
```

## Next Steps

1. Review and approve architecture
2. Implement Phase 1 (Agent Registry)
3. Create prototype with 2-3 agents
4. Test workflow integration
5. Full migration plan
