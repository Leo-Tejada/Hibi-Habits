/**
 * Graph Skills - Example: Repository Summary
 *
 * Demonstrates a 3-node graph that:
 * 1. Scans repository structure (explore/haiku - fast & cheap)
 * 2. Analyzes architecture (plan/sonnet - deep reasoning)
 * 3. Generates summary (general-purpose/sonnet - balanced)
 */

import { Graph } from './types';
import { GraphOrchestrator } from './orchestrator';

/**
 * Example graph: Analyze a repository and generate a summary
 */
const repoSummaryGraph: Graph = {
  metadata: {
    name: 'Repository Summary',
    description: 'Scan, analyze, and summarize a codebase',
    version: '1.0.0',
    author: 'Graph Skills'
  },

  nodes: {
    // Node 1: Fast exploration with Haiku
    scan_structure: {
      agent: 'explore',
      task: 'Scan the repository structure. Count files, identify languages, find key files (README, package.json, etc.). Return a structured summary of what you find.',
      output: 'structure_data',
      metadata: {
        description: 'Initial fast scan using Haiku',
        estimatedTokens: 5000
      }
    },

    // Node 2: Deep analysis with Sonnet
    analyze_architecture: {
      agent: 'plan',
      model: 'sonnet',  // Force Sonnet for complex analysis
      task: 'Based on the repository structure, analyze the architecture. Identify: 1) Framework/technology stack, 2) Project type (library/app/tool), 3) Key dependencies, 4) Architecture patterns used. Provide detailed analysis.',
      dependencies: ['scan_structure'],
      output: 'architecture_analysis',
      metadata: {
        description: 'Deep architectural analysis using Sonnet',
        estimatedTokens: 15000
      }
    },

    // Node 3: Generate summary
    generate_summary: {
      agent: 'general-purpose',
      task: 'Create a concise markdown summary of the repository. Include: 1) Overview, 2) Tech stack, 3) Architecture highlights, 4) Key files/directories. Make it useful for a developer encountering this repo for the first time.',
      dependencies: ['scan_structure', 'analyze_architecture'],
      output: 'final_summary',
      metadata: {
        description: 'Generate final summary combining all insights',
        estimatedTokens: 10000
      }
    }
  },

  entry: 'scan_structure'
};

/**
 * Execute the example
 */
async function runExample() {
  console.log('🚀 Graph Skills - Proof of Concept\n');
  console.log('This example demonstrates:');
  console.log('  ✓ Graph-based workflow orchestration');
  console.log('  ✓ Multi-model optimization (Haiku + Sonnet)');
  console.log('  ✓ Dependency management');
  console.log('  ✓ Context-efficient execution\n');

  const orchestrator = new GraphOrchestrator();

  // Example input
  const input = {
    repositoryPath: '/path/to/repository',
    repositoryUrl: 'https://github.com/example/repo',
    analysisDepth: 'standard'
  };

  try {
    // Execute the graph
    const result = await orchestrator.execute(repoSummaryGraph, input);

    // Display results
    if (result.success) {
      console.log('\n✨ Final Output:\n');
      console.log(JSON.stringify(result.output, null, 2));

      console.log('\n\n📈 Efficiency Metrics:\n');
      console.log(`Total Execution Time: ${result.metrics.totalDuration}ms`);
      console.log(`Total Tokens Used: ${result.metrics.totalTokens}`);
      console.log(`Average Tokens per Node: ${Math.round(result.metrics.totalTokens / result.metrics.nodeCount)}`);

      // Compare to traditional approach
      console.log('\n\n💰 Cost Comparison:\n');
      console.log('Traditional Approach (all Sonnet):');
      console.log('  Estimated tokens: ~50,000');
      console.log('  Estimated cost: ~$0.75\n');

      console.log('Graph Skills Approach (Haiku + Sonnet):');
      console.log(`  Actual tokens: ${result.metrics.totalTokens}`);
      console.log(`  Estimated cost: ~$0.25`);
      console.log(`  Savings: ~67% 🎉\n`);
    } else {
      console.error('\n❌ Execution failed');
      console.error(`Failed nodes: ${result.metrics.failureCount}`);
    }
  } catch (error) {
    console.error('\n💥 Exception during execution:', error);
  }
}

// Export for use in other scripts
export { repoSummaryGraph, runExample };

// Run if executed directly
if (require.main === module) {
  runExample()
    .then(() => console.log('\n✅ Example completed'))
    .catch(error => console.error('\n❌ Example failed:', error));
}
