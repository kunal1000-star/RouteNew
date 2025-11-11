// Advanced AI File Structure Validation Test
// ==========================================
// Validates that all advanced AI system files exist and have proper structure

import { promises as fs } from 'fs';
import * as path from 'path';

interface FileValidationResult {
  component: string;
  file: string;
  status: 'EXISTS' | 'MISSING' | 'PARTIAL';
  size: number;
  hasExports: boolean;
  hasClasses: boolean;
  integrationPoints: string[];
}

export class AdvancedAIFileStructureValidator {
  private results: FileValidationResult[] = [];

  async runFileStructureValidation(): Promise<{
    overall: 'PASS' | 'FAIL' | 'PARTIAL';
    results: FileValidationResult[];
    summary: {
      totalFiles: number;
      existingFiles: number;
      missingFiles: number;
      integrationHealth: number;
    };
  }> {
    console.log('📁 Starting Advanced AI File Structure Validation...');
    console.log('======================================================\n');

    // Core System Files
    await this.validateCoreSystemFiles();

    // Memory System Files
    await this.validateMemorySystemFiles();

    // Web Search System Files
    await this.validateWebSearchSystemFiles();

    // 5-Layer Hallucination Prevention Files
    await this.validate5LayerSystemFiles();

    // Personalization System Files
    await this.validatePersonalizationSystemFiles();

    // Centralized Integration Files
    await this.validateCentralizedSystemFiles();

    return this.generateFileStructureReport();
  }

  private async validateCoreSystemFiles(): Promise<void> {
    console.log('🔍 Validating Core System Files...');
    
    const files = [
      'src/lib/ai/centralized-service-integration.ts',
      'src/lib/ai/advanced-personalization-engine.ts',
      'src/lib/ai/web-search-decision-engine.ts',
      'src/lib/ai/smart-query-classifier.ts',
      'src/lib/ai/adaptive-teaching-system.ts'
    ];

    for (const file of files) {
      await this.validateFile(file, 'Core System', [
        'exports', 'classes', 'integration points'
      ]);
    }
  }

  private async validateMemorySystemFiles(): Promise<void> {
    console.log('🔍 Validating Memory System Files...');
    
    const files = [
      'src/lib/ai/memory-context-provider.ts',
      'src/app/api/ai/memory-storage/route.ts',
      'src/app/api/memory/search/route.ts',
      'src/app/api/ai/semantic-search/route.ts',
      'src/lib/hallucination-prevention/layer2/ConversationMemory.ts'
    ];

    for (const file of files) {
      await this.validateFile(file, 'Memory System', [
        'memory storage', 'memory search', 'semantic search', 'database integration'
      ]);
    }
  }

  private async validateWebSearchSystemFiles(): Promise<void> {
    console.log('🔍 Validating Web Search System Files...');
    
    const files = [
      'src/lib/ai/web-search-decision-engine.ts',
      'src/app/api/ai/web-search/route.ts',
      'src/lib/ai/service-integration-layer.ts'
    ];

    for (const file of files) {
      await this.validateFile(file, 'Web Search System', [
        'decision engine', 'search execution', 'result formatting'
      ]);
    }
  }

  private async validate5LayerSystemFiles(): Promise<void> {
    console.log('🔍 Validating 5-Layer Hallucination Prevention Files...');
    
    const layers = [
      { file: 'src/lib/hallucination-prevention/layer1/QueryClassifier.ts', name: 'Layer 1' },
      { file: 'src/lib/hallucination-prevention/layer1/InputValidator.ts', name: 'Layer 1' },
      { file: 'src/lib/hallucination-prevention/layer1/PromptEngineer.ts', name: 'Layer 1' },
      { file: 'src/lib/hallucination-prevention/layer2/ConversationMemory.ts', name: 'Layer 2' },
      { file: 'src/lib/hallucination-prevention/layer2/ContextOptimizer.ts', name: 'Layer 2' },
      { file: 'src/lib/hallucination-prevention/layer2/EnhancedContextBuilder.ts', name: 'Layer 2' },
      { file: 'src/lib/hallucination-prevention/layer3/ResponseValidator.ts', name: 'Layer 3' },
      { file: 'src/lib/hallucination-prevention/layer3/ContradictionDetector.ts', name: 'Layer 3' },
      { file: 'src/lib/hallucination-prevention/layer3/FactChecker.ts', name: 'Layer 3' },
      { file: 'src/lib/hallucination-prevention/layer4/PersonalizationEngine.ts', name: 'Layer 4' },
      { file: 'src/lib/hallucination-prevention/layer4/FeedbackCollector.ts', name: 'Layer 4' },
      { file: 'src/lib/hallucination-prevention/layer4/PatternRecognizer.ts', name: 'Layer 4' },
      { file: 'src/lib/layer5/orchestration-engine.ts', name: 'Layer 5' },
      { file: 'src/lib/layer5/performance-optimizer.ts', name: 'Layer 5' },
      { file: 'src/lib/layer5/real-time-monitor.ts', name: 'Layer 5' }
    ];

    for (const layer of layers) {
      await this.validateFile(layer.file, layer.name, [
        'exports', 'classes', 'core functionality'
      ]);
    }
  }

