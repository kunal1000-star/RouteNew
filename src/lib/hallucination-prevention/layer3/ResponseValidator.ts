// Layer 3: Response Validator - Comprehensive Educational Content Validation
// ========================================================================

import type { 
  StudyBuddyHallucinationRequest, 
  StudyBuddyHallucinationResponse 
} from '../study-buddy-integration';

export interface ResponseValidationResult {
  isValid: boolean;
  validationScore: number; // 0-1 scale
  issues: ValidationIssue[];
  educationalContent: EducationalContentAnalysis;
  appropriatenessLevel: AppropriatenessLevel;
  qualityMetrics: QualityMetrics;
  recommendations: string[];
  warnings: string[];
}

export interface ValidationIssue {
  type: 'factual' | 'educational' | 'appropriateness' | 'quality' | 'safety';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion?: string;
  location?: {
    start: number;
    end: number;
    section?: string;
  };
}

export interface EducationalContentAnalysis {
  subjectClassification: string[];
  difficultyLevel: number; // 1-10 scale
  learningObjectives: string[];
  conceptsCovered: string[];
  prerequisites: string[];
  educationalValue: number; // 0-1 scale
  ageAppropriate: boolean;
  curriculumAlignment: CurriculumAlignment;
}

export interface CurriculumAlignment {
  standard: string;
  gradeLevel: string;
  subject: string;
  topic: string;
  alignmentScore: number; // 0-1 scale
}

export interface AppropriatenessLevel {
  ageGroup: 'elementary' | 'middle' | 'high_school' | 'college' | 'adult';
  contentRating: 'general' | 'teen' | 'mature';
  educationalLevel: 'beginner' | 'intermediate' | 'advanced';
  languageComplexity: 'simple' | 'moderate' | 'complex';
}

export interface QualityMetrics {
  clarity: number; // 0-1 scale
  accuracy: number; // 0-1 scale
  completeness: number; // 0-1 scale
  engagement: number; // 0-1 scale
  pedagogicalValue: number; // 0-1 scale
  sourceReliability: number; // 0-1 scale
  overallScore: number; // 0-1 scale
}

export class ResponseValidator {
  private readonly VALIDATION_THRESHOLDS = {
    MINIMUM_QUALITY: 0.6,
    MINIMUM_EDUCATIONAL_VALUE: 0.4,
    MINIMUM_APPROPRIATENESS: 0.7,
    MAX_CRITICAL_ISSUES: 0
  };

  private readonly EDUCATIONAL_KEYWORDS = {
    mathematics: ['equation', 'formula', 'calculation', 'theorem', 'proof', 'algebra', 'geometry', 'calculus'],
    science: ['hypothesis', 'experiment', 'theory', 'law', 'principle', 'observation', 'data', 'analysis'],
    history: ['timeline', 'era', 'period', 'civilization', 'revolution', 'treaty', 'dynasty', 'empire'],
    literature: ['theme', 'character', 'plot', 'metaphor', 'symbolism', 'narrative', 'genre', 'style'],
    language: ['grammar', 'syntax', 'semantics', 'phonetics', 'morphology', 'etymology', 'dialect'],
    social_studies: ['government', 'economy', 'culture', 'society', 'politics', 'democracy', 'citizenship']
  };

