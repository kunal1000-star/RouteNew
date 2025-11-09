"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Users,
  BarChart3,
  Eye,
  Star,
  Play
} from 'lucide-react';
import { HallucinationPreventionProvider } from '@/contexts/HallucinationPreventionContext';
import QualityAssurancePanel from './QualityAssurancePanel';
import LayerStatusIndicators from './LayerStatusIndicators';
import QualityMetricsDisplay from './QualityMetricsDisplay';
import ConfidenceRiskIndicators from './ConfidenceRiskIndicators';
import SystemHealthDashboard from './SystemHealthDashboard';
import LearningInsightsPanel from './LearningInsightsPanel';
import UserFeedbackCollection from './UserFeedbackCollection';
import { QualityMetrics, SystemHealth, LearningInsights } from '@/contexts/HallucinationPreventionContext';
import { cn } from '@/lib/utils';

interface DemoResponse {
  id: string;
  text: string;
  qualityScore: number;
  confidence: number;
  hallucinationRisk: 'low' | 'medium' | 'high';
  factCheckStatus: 'verified' | 'unverified' | 'disputed';
  educationalEffectiveness: number;
  userSatisfaction: number;
}

export const HallucinationPreventionDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState('overview');
  const [selectedResponse, setSelectedResponse] = useState<DemoResponse | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Mock data for demonstration
  const mockResponses: DemoResponse[] = [
    {
      id: 'response-1',
      text: 'The photosynthesis process occurs in plant cells where chlorophyll absorbs sunlight and converts CO2 and water into glucose and oxygen. This process typically takes place in the chloroplasts.',
      qualityScore: 0.92,
      confidence: 0.89,
      hallucinationRisk: 'low',
      factCheckStatus: 'verified',
      educationalEffectiveness: 0.87,
      userSatisfaction: 4.2
    },
    {
      id: 'response-2', 
      text: 'In quantum mechanics, particles can exist in multiple states simultaneously through a phenomenon called wave-particle duality. This was first observed in the famous double-slit experiment.',
      qualityScore: 0.78,
      confidence: 0.65,
      hallucinationRisk: 'medium',
      factCheckStatus: 'unverified',
      educationalEffectiveness: 0.72,
      userSatisfaction: 3.1
    },
    {
      id: 'response-3',
      text: 'The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c².',
      qualityScore: 0.95,
      confidence: 0.94,
      hallucinationRisk: 'low',
      factCheckStatus: 'verified',
      educationalEffectiveness: 0.91,
      userSatisfaction: 4.8
    }
  ];

  const mockQualityMetrics: QualityMetrics = {
    overall: 0.87,
    factual: 0.92,
    logical: 0.85,
    complete: 0.88,
    consistent: 0.91,
    confidence: 0.89,
    hallucinationRisk: 'low',
    factCheckStatus: 'verified',
    educationalEffectiveness: 0.85,
    userSatisfaction: 4.2,
  };

  const mockSystemHealth: SystemHealth = {
    status: 'healthy',
    latency: 850,
    uptime: 172800,
    providerHealth: {
      groq: true,
      cerebras: true,
      mistral: false,
      openrouter: true,
      gemini: true,
      cohere: false
    },
    processingQueue: 3,
    activeAlerts: [
      {
        id: 'alert-1',
        severity: 'low',
        message: 'Minor latency increase detected in Layer 3 processing',
        timestamp: new Date(),
        resolved: false
      }
    ]
  };

  const mockLearningInsights: LearningInsights = {
    totalInteractions: 47,
    accuracyTrend: 0.08,
    improvementAreas: ['Thermodynamics', 'Integration Techniques', 'Organic Chemistry'],
    personalizedRecommendations: [
      'Focus on visual learning for physics concepts',
      'Practice integration by parts with worked examples',
      'Review reaction mechanisms with interactive diagrams'
    ],
    lastUpdated: new Date()
  };

  const startDemo = () => {
    setDemoStep(0);
    setActiveDemo('overview');
    setSelectedResponse(mockResponses[0]);
  };

  const nextDemoStep = () => {
    if (demoStep < 4) {
      setDemoStep(demoStep + 1);
      if (demoStep === 0) setActiveDemo('processing');
      else if (demoStep === 1) setActiveDemo('quality');
      else if (demoStep === 2) setActiveDemo('feedback');
      else if (demoStep === 3) setActiveDemo('insights');
    }
  };

  const demoSteps = [
    '1. Input Validation & Processing',
    '2. Quality Assessment',
    '3. User Feedback Collection',
    '4. Learning Insights',
    '5. System Health Monitoring'
  ];

  return (
    <HallucinationPreventionProvider>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">5-Layer Hallucination Prevention System</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the complete transparent 5-layer hallucination prevention system with real-time quality monitoring, 
            educational effectiveness tracking, and continuous learning capabilities.
          </p>
          
          {!activeDemo && (
            <Button onClick={startDemo} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Interactive Demo
            </Button>
          )}
        </div>

        {/* Demo Progress */}
        {activeDemo && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Demo Progress</h3>
                <p className="text-sm text-muted-foreground">Step {demoStep + 1} of 5: {demoSteps[demoStep]}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveDemo('')}>
                  Exit Demo
                </Button>
                {demoStep < 4 && (
                  <Button onClick={nextDemoStep}>
                    Next Step
                  </Button>
                )}
              </div>
            </div>
            
            {/* Progress indicators */}
            <div className="flex items-center gap-2 mt-4">
              {demoSteps.map((step, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
                    index <= demoStep 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {index < demoStep ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <div className="h-3 w-3 rounded-full border-2 border-current" />
                  )}
                  {step}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Demo Content */}
        {activeDemo && (
          <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* System Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    5-Layer Architecture
                  </h3>
                  
                  <div className="space-y-3">
                    {[
                      { 
                        layer: 'Layer 1: Input Validation', 
                        description: 'Sanitizes inputs, classifies queries, prevents prompt injection',
                        color: 'bg-blue-100 text-blue-700 border-blue-200'
                      },
                      { 
                        layer: 'Layer 2: Context Grounding', 
                        description: 'Enhances context, integrates knowledge, manages memory',
                        color: 'bg-green-100 text-green-700 border-green-200'
                      },
                      { 
                        layer: 'Layer 3: Response Validation', 
                        description: 'Validates responses, fact-checks, scores confidence',
                        color: 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      },
                      { 
                        layer: 'Layer 4: User Feedback', 
                        description: 'Collects feedback, learns from interactions, personalizes',
                        color: 'bg-purple-100 text-purple-700 border-purple-200'
                      },
                      { 
                        layer: 'Layer 5: Quality Assurance', 
                        description: 'Monitors system health, tracks quality, ensures compliance',
                        color: 'bg-red-100 text-red-700 border-red-200'
                      }
                    ].map((item, index) => (
                      <div key={index} className={cn("p-3 rounded-lg border", item.color)}>
                        <div className="font-medium text-sm">{item.layer}</div>
                        <div className="text-xs mt-1 opacity-80">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Key Features
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Real-time quality monitoring</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Transparent processing status</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Educational effectiveness tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">User feedback collection</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Personalized learning insights</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">System health monitoring</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Response Examples */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Response Quality Examples
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mockResponses.map((response) => (
                    <div
                      key={response.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedResponse(response)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          Quality: {Math.round(response.qualityScore * 100)}%
                        </Badge>
                        <Badge variant={response.hallucinationRisk === 'low' ? 'default' : 'secondary'}>
                          {response.hallucinationRisk} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {response.text}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{response.userSatisfaction}/5.0</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="processing" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Real-time Layer Processing Status</h3>
                <LayerStatusIndicators showDetails />
              </Card>
            </TabsContent>

            <TabsContent value="quality" className="space-y-6">
              {selectedResponse ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <QualityMetricsDisplay 
                    metrics={mockQualityMetrics}
                    showEducationalEffectiveness
                  />
                  <ConfidenceRiskIndicators
                    confidence={selectedResponse.confidence}
                    hallucinationRisk={selectedResponse.hallucinationRisk}
                    factCheckStatus={selectedResponse.factCheckStatus}
                    showDetailedBreakdown
                    interactive
                  />
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">Select a response to view quality metrics</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">User Feedback Collection</h3>
                <Button 
                  onClick={() => setShowFeedbackModal(true)}
                  className="mb-4"
                >
                  Open Feedback Collection Modal
                </Button>
                
                {selectedResponse && (
                  <UserFeedbackCollection
                    responseId={selectedResponse.id}
                    responseText={selectedResponse.text}
                    qualityScore={selectedResponse.qualityScore}
                    onSubmit={(feedback) => console.log('Feedback submitted:', feedback)}
                    onClose={() => setShowFeedbackModal(false)}
                    isOpen={showFeedbackModal}
                  />
                )}
                
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Feedback Types</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Positive/Negative ratings</div>
                    <div>• Corrective feedback</div>
                    <div>• Issue reporting</div>
                    <div>• Educational value assessment</div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LearningInsightsPanel showDetailed />
                <SystemHealthDashboard />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Comprehensive Quality Assurance Panel */}
        {selectedResponse && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Complete Quality Assurance Dashboard
            </h3>
            <QualityAssurancePanel 
              showFullPanel={true}
              currentResponse={selectedResponse}
              onResponseFeedback={(feedback) => console.log('Comprehensive feedback:', feedback)}
            />
          </Card>
        )}

        {/* Features Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Implementation Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Core Components
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Context Provider with state management</li>
                <li>• Layer status indicators</li>
                <li>• Quality metrics display</li>
                <li>• Confidence & risk assessment</li>
                <li>• System health monitoring</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                User Experience
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Transparent processing visibility</li>
                <li>• Real-time quality feedback</li>
                <li>• Educational effectiveness tracking</li>
                <li>• User satisfaction monitoring</li>
                <li>• Personalized learning insights</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Benefits
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Reduced hallucination occurrences</li>
                <li>• Improved response accuracy</li>
                <li>• Enhanced user trust</li>
                <li>• Better educational outcomes</li>
                <li>• Continuous system improvement</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </HallucinationPreventionProvider>
  );
};

export default HallucinationPreventionDemo;