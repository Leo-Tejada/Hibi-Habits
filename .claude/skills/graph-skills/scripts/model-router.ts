/**
 * Graph Skills - Model Router
 * Intelligent routing to optimize cost and context usage
 */

import {
  SubagentType,
  ClaudeModel,
  ModelConfig,
  ModelRoutingDecision,
  GraphNode
} from './types';

/**
 * Model configurations with cost and capability profiles
 */
const MODEL_CONFIGS: Record<ClaudeModel, ModelConfig> = {
  haiku: {
    name: 'haiku',
    costPer1MInputTokens: 0.80,
    costPer1MOutputTokens: 4.00,
    maxTokens: 200000,
    strengths: [
      'Fast exploration',
      'File scanning',
      'Simple extraction',
      'Pattern matching',
      'Quick analysis'
    ]
  },
  sonnet: {
    name: 'sonnet',
    costPer1MInputTokens: 15.00,
    costPer1MOutputTokens: 75.00,
    maxTokens: 200000,
    strengths: [
      'Deep analysis',
      'Complex reasoning',
      'Architecture design',
      'Tutorial generation',
      'Code understanding'
    ]
  },
  opus: {
    name: 'opus',
    costPer1MInputTokens: 75.00,
    costPer1MOutputTokens: 375.00,
    maxTokens: 200000,
    strengths: [
      'Highest quality',
      'Most complex tasks',
      'Critical decisions',
      'Novel challenges'
    ]
  }
};

/**
 * Default model assignments based on subagent type
 */
const DEFAULT_MODELS: Record<SubagentType, ClaudeModel> = {
  explore: 'haiku',        // Fast, cheap exploration
  plan: 'sonnet',          // Complex planning and reasoning
  'general-purpose': 'sonnet'  // Balanced capability
};

/**
 * ModelRouter - Intelligently selects models based on task characteristics
 */
export class ModelRouter {
  /**
   * Select the optimal model for a given node
   */
  selectModel(
    node: GraphNode,
    context: { fileCount?: number; complexity?: 'low' | 'medium' | 'high' }
  ): ModelRoutingDecision {
    // If node specifies a model, use it
    if (node.model) {
      return {
        agent: node.agent,
        model: node.model,
        reasoning: 'Explicitly specified in node definition',
        estimatedCost: this.estimateCost(node.model, 10000, 2000)
      };
    }

    // Use heuristics to select model
    const model = this.selectModelByHeuristics(node, context);

    return {
      agent: node.agent,
      model,
      reasoning: this.explainSelection(node, context, model),
      estimatedCost: this.estimateCost(model, 10000, 2000)
    };
  }

  /**
   * Select model using heuristics
   */
  private selectModelByHeuristics(
    node: GraphNode,
    context: { fileCount?: number; complexity?: 'low' | 'medium' | 'high' }
  ): ClaudeModel {
    const task = node.task.toLowerCase();

    // Exploration tasks → Haiku
    if (
      task.includes('scan') ||
      task.includes('explore') ||
      task.includes('find') ||
      task.includes('identify') ||
      task.includes('count') ||
      task.includes('list')
    ) {
      return 'haiku';
    }

    // Deep analysis tasks → Sonnet
    if (
      task.includes('analyze') ||
      task.includes('understand') ||
      task.includes('architecture') ||
      task.includes('design') ||
      task.includes('pattern')
    ) {
      return 'sonnet';
    }

    // Generation tasks → Sonnet (quality matters)
    if (
      task.includes('generate') ||
      task.includes('create') ||
      task.includes('write') ||
      task.includes('compile')
    ) {
      return 'sonnet';
    }

    // Large file counts → Use Haiku for initial processing
    if (context.fileCount && context.fileCount > 50) {
      return 'haiku';
    }

    // High complexity → Sonnet
    if (context.complexity === 'high') {
      return 'sonnet';
    }

    // Default based on agent type
    return DEFAULT_MODELS[node.agent];
  }

  /**
   * Explain why a model was selected
   */
  private explainSelection(
    node: GraphNode,
    context: any,
    model: ClaudeModel
  ): string {
    const reasons: string[] = [];

    if (model === 'haiku') {
      reasons.push('Optimized for fast, cost-effective execution');
      if (context.fileCount && context.fileCount > 50) {
        reasons.push(`Large file count (${context.fileCount}) benefits from efficient scanning`);
      }
    } else if (model === 'sonnet') {
      reasons.push('Requires sophisticated reasoning and analysis');
      if (context.complexity === 'high') {
        reasons.push('High complexity task needs advanced capabilities');
      }
    } else if (model === 'opus') {
      reasons.push('Highest quality required for critical task');
    }

    return reasons.join('; ');
  }

  /**
   * Estimate cost for a model with given token usage
   */
  private estimateCost(
    model: ClaudeModel,
    inputTokens: number,
    outputTokens: number
  ): number {
    const config = MODEL_CONFIGS[model];
    const inputCost = (inputTokens / 1_000_000) * config.costPer1MInputTokens;
    const outputCost = (outputTokens / 1_000_000) * config.costPer1MOutputTokens;
    return inputCost + outputCost;
  }

  /**
   * Get model configuration
   */
  getModelConfig(model: ClaudeModel): ModelConfig {
    return MODEL_CONFIGS[model];
  }

  /**
   * Compare cost between two models for same task
   */
  compareCost(
    model1: ClaudeModel,
    model2: ClaudeModel,
    inputTokens: number,
    outputTokens: number
  ): {
    model1Cost: number;
    model2Cost: number;
    savings: number;
    savingsPercent: number;
  } {
    const cost1 = this.estimateCost(model1, inputTokens, outputTokens);
    const cost2 = this.estimateCost(model2, inputTokens, outputTokens);

    return {
      model1Cost: cost1,
      model2Cost: cost2,
      savings: Math.abs(cost1 - cost2),
      savingsPercent: ((Math.abs(cost1 - cost2) / Math.max(cost1, cost2)) * 100)
    };
  }
}