  async validateResponse(
    response: string,
    originalRequest: StudyBuddyHallucinationRequest,
    context?: any
  ): Promise<ResponseValidationResult> {
    const startTime = Date.now();
    
    try {
      // Initialize validation result
      const validationResult: ResponseValidationResult = {
        isValid: true,
        validationScore: 0,
        issues: [],
        educationalContent: {
          subjectClassification: [],
          difficultyLevel: 5,
          learningObjectives: [],
          conceptsCovered: [],
          prerequisites: [],
          educationalValue: 0,
          ageAppropriate: true,
          curriculumAlignment: {
            standard: '',
            gradeLevel: '',
            subject: '',
            topic: '',
            alignmentScore: 0
          }
        },
        appropriatenessLevel: {
          ageGroup: 'high_school',
          contentRating: 'general',
          educationalLevel: 'intermediate',
          languageComplexity: 'moderate'
        },
        qualityMetrics: {
          clarity: 0,
          accuracy: 0,
          completeness: 0,
          engagement: 0,
          pedagogicalValue: 0,
          sourceReliability: 0,
          overallScore: 0
        },
        recommendations: [],
        warnings: []
      };

      // 1. Educational Content Analysis
      const educationalAnalysis = await this.analyzeEducationalContent(response, originalRequest);
      validationResult.educationalContent = educationalAnalysis;

      // 2. Appropriateness Assessment
      const appropriateness = await this.assessAppropriateness(response, originalRequest);
      validationResult.appropriatenessLevel = appropriateness;

      // 3. Quality Metrics Evaluation
      const qualityMetrics = await this.evaluateQualityMetrics(response, originalRequest, context);
      validationResult.qualityMetrics = qualityMetrics;

      // 4. Issue Detection
      const issues = await this.detectIssues(response, validationResult);
      validationResult.issues = issues;

      // 5. Generate Recommendations and Warnings
      const recommendations = this.generateRecommendations(validationResult);
      const warnings = this.generateWarnings(validationResult);
      validationResult.recommendations = recommendations;
      validationResult.warnings = warnings;

      // 6. Calculate Overall Validation Score
      validationResult.validationScore = this.calculateValidationScore(validationResult);

      // 7. Determine Final Validity
      validationResult.isValid = this.determineValidity(validationResult);

      const processingTime = Date.now() - startTime;
      console.log(`Response validation completed in ${processingTime}ms`);

      return validationResult;

    } catch (error) {
      console.error('Response validation error:', error);
      return this.createFallbackValidationResult(response, error);
    }
  }

  private async analyzeEducationalContent(
    response: string,
    request: StudyBuddyHallucinationRequest
  ): Promise<EducationalContentAnalysis> {
    const analysis: EducationalContentAnalysis = {
      subjectClassification: [],
      difficultyLevel: 5,
      learningObjectives: [],
      conceptsCovered: [],
      prerequisites: [],
      educationalValue: 0,
      ageAppropriate: true,
      curriculumAlignment: {
        standard: '',
        gradeLevel: request.academicLevel || 'high_school',
        subject: '',
        topic: '',
        alignmentScore: 0
      }
    };

    // Subject Classification
    analysis.subjectClassification = this.classifySubjects(response);

    // Difficulty Assessment
    analysis.difficultyLevel = this.assessDifficulty(response, request.academicLevel);

    // Learning Objectives Extraction
    analysis.learningObjectives = this.extractLearningObjectives(response);

    // Concepts Coverage
    analysis.conceptsCovered = this.identifyConcepts(response);

    // Prerequisites Identification
    analysis.prerequisites = this.identifyPrerequisites(response, analysis.conceptsCovered);

    // Educational Value Calculation
    analysis.educationalValue = this.calculateEducationalValue(response, analysis);

    // Age Appropriateness
    analysis.ageAppropriate = this.checkAgeAppropriateness(response, request.academicLevel);

    // Curriculum Alignment
    analysis.curriculumAlignment = this.assessCurriculumAlignment(response, analysis);

    return analysis;
  }

  private classifySubjects(response: string): string[] {
    const subjects: string[] = [];
    const lowerResponse = response.toLowerCase();

    for (const [subject, keywords] of Object.entries(this.EDUCATIONAL_KEYWORDS)) {
      const matches = keywords.filter(keyword => lowerResponse.includes(keyword));
      if (matches.length > 0) {
        subjects.push(subject);
      }
    }

    // Additional subject detection based on content patterns
    if (lowerResponse.includes('math') || lowerResponse.includes('number') || lowerResponse.includes('solve')) {
      subjects.push('mathematics');
    }
    if (lowerResponse.includes('history') || lowerResponse.includes('historical') || lowerResponse.includes('past')) {
      subjects.push('history');
    }
    if (lowerResponse.includes('science') || lowerResponse.includes('research') || lowerResponse.includes('study')) {
      subjects.push('science');
    }

    return [...new Set(subjects)]; // Remove duplicates
  }

