/**
 * Graph Skills - Type Definitions
 * Lightweight graph-based orchestration for Claude Code subagents
 */

/**
 * Claude subagent types available in Claude Code
 */
export type SubagentType = 'explore' | 'plan' | 'general-purpose';

/**
 * Claude model tiers with different cost/capability profiles
 */
export type ClaudeModel = 'haiku' | 'sonnet' | 'opus';

/**
 * A node in the execution graph
 */
export interface GraphNode {
  /** Subagent type to use for this node */
  agent: SubagentType;

  /** Description of the task for this node */
  task: string;

  /** Dependencies that must complete before this node can execute */
  dependencies?: string[];

  /** Optional model override (defaults based on agent type) */
  model?: ClaudeModel;

  /** Key name for storing this node's output in context */
  output: string;

  /** Additional metadata for debugging/visualization */
  metadata?: {
    description?: string;
    estimatedTokens?: number;
    priority?: number;
  };
}

/**
 * Complete graph definition
 */
export interface Graph {
  /** All nodes in the graph */
  nodes: Record<string, GraphNode>;

  /** Optional entry point (defaults to nodes with no dependencies) */
  entry?: string;

  /** Graph metadata */
  metadata?: {
    name?: string;
    description?: string;
    version?: string;
    author?: string;
  };
}

/**
 * Execution context passed between nodes
 */
export interface ExecutionContext {
  /** Outputs from completed nodes */
  outputs: Record<string, any>;

  /** Original input to the graph */
  input: any;

  /** Execution metadata */
  metadata: {
    startTime: number;
    completedNodes: string[];
    failedNodes: string[];
  };
}

/**
 * Result of a node execution
 */
export interface NodeResult {
  /** Node identifier */
  nodeId: string;

  /** Whether execution succeeded */
  success: boolean;

  /** Output from the node */
  output: any;

  /** Error message if failed */
  error?: string;

  /** Execution metrics */
  metrics: {
    startTime: number;
    endTime: number;
    duration: number;
    tokensUsed?: number;
  };
}

/**
 * Complete graph execution result
 */
export interface GraphResult {
  /** Whether the entire graph executed successfully */
  success: boolean;

  /** Final output (typically from last node) */
  output: any;

  /** Results from all nodes */
  nodeResults: Record<string, NodeResult>;

  /** Overall execution metrics */
  metrics: {
    totalDuration: number;
    totalTokens: number;
    nodeCount: number;
    successCount: number;
    failureCount: number;
  };
}

/**
 * Model configuration for cost/capability analysis
 */
export interface ModelConfig {
  name: ClaudeModel;
  costPer1MInputTokens: number;
  costPer1MOutputTokens: number;
  maxTokens: number;
  strengths: string[];
}

/**
 * Model router decision
 */
export interface ModelRoutingDecision {
  /** Selected subagent */
  agent: SubagentType;

  /** Selected model */
  model: ClaudeModel;

  /** Reasoning for the selection */
  reasoning: string;

  /** Estimated cost */
  estimatedCost: number;
}