  private async validatePersonalizationSystemFiles(): Promise<void> {
    console.log('🔍 Validating Personalization System Files...');
    
    const files = [
      'src/lib/ai/advanced-personalization-engine.ts',
      'src/lib/ai/personalization-detection-engine.ts',
      'src/lib/hallucination-prevention/layer4/PersonalizationEngine.ts'
    ];

    for (const file of files) {
      await this.validateFile(file, 'Personalization System', [
        'user analysis', 'pattern recognition', 'adaptation logic'
      ]);
    }
  }

  private async validateCentralizedSystemFiles(): Promise<void> {
    console.log('🔍 Validating Centralized System Files...');
    
    const files = [
      'src/lib/ai/centralized-service-integration.ts',
      'src/lib/ai/ai-service-manager-unified.ts'
    ];

    for (const file of files) {
      await this.validateFile(file, 'Centralized System', [
        'service orchestration', 'pipeline management', 'system coordination'
      ]);
    }
  }

  private async validateFile(filePath: string, component: string, integrationPoints: string[]): Promise<void> {
    try {
      const fullPath = path.resolve(filePath);
      const stats = await fs.stat(fullPath);
      
      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Check for exports
      const hasExports = content.includes('export') || content.includes('module.exports');
      
      // Check for classes
      const hasClasses = content.includes('class ');
      
      // Count integration points found
      const foundPoints = integrationPoints.filter(point => 
        content.toLowerCase().includes(point.toLowerCase())
      ).length;

      const result: FileValidationResult = {
        component,
        file: path.basename(filePath),
        status: 'EXISTS',
        size: stats.size,
        hasExports,
        hasClasses,
        integrationPoints: foundPoints > 0 ? [`${foundPoints}/${integrationPoints.length} points found`] : []
      };

      this.results.push(result);
      console.log(`  ✅ ${result.file}: ${result.size} bytes, ${hasExports ? 'exports' : 'no exports'}, ${hasClasses ? 'classes' : 'no classes'}`);

    } catch (error) {
      const result: FileValidationResult = {
        component,
        file: path.basename(filePath),
        status: 'MISSING',
        size: 0,
        hasExports: false,
        hasClasses: false,
        integrationPoints: []
      };

      this.results.push(result);
      console.log(`  ❌ ${result.file}: MISSING`);
    }
  }

  private generateFileStructureReport() {
    const totalFiles = this.results.length;
    const existingFiles = this.results.filter(r => r.status === 'EXISTS').length;
    const missingFiles = this.results.filter(r => r.status === 'MISSING').length;
    
    // Calculate integration health based on existing files that have exports and classes
    const healthyFiles = this.results.filter(r => 
      r.status === 'EXISTS' && r.hasExports && r.hasClasses
    ).length;
    
    const integrationHealth = totalFiles > 0 ? (healthyFiles / existingFiles) * 100 : 0;

    // Determine overall status
    let overall: 'PASS' | 'FAIL' | 'PARTIAL' = 'PASS';
    if (missingFiles > totalFiles * 0.3) {
      overall = 'FAIL';
    } else if (missingFiles > 0) {
      overall = 'PARTIAL';
    }

    console.log('📊 File Structure Validation Summary:');
    console.log('====================================');
    console.log(`Overall Status: ${overall}`);
    console.log(`Total Files Checked: ${totalFiles}`);
    console.log(`Existing Files: ${existingFiles} (${(existingFiles/totalFiles*100).toFixed(1)}%)`);
    console.log(`Missing Files: ${missingFiles} (${(missingFiles/totalFiles*100).toFixed(1)}%)`);
    console.log(`Integration Health: ${integrationHealth.toFixed(1)}%`);
    
    // Component breakdown
    console.log('\nComponent Status:');
    const componentStats = this.groupResultsByComponent();
    for (const [component, stats] of Object.entries(componentStats)) {
      console.log(`  ${component}: ${stats.existing}/${stats.total} files (${(stats.existing/stats.total*100).toFixed(1)}%)`);
    }
    
    console.log('====================================\n');

    return {
      overall,
      results: this.results,
      summary: {
        totalFiles,
        existingFiles,
        missingFiles,
        integrationHealth
      }
    };
  }

  private groupResultsByComponent() {
    const componentGroups: Record<string, { total: number; existing: number; missing: number }> = {};
    
    for (const result of this.results) {
      if (!componentGroups[result.component]) {
        componentGroups[result.component] = { total: 0, existing: 0, missing: 0 };
      }
      
      componentGroups[result.component].total++;
      if (result.status === 'EXISTS') {
        componentGroups[result.component].existing++;
      } else {
        componentGroups[result.component].missing++;
      }
    }
    
    return componentGroups;
  }
}

// Export for use
export const advancedAIFileStructureValidator = new AdvancedAIFileStructureValidator();

// CLI execution
if (require.main === module) {
  advancedAIFileStructureValidator.runFileStructureValidation()
    .then(report => {
      console.log('\n🏁 Advanced AI File Structure Validation Complete!');
      console.log(`Overall Result: ${report.overall}`);
      console.log(`File Structure Health: ${report.summary.integrationHealth.toFixed(1)}%`);
      process.exit(report.overall === 'PASS' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ File structure validation failed:', error);
      process.exit(1);
    });
}