  private assessDifficulty(response: string, academicLevel?: string): number {
    let difficulty = 5; // Default medium difficulty

    const complexityIndicators = {
      high: ['complex', 'advanced', 'sophisticated', 'comprehensive', 'detailed analysis'],
      medium: ['moderate', 'standard', 'typical', 'general'],
      low: ['simple', 'basic', 'elementary', 'introductory', 'fundamental']
    };

    const lowerResponse = response.toLowerCase();

    // Count complexity indicators
    let highCount = 0;
    let lowCount = 0;

    for (const indicator of complexityIndicators.high) {
      if (lowerResponse.includes(indicator)) highCount++;
    }
    for (const indicator of complexityIndicators.low) {
      if (lowerResponse.includes(indicator)) lowCount++;
    }

    // Adjust difficulty based on indicators
    if (highCount > lowCount) {
      difficulty = Math.min(10, difficulty + highCount);
    } else if (lowCount > highCount) {
      difficulty = Math.max(1, difficulty - lowCount);
    }

    // Adjust based on academic level
    if (academicLevel) {
      switch (academicLevel) {
        case 'elementary':
          difficulty = Math.max(1, difficulty - 3);
          break;
        case 'middle_school':
          difficulty = Math.max(2, difficulty - 1);
          break;
        case 'college':
          difficulty = Math.min(10, difficulty + 2);
          break;
        case 'graduate':
          difficulty = Math.min(10, difficulty + 3);
          break;
      }
    }

    return Math.max(1, Math.min(10, difficulty));
  }

