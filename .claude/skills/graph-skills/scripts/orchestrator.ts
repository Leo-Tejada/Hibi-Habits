/**
 * Graph Skills - Core Orchestrator
 * Executes graph-based workflows using Claude subagents
 */

import {
  Graph,
  GraphNode,
  GraphResult,
  NodeResult,
  ExecutionContext,
  SubagentType,
  ClaudeModel
} from './types';
import { ModelRouter } from './model-router';

/**
 * GraphOrchestrator - Manages execution of graph-based workflows
 */
export class GraphOrchestrator {
  private router: ModelRouter;

  constructor() {
    this.router = new ModelRouter();
  }

  /**
   * Execute a complete graph
   */
  async execute(graph: Graph, input: any): Promise<GraphResult> {
    const startTime = Date.now();

    // Initialize execution context
    const context: ExecutionContext = {
      outputs: {},
      input,
      metadata: {
        startTime,
        completedNodes: [],
        failedNodes: []
      }
    };

    // Perform topological sort to determine execution order
    const executionOrder = this.topologicalSort(graph);

    console.log(`\n🔷 Executing graph: ${graph.metadata?.name || 'Unnamed'}`);
    console.log(`   Nodes: ${executionOrder.length}`);
    console.log(`   Execution order: ${executionOrder.join(' → ')}\n`);

    // Execute nodes in order
    const nodeResults: Record<string, NodeResult> = {};
    let totalTokens = 0;

    for (const nodeId of executionOrder) {
      const node = graph.nodes[nodeId];

      console.log(`\n▶️  Executing node: ${nodeId}`);
      console.log(`   Agent: ${node.agent}`);
      console.log(`   Task: ${node.task}`);

      try {
        // Execute the node
        const result = await this.executeNode(nodeId, node, context);
        nodeResults[nodeId] = result;

        if (result.success) {
          // Store output in context
          context.outputs[node.output] = result.output;
          context.metadata.completedNodes.push(nodeId);

          console.log(`✅ Completed: ${nodeId}`);
          console.log(`   Duration: ${result.metrics.duration}ms`);

          if (result.metrics.tokensUsed) {
            totalTokens += result.metrics.tokensUsed;
            console.log(`   Tokens: ${result.metrics.tokensUsed}`);
          }
        } else {
          context.metadata.failedNodes.push(nodeId);
          console.error(`❌ Failed: ${nodeId} - ${result.error}`);

          // Fail fast - stop execution on first error
          break;
        }
      } catch (error) {
        const errorResult: NodeResult = {
          nodeId,
          success: false,
          output: null,
          error: error instanceof Error ? error.message : String(error),
          metrics: {
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0
          }
        };

        nodeResults[nodeId] = errorResult;
        context.metadata.failedNodes.push(nodeId);

        console.error(`❌ Exception in ${nodeId}:`, error);
        break;
      }
    }

    // Compile final result
    const endTime = Date.now();
    const success = context.metadata.failedNodes.length === 0;
    const finalOutput = this.extractFinalOutput(graph, context, executionOrder);

    const result: GraphResult = {
      success,
      output: finalOutput,
      nodeResults,
      metrics: {
        totalDuration: endTime - startTime,
        totalTokens,
        nodeCount: executionOrder.length,
        successCount: context.metadata.completedNodes.length,
        failureCount: context.metadata.failedNodes.length
      }
    };

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Execution Summary`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Total Duration: ${result.metrics.totalDuration}ms`);
    console.log(`Nodes Completed: ${result.metrics.successCount}/${result.metrics.nodeCount}`);
    console.log(`Total Tokens: ${result.metrics.totalTokens}`);
    console.log(`${'='.repeat(60)}\n`);

