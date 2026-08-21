# Graph Skills - Scripts

This directory contains the core TypeScript implementation of the Graph Skills orchestrator.

## Files

- **types.ts** - Type definitions for graphs, nodes, and execution
- **model-router.ts** - Intelligent model selection (Haiku vs Sonnet optimization)
- **orchestrator.ts** - Core graph execution engine
- **example-repo-summary.ts** - Proof-of-concept demonstration

## Quick Start

```bash
# Install dependencies (if not already available)
npm install

# Run the example
npm run example

# Or with ts-node directly
ts-node example-repo-summary.ts
```

## Usage

```typescript
import { GraphOrchestrator } from './orchestrator';
import { Graph } from './types';

// Define your graph
const myGraph: Graph = {
  nodes: {
    step1: {
      agent: 'explore',
      task: 'Scan files',
      output: 'file_list'
    },
    step2: {
      agent: 'plan',
      task: 'Analyze structure',
      dependencies: ['step1'],
      output: 'analysis'
    }
  }
};

// Execute
const orchestrator = new GraphOrchestrator();
const result = await orchestrator.execute(myGraph, { /* input */ });
```

## Architecture

```
types.ts          →  Interface definitions
     ↓
model-router.ts   →  Haiku/Sonnet selection logic
     ↓
orchestrator.ts   →  Graph execution engine
     ↓
example-*.ts      →  Concrete implementations
```

## Key Features

- **Multi-model optimization**: Automatic routing to Haiku (cheap) or Sonnet (powerful)
- **Dependency management**: Topological sort ensures correct execution order
- **Context efficiency**: Only load data needed for each node
- **Cost tracking**: Estimate and report token usage and costs
- **Type safety**: Full TypeScript types for graph definitions

## Integration with Claude Code

In production, the `invokeSubagent()` method will call Claude's Task tool:

```typescript
await Task({
  subagent_type: agent,  // 'explore', 'plan', or 'general-purpose'
  model: model,          // 'haiku', 'sonnet', or 'opus'
  prompt: prompt
});
```

For now, it's simulated for testing purposes.