  private extractLearningObjectives(response: string): string[] {
    const objectives: string[] = [];
    const lowerResponse = response.toLowerCase();

    // Common learning objective patterns
    const objectivePatterns = [
      /you will learn (?:about|how to|the basics of)\s+([^.]+)/gi,
      /this (?:helps|teaches|explains)\s+([^.]+)/gi,
      /by the end of this, you should be able to\s+([^.]+)/gi,
      /the goal is to\s+([^.]+)/gi,
      /we will cover\s+([^.]+)/gi
    ];

    for (const pattern of objectivePatterns) {
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const objective = match.replace(/^(you will learn|this helps|by the end of|we will cover|the goal is to)\s*/i, '').trim();
          if (objective && objective.length > 10) {
            objectives.push(objective);
          }
        });
      }
    }

    return [...new Set(objectives)]; // Remove duplicates
  }

  private identifyConcepts(response: string): string[] {
    const concepts: string[] = [];
    const lowerResponse = response.toLowerCase();

    // Educational concept indicators
    const conceptIndicators = [
      'definition', 'concept', 'principle', 'theory', 'law', 'rule',
      'method', 'process', 'system', 'structure', 'pattern', 'relationship',
      'factor', 'element', 'component', 'aspect', 'characteristic'
    ];

    for (const indicator of conceptIndicators) {
      if (lowerResponse.includes(indicator)) {
        // Extract context around the indicator
        const regex = new RegExp(`([^.]*${indicator}[^.]*)`, 'gi');
        const matches = response.match(regex);
        if (matches) {
          matches.forEach(match => {
            const cleanMatch = match.trim();
            if (cleanMatch.length > 10 && cleanMatch.length < 100) {
              concepts.push(cleanMatch);
            }
          });
        }
      }
    }

    return [...new Set(concepts)].slice(0, 10); // Limit to 10 concepts
  }

  private identifyPrerequisites(response: string, concepts: string[]): string[] {
    const prerequisites: string[] = [];
    const lowerResponse = response.toLowerCase();

    // Common prerequisite indicators
    const prerequisitePatterns = [
      /you should (?:know|understand|be familiar with)\s+([^.]+)/gi,
      /prerequisites?:\s*([^.]+)/gi,
      /before (?:learning|studying), you need to know\s+([^.]+)/gi,
      /this builds on\s+([^.]+)/gi,
      /assuming you know\s+([^.]+)/gi
    ];

    for (const pattern of prerequisitePatterns) {
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const prerequisite = match.replace(/^(you should know|prerequisites?|before learning|this builds on|assuming you know)\s*/i, '').trim();
          if (prerequisite && prerequisite.length > 5) {
            prerequisites.push(prerequisite);
          }
        });
      }
    }

    return [...new Set(prerequisites)].slice(0, 5); // Limit to 5 prerequisites
  }

  private calculateEducationalValue(response: string, analysis: EducationalContentAnalysis): number {
    let value = 0.5; // Base educational value

    // Increase value based on subject classification
    value += analysis.subjectClassification.length * 0.1;

    // Increase value based on learning objectives
    value += analysis.learningObjectives.length * 0.05;

    // Increase value based on concepts covered
    value += analysis.conceptsCovered.length * 0.03;

    // Increase value for structured content
    if (response.includes('step') || response.includes('process') || response.includes('method')) {
      value += 0.1;
    }

    // Increase value for examples and explanations
    if (response.includes('example') || response.includes('for instance') || response.includes('such as')) {
      value += 0.1;
    }

    // Decrease value for overly complex or unclear content
    if (analysis.difficultyLevel > 8 && analysis.learningObjectives.length === 0) {
      value -= 0.2;
    }

    return Math.max(0, Math.min(1, value));
  }

  private checkAgeAppropriateness(response: string, academicLevel?: string): boolean {
    const lowerResponse = response.toLowerCase();

    // Inappropriate content indicators
    const inappropriateContent = [
      'violence', 'weapons', 'drugs', 'alcohol', 'tobacco', 'adult content',
      'mature themes', 'sexual content', 'gambling', 'gore'
    ];

    for (const content of inappropriateContent) {
      if (lowerResponse.includes(content)) {
        return false;
      }
    }

    // Check language complexity vs academic level
    const complexityScore = this.assessLanguageComplexity(response);
    
    if (academicLevel) {
      switch (academicLevel) {
        case 'elementary':
          return complexityScore <= 3;
        case 'middle_school':
          return complexityScore <= 5;
        case 'high_school':
          return complexityScore <= 7;
        case 'college':
        case 'graduate':
          return true; // Assume appropriate for higher education
        default:
          return complexityScore <= 6;
      }
    }

    return complexityScore <= 6; // Default threshold
  }

  private assessLanguageComplexity(response: string): number {
    let complexity = 1;

    // Count sentence length (longer sentences = higher complexity)
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    if (avgSentenceLength > 20) complexity += 2;
    else if (avgSentenceLength > 15) complexity += 1;

    // Count technical terms
    const technicalTerms = response.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    complexity += Math.min(3, technicalTerms.length * 0.5);

    // Count complex words (more than 3 syllables)
    const complexWords = response.match(/\b\w{8,}\b/g) || [];
    complexity += Math.min(2, complexWords.length * 0.3);

    return Math.min(10, complexity);
  }

  private assessCurriculumAlignment(response: string, analysis: EducationalContentAnalysis): CurriculumAlignment {
    const alignment: CurriculumAlignment = {
      standard: 'general',
      gradeLevel: 'high_school',
      subject: analysis.subjectClassification[0] || 'general',
      topic: '',
      alignmentScore: 0.5
    };

    // Extract topic from content
    const topicMatches = response.match(/\b(?:about|regarding|concerning|on)\s+([^.]+)/gi);
    if (topicMatches && topicMatches.length > 0) {
      alignment.topic = topicMatches[0].replace(/^(about|regarding|concerning|on)\s+/i, '').trim();
    }

    // Calculate alignment score based on subject classification and educational value
    alignment.alignmentScore = Math.min(1, 
      (analysis.subjectClassification.length * 0.2) + 
      (analysis.educationalValue * 0.6) + 
      (analysis.learningObjectives.length * 0.1) +
      (analysis.conceptsCovered.length * 0.1)
    );

    return alignment;
  }

  private async assessAppropriateness(
    response: string,
    request: StudyBuddyHallucinationRequest
  ): Promise<AppropriatenessLevel> {
    const appropriateness: AppropriatenessLevel = {
      ageGroup: this.determineAgeGroup(request.academicLevel),
      contentRating: 'general',
      educationalLevel: this.determineEducationalLevel(response),
      languageComplexity: this.determineLanguageComplexity(response)
    };

    // Determine content rating
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes('mature') || lowerResponse.includes('complex') || lowerResponse.includes('advanced')) {
      appropriateness.contentRating = 'mature';
    } else if (lowerResponse.includes('teen') || lowerResponse.includes('adolescent')) {
      appropriateness.contentRating = 'teen';
    }

    return appropriateness;
  }

  private determineAgeGroup(academicLevel?: string): AppropriatenessLevel['ageGroup'] {
    switch (academicLevel) {
      case 'elementary':
        return 'elementary';
      case 'middle_school':
        return 'middle';
      case 'high_school':
        return 'high_school';
      case 'college':
      case 'graduate':
        return 'college';
      default:
        return 'high_school';
    }
  }

  private determineEducationalLevel(response: string): AppropriatenessLevel['educationalLevel'] {
    const complexity = this.assessLanguageComplexity(response);
    
    if (complexity <= 3) return 'beginner';
    if (complexity <= 6) return 'intermediate';
    return 'advanced';
  }

  private determineLanguageComplexity(response: string): AppropriatenessLevel['languageComplexity'] {
    const complexity = this.assessLanguageComplexity(response);
    
    if (complexity <= 3) return 'simple';
    if (complexity <= 6) return 'moderate';
    return 'complex';
  }

  private async evaluateQualityMetrics(
    response: string,
    request: StudyBuddyHallucinationRequest,
    context?: any
  ): Promise<QualityMetrics> {
    const metrics: QualityMetrics = {
      clarity: this.assessClarity(response),
      accuracy: this.assessAccuracy(response, context),
      completeness: this.assessCompleteness(response, request),
      engagement: this.assessEngagement(response),
      pedagogicalValue: this.assessPedagogicalValue(response),
      sourceReliability: this.assessSourceReliability(response, context),
      overallScore: 0
    };

    // Calculate overall score as weighted average
    metrics.overallScore = (
      metrics.clarity * 0.2 +
      metrics.accuracy * 0.25 +
      metrics.completeness * 0.2 +
      metrics.engagement * 0.15 +
      metrics.pedagogicalValue * 0.15 +
      metrics.sourceReliability * 0.05
    );

    return metrics;
  }

  private assessClarity(response: string): number {
    let clarity = 0.5;

    // Positive indicators
    const positiveIndicators = [
      'clearly', 'simply', 'basically', 'in other words', 'to put it simply',
      'step by step', 'first', 'second', 'finally', 'in conclusion'
    ];

    const lowerResponse = response.toLowerCase();
    const positiveCount = positiveIndicators.filter(indicator => lowerResponse.includes(indicator)).length;
    clarity += positiveCount * 0.1;

    // Negative indicators
    const negativeIndicators = [
      'confusing', 'unclear', 'complicated', 'difficult to understand',
      'hard to follow', 'complex', 'sophisticated'
    ];

    const negativeCount = negativeIndicators.filter(indicator => lowerResponse.includes(indicator)).length;
    clarity -= negativeCount * 0.15;

    // Sentence structure assessment
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    if (avgSentenceLength > 25) clarity -= 0.2;
    else if (avgSentenceLength < 10) clarity += 0.1;

    return Math.max(0, Math.min(1, clarity));
  }

  private assessAccuracy(response: string, context?: any): number {
    let accuracy = 0.7; // Base accuracy assumption

    // Check for hedging language (indicates uncertainty)
    const hedgingWords = ['might', 'could', 'possibly', 'perhaps', 'maybe', 'likely', 'probably'];
    const lowerResponse = response.toLowerCase();
    
    const hedgingCount = hedgingWords.filter(word => lowerResponse.includes(word)).length;
    if (hedgingCount > 3) accuracy -= 0.2;

    // Check for definitive statements (higher accuracy)
    const definitiveWords = ['definitely', 'certainly', 'absolutely', 'clearly', 'obviously'];
    const definitiveCount = definitiveWords.filter(word => lowerResponse.includes(word)).length;
    if (definitiveCount > 0) accuracy += 0.1;

    // Check for source citations
    if (lowerResponse.includes('according to') || lowerResponse.includes('source:') || lowerResponse.includes('reference:')) {
      accuracy += 0.15;
    }

    return Math.max(0, Math.min(1, accuracy));
  }

  private assessCompleteness(response: string, request: StudyBuddyHallucinationRequest): number {
    let completeness = 0.6;

    // Check if response addresses the question type
    const questionType = request.messageType;
    const lowerResponse = response.toLowerCase();

    switch (questionType) {
      case 'explanation_request':
        if (lowerResponse.includes('explain') || lowerResponse.includes('definition') || lowerResponse.includes('what is')) {
          completeness += 0.2;
        }
        break;
      case 'practice':
        if (lowerResponse.includes('example') || lowerResponse.includes('exercise') || lowerResponse.includes('practice')) {
          completeness += 0.2;
        }
        break;
      case 'doubt':
        if (lowerResponse.includes('help') || lowerResponse.includes('solution') || lowerResponse.includes('answer')) {
          completeness += 0.2;
        }
        break;
    }

    // Check for conclusion or summary
    if (lowerResponse.includes('in conclusion') || lowerResponse.includes('summary') || lowerResponse.includes('to summarize')) {
      completeness += 0.1;
    }

    // Check response length (longer responses tend to be more complete)
    const wordCount = response.split(' ').length;
    if (wordCount > 100) completeness += 0.1;
    else if (wordCount < 20) completeness -= 0.2;

    return Math.max(0, Math.min(1, completeness));
  }

  private assessEngagement(response: string): number {
    let engagement = 0.5;

    const lowerResponse = response.toLowerCase();

    // Interactive elements
    const interactiveWords = ['you', 'your', 'let\'s', 'try', 'practice', 'exercise'];
    const interactiveCount = interactiveWords.filter(word => lowerResponse.includes(word)).length;
    engagement += interactiveCount * 0.05;

    // Encouraging language
    const encouragingWords = ['great', 'excellent', 'good job', 'well done', 'keep going', 'you can'];
    const encouragingCount = encouragingWords.filter(word => lowerResponse.includes(word)).length;
    engagement += encouragingCount * 0.08;

    // Questions to engage thinking
    const questionCount = (response.match(/\?/g) || []).length;
    engagement += Math.min(0.2, questionCount * 0.05);

    return Math.max(0, Math.min(1, engagement));
  }

  private assessPedagogicalValue(response: string): number {
    let pedagogicalValue = 0.5;

    const lowerResponse = response.toLowerCase();

    // Teaching indicators
    const teachingWords = ['teach', 'learn', 'understand', 'explain', 'demonstrate', 'show'];
    const teachingCount = teachingWords.filter(word => lowerResponse.includes(word)).length;
    pedagogicalValue += teachingCount * 0.1;

    // Step-by-step instruction
    if (lowerResponse.includes('step') || lowerResponse.includes('first') || lowerResponse.includes('then')) {
      pedagogicalValue += 0.15;
    }

    // Examples and illustrations
    if (lowerResponse.includes('example') || lowerResponse.includes('for instance') || lowerResponse.includes('such as')) {
      pedagogicalValue += 0.1;
    }

    // Memory aids
    if (lowerResponse.includes('remember') || lowerResponse.includes('note that') || lowerResponse.includes('important')) {
      pedagogicalValue += 0.1;
    }

    return Math.max(0, Math.min(1, pedagogicalValue));
  }

  private assessSourceReliability(response: string, context?: any): number {
    let reliability = 0.6; // Base reliability

    const lowerResponse = response.toLowerCase();

    // Source citations increase reliability
    if (lowerResponse.includes('according to') || lowerResponse.includes('source:') || lowerResponse.includes('reference:')) {
      reliability += 0.2;
    }

    // Academic language increases reliability
    const academicWords = ['research', 'study', 'evidence', 'data', 'analysis', 'theory'];
    const academicCount = academicWords.filter(word => lowerResponse.includes(word)).length;
    reliability += academicCount * 0.05;

    // Avoid overly confident statements without sources
    if (lowerResponse.includes('definitely') || lowerResponse.includes('absolutely') && 
        !lowerResponse.includes('according to') && !lowerResponse.includes('research')) {
      reliability -= 0.1;
    }

    return Math.max(0, Math.min(1, reliability));
  }

  private async detectIssues(
    response: string,
    validationResult: ResponseValidationResult
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Check educational value
    if (validationResult.educationalContent.educationalValue < this.VALIDATION_THRESHOLDS.MINIMUM_EDUCATIONAL_VALUE) {
      issues.push({
        type: 'educational',
        severity: 'medium',
        description: 'Low educational value detected',
        suggestion: 'Include more learning objectives and concepts'
      });
    }

    // Check appropriateness
    if (!validationResult.educationalContent.ageAppropriate) {
      issues.push({
        type: 'appropriateness',
        severity: 'high',
        description: 'Content may not be age-appropriate',
        suggestion: 'Adjust language complexity and content for target age group'
      });
    }

    // Check quality metrics
    if (validationResult.qualityMetrics.clarity < 0.4) {
      issues.push({
        type: 'quality',
        severity: 'medium',
        description: 'Low clarity score',
        suggestion: 'Use simpler language and clearer explanations'
      });
    }

    if (validationResult.qualityMetrics.accuracy < 0.5) {
      issues.push({
        type: 'factual',
        severity: 'high',
        description: 'Potential accuracy issues',
        suggestion: 'Verify facts and include sources'
      });
    }

    // Check for safety issues
    const safetyIssues = this.detectSafetyIssues(response);
    issues.push(...safetyIssues);

    return issues;
  }

  private detectSafetyIssues(response: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lowerResponse = response.toLowerCase();

    // Dangerous content
    const dangerousContent = [
      'how to make weapons', 'how to build bombs', 'how to hack', 'illegal activities',
      'harmful substances', 'dangerous experiments', 'self-harm', 'suicide'
    ];

    for (const content of dangerousContent) {
      if (lowerResponse.includes(content)) {
        issues.push({
          type: 'safety',
          severity: 'critical',
          description: `Potentially dangerous content detected: ${content}`,
          suggestion: 'Remove or redirect to safe alternatives'
        });
      }
    }

    return issues;
  }

  private generateRecommendations(validationResult: ResponseValidationResult): string[] {
    const recommendations: string[] = [];

    // Educational content recommendations
    if (validationResult.educationalContent.learningObjectives.length === 0) {
      recommendations.push('Add clear learning objectives to improve educational value');
    }

    if (validationResult.educationalContent.conceptsCovered.length < 2) {
      recommendations.push('Include more key concepts and definitions');
    }

    // Quality recommendations
    if (validationResult.qualityMetrics.clarity < 0.7) {
      recommendations.push('Improve clarity by using simpler language and clearer structure');
    }

    if (validationResult.qualityMetrics.engagement < 0.6) {
      recommendations.push('Add interactive elements and encouraging language');
    }

    // Appropriateness recommendations
    if (validationResult.appropriatenessLevel.languageComplexity === 'complex' && 
        validationResult.appropriatenessLevel.ageGroup === 'elementary') {
      recommendations.push('Simplify language for elementary level students');
    }

    return recommendations;
  }

  private generateWarnings(validationResult: ResponseValidationResult): string[] {
    const warnings: string[] = [];

    // Critical issues
    const criticalIssues = validationResult.issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      warnings.push(`Critical issues detected: ${criticalIssues.length} safety or appropriateness concerns`);
    }

    // High severity issues
    const highSeverityIssues = validationResult.issues.filter(issue => issue.severity === 'high');
    if (highSeverityIssues.length > 0) {
      warnings.push(`High severity issues: ${highSeverityIssues.length} accuracy or appropriateness concerns`);
    }

    // Quality warnings
    if (validationResult.qualityMetrics.overallScore < this.VALIDATION_THRESHOLDS.MINIMUM_QUALITY) {
      warnings.push('Overall quality score below recommended threshold');
    }

    // Educational value warning
    if (validationResult.educationalContent.educationalValue < 0.3) {
      warnings.push('Very low educational value - consider restructuring content');
    }

    return warnings;
  }

  private calculateValidationScore(validationResult: ResponseValidationResult): number {
    let score = 0;

    // Base score from quality metrics
    score += validationResult.qualityMetrics.overallScore * 0.4;

    // Educational value contribution
    score += validationResult.educationalContent.educationalValue * 0.3;

    // Appropriateness contribution
    score += (validationResult.educationalContent.ageAppropriate ? 1 : 0) * 0.2;

    // Penalty for issues
    const issuePenalty = validationResult.issues.reduce((penalty, issue) => {
      switch (issue.severity) {
        case 'critical': return penalty + 0.3;
        case 'high': return penalty + 0.2;
        case 'medium': return penalty + 0.1;
        case 'low': return penalty + 0.05;
        default: return penalty;
      }
    }, 0);

    score = Math.max(0, score - issuePenalty);

    return Math.min(1, score);
  }

  private determineValidity(validationResult: ResponseValidationResult): boolean {
    // Must pass all critical checks
    const criticalIssues = validationResult.issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > this.VALIDATION_THRESHOLDS.MAX_CRITICAL_ISSUES) {
      return false;
    }

    // Must meet minimum quality threshold
    if (validationResult.validationScore < this.VALIDATION_THRESHOLDS.MINIMUM_QUALITY) {
      return false;
    }

    // Must be age appropriate
    if (!validationResult.educationalContent.ageAppropriate) {
      return false;
    }

    // Must have minimum educational value
    if (validationResult.educationalContent.educationalValue < this.VALIDATION_THRESHOLDS.MINIMUM_EDUCATIONAL_VALUE) {
      return false;
    }

    return true;
  }

  private createFallbackValidationResult(response: string, error: any): ResponseValidationResult {
    return {
      isValid: true, // Fail-open for basic functionality
      validationScore: 0.5,
      issues: [{
        type: 'quality',
        severity: 'low',
        description: 'Validation service temporarily unavailable',
        suggestion: 'Manual review recommended'
      }],
      educationalContent: {
        subjectClassification: [],
        difficultyLevel: 5,
        learningObjectives: [],
        conceptsCovered: [],
        prerequisites: [],
        educationalValue: 0.5,
        ageAppropriate: true,
        curriculumAlignment: {
          standard: '',
          gradeLevel: 'high_school',
          subject: '',
          topic: '',
          alignmentScore: 0.5
        }
      },
      appropriatenessLevel: {
        ageGroup: 'high_school',
        contentRating: 'general',
        educationalLevel: 'intermediate',
        languageComplexity: 'moderate'
      },
      qualityMetrics: {
        clarity: 0.5,
        accuracy: 0.5,
        completeness: 0.5,
        engagement: 0.5,
        pedagogicalValue: 0.5,
        sourceReliability: 0.5,
        overallScore: 0.5
      },
      recommendations: ['Validation service unavailable - manual review recommended'],
      warnings: [`Validation error: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}