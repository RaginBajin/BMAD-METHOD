# Claude Code Configuration for BMAD-METHOD v6-alpha

This directory contains Claude Code configuration files for the BMAD-METHOD v6-alpha branch.

## Agent Mode

This project is configured to use **Agent Mode** with Claude Code. Agent mode enables specialized AI agents to assist with various development tasks:

### Enabled Agents

- **Explore Agent**: Fast agent specialized for exploring codebases
  - Finding files by patterns (e.g., `src/components/**/*.tsx`)
  - Searching code for keywords (e.g., "API endpoints")
  - Answering questions about the codebase structure

- **General-Purpose Agent**: For complex multi-step tasks
  - Researching complex questions
  - Searching for code across the codebase
  - Executing multi-step development tasks

### Using Agents

When working with Claude Code in this project, agents will be automatically invoked for:
- Complex codebase exploration tasks
- Multi-file searches and analysis
- Architecture and structure questions
- Complex refactoring or development workflows

### Custom Commands

The `.claude/commands` directory contains custom slash commands organized by domain:

- `bmad/core/` - Core BMAD workflow commands
- `bmad/bmb/` - BMAD Builder commands and workflows
- `bmad/bmd/` - BMAD Development commands

Use these commands with the `/` prefix in Claude Code (e.g., `/bmad/core/workflows/brainstorming`).

## Configuration Files

- `settings.json` - Main Claude Code settings with agent configuration
- `commands/` - Custom slash commands for BMAD workflows

## More Information

For more information about BMAD-METHOD v6-alpha, see the main [README.md](../README.md) in the project root.