    return result;
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    nodeId: string,
    node: GraphNode,
    context: ExecutionContext
  ): Promise<NodeResult> {
    const startTime = Date.now();

    try {
      // Select model
      const routing = this.router.selectModel(node, {
        complexity: this.estimateComplexity(node.task)
      });

      console.log(`   Model: ${routing.model} (${routing.reasoning})`);

      // Prepare input from dependencies
      const nodeInput = this.prepareDependencyInputs(node, context);

      // Build prompt for the subagent
      const prompt = this.buildPrompt(node, nodeInput, context.input);

      // Invoke Claude subagent
      // NOTE: In actual implementation, this would use Claude's Task tool
      // For now, we'll simulate the call
      const output = await this.invokeSubagent(
        routing.agent,
        routing.model,
        prompt,
        nodeInput
      );

      const endTime = Date.now();

      return {
        nodeId,
        success: true,
        output,
        metrics: {
          startTime,
          endTime,
          duration: endTime - startTime,
          tokensUsed: this.estimateTokens(prompt, output)
        }
      };
    } catch (error) {
      const endTime = Date.now();

      return {
        nodeId,
        success: false,
        output: null,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          startTime,
          endTime,
          duration: endTime - startTime
        }
      };
    }
  }

  /**
   * Perform topological sort to determine execution order
   */
  private topologicalSort(graph: Graph): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    // Find all nodes with no dependencies (entry points)
    const entryNodes = graph.entry
      ? [graph.entry]
      : Object.keys(graph.nodes).filter(
          nodeId => !graph.nodes[nodeId].dependencies?.length
        );

    // Recursive DFS
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;

      visited.add(nodeId);

      // Visit dependencies first
      const node = graph.nodes[nodeId];
      if (node.dependencies) {
        for (const depId of node.dependencies) {
          if (!graph.nodes[depId]) {
            throw new Error(`Dependency not found: ${depId} (required by ${nodeId})`);
          }
          visit(depId);
        }
      }

      order.push(nodeId);
    };

    // Visit all entry nodes
    for (const entryNode of entryNodes) {
      visit(entryNode);
    }

    // Check for unreachable nodes
    const unreachable = Object.keys(graph.nodes).filter(
      nodeId => !visited.has(nodeId)
    );

    if (unreachable.length > 0) {
      console.warn(`⚠️  Unreachable nodes: ${unreachable.join(', ')}`);
    }

    return order;
  }

  /**
   * Prepare inputs from completed dependencies
   */
  private prepareDependencyInputs(
    node: GraphNode,
    context: ExecutionContext
  ): Record<string, any> {
    const inputs: Record<string, any> = {};

    if (node.dependencies) {
      for (const depId of node.dependencies) {
        // Find the output key from the dependency node
        const depNode = Object.values(context.outputs).find(
          (_, key) => key === depId
        );

        if (depNode !== undefined) {
          inputs[depId] = depNode;
        }
      }
    }

    return inputs;
  }

  /**
   * Build prompt for subagent invocation
   */
  private buildPrompt(
    node: GraphNode,
    dependencyInputs: Record<string, any>,
    originalInput: any
  ): string {
    let prompt = `Task: ${node.task}\n\n`;

    // Add original input
    if (originalInput) {
      prompt += `Original Input:\n${JSON.stringify(originalInput, null, 2)}\n\n`;
    }

    // Add dependency outputs
    if (Object.keys(dependencyInputs).length > 0) {
      prompt += `Context from Dependencies:\n`;
      for (const [depId, output] of Object.entries(dependencyInputs)) {
        prompt += `\n${depId}:\n${JSON.stringify(output, null, 2)}\n`;
      }
      prompt += '\n';
    }

    // Add specific instructions
    prompt += `Instructions:\n`;
    prompt += `1. Complete the task described above\n`;
    prompt += `2. Use the provided context from dependencies\n`;
    prompt += `3. Return results in a structured format\n`;
    prompt += `4. Be concise and focus on the specific task\n`;

    return prompt;
  }

  /**
   * Invoke Claude subagent (simulated for now)
   */
  private async invokeSubagent(
    agent: SubagentType,
    model: ClaudeModel,
    prompt: string,
    context: any
  ): Promise<any> {
    // NOTE: In actual implementation, this would call:
    // await Task({ subagent_type: agent, model: model, prompt: prompt })
    //
    // For now, we simulate with a simple response
    console.log(`   [SIMULATED] Calling ${agent} with ${model}`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return simulated output
    return {
      agent,
      model,
      result: `Simulated output from ${agent}/${model}`,
      contextUsed: Object.keys(context).length
    };
  }

  /**
   * Extract final output from execution context
   */
  private extractFinalOutput(
    graph: Graph,
    context: ExecutionContext,
    executionOrder: string[]
  ): any {
    // Return output from last executed node
    if (executionOrder.length === 0) {
      return null;
    }

    const lastNodeId = executionOrder[executionOrder.length - 1];
    const lastNode = graph.nodes[lastNodeId];

    return context.outputs[lastNode.output] || null;
  }

  /**
   * Estimate task complexity
   */
  private estimateComplexity(task: string): 'low' | 'medium' | 'high' {
    const taskLower = task.toLowerCase();

    // High complexity indicators
    if (
      taskLower.includes('analyze architecture') ||
      taskLower.includes('deep analysis') ||
      taskLower.includes('complex pattern') ||
      taskLower.includes('design')
    ) {
      return 'high';
    }

    // Low complexity indicators
    if (
      taskLower.includes('scan') ||
      taskLower.includes('list') ||
      taskLower.includes('count') ||
      taskLower.includes('find')
    ) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Estimate token usage (rough approximation)
   */
  private estimateTokens(prompt: string, output: any): number {
    const promptTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(JSON.stringify(output).length / 4);
    return promptTokens + outputTokens;
  }
}
