// AI Analysis service for file content using Gemini 2.0 Flash-Lite
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Analysis result interface
export interface FileAnalysisResult {
  topics: string[];
  concepts: string[];
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedStudyTime: number; // in minutes
  aiRecommendations: string[];
  keyInsights: string[];
  subject: string;
  keywords: string[];
  summary: string;
}

// Analyze extracted text content
export async function analyzeFileContent(
  text: string, 
  fileName: string, 
  fileType: string,
  userContext?: string
): Promise<FileAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-lite", // Updated to Gemini 2.0 Flash-Lite
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const prompt = `
Analyze this study material and provide a comprehensive analysis in JSON format.

File: ${fileName}
Type: ${fileType}
Content: ${text.substring(0, 4000)}...${text.length > 4000 ? ' [content truncated]' : ''}

${userContext ? `Student Context: ${userContext}` : ''}

Provide analysis in this exact JSON format:
{
  "topics": ["topic1", "topic2", "..."],
  "concepts": ["concept1", "concept2", "..."],
  "difficultyLevel": "Beginner|Intermediate|Advanced",
  "estimatedStudyTime": 120,
  "aiRecommendations": ["recommendation1", "recommendation2", "..."],
  "keyInsights": ["insight1", "insight2", "..."],
  "subject": "Physics|Chemistry|Mathematics|Biology|Other",
  "keywords": ["keyword1", "keyword2", "..."],
  "summary": "Brief summary of the material in 2-3 sentences"
}

Focus on:
1. Identify the main topics and concepts
2. Assess difficulty level based on complexity
3. Estimate realistic study time
4. Provide actionable study recommendations
5. Extract key learning insights
6. Classify into appropriate subject area
7. Generate a comprehensive summary
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const textResponse = response.text();
    
    // Extract JSON from response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const analysisData = JSON.parse(jsonMatch[0]);
    
    // Validate and format the result
    return {
      topics: analysisData.topics || [],
      concepts: analysisData.concepts || [],
      difficultyLevel: analysisData.difficultyLevel || 'Intermediate',
      estimatedStudyTime: analysisData.estimatedStudyTime || 60,
      aiRecommendations: analysisData.aiRecommendations || [],
      keyInsights: analysisData.keyInsights || [],
      subject: analysisData.subject || 'Other',
      keywords: analysisData.keywords || [],
      summary: analysisData.summary || 'Analysis could not be completed.'
    };
  } catch (error) {
    console.error('Error analyzing file content:', error);
    throw new Error('Failed to analyze file content');
  }
}

// Analyze image content using Gemini Vision
export async function analyzeImageContent(
  imageBuffer: Buffer, 
  fileName: string,
  userContext?: string
): Promise<FileAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-lite", 
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');

    const prompt = `
Analyze this image which appears to be educational content. ${userContext ? `Student Context: ${userContext}` : ''}

Provide analysis in this exact JSON format:
{
  "topics": ["topic1", "topic2", "..."],
  "concepts": ["concept1", "concept2", "..."],
  "difficultyLevel": "Beginner|Intermediate|Advanced",
  "estimatedStudyTime": 120,
  "aiRecommendations": ["recommendation1", "recommendation2", "..."],
  "keyInsights": ["insight1", "insight2", "..."],
  "subject": "Physics|Chemistry|Mathematics|Biology|Other",
  "keywords": ["keyword1", "keyword2", "..."],
  "summary": "Brief summary of the visual content in 2-3 sentences"
}

Focus on:
1. What educational content is shown (text, diagrams, equations, etc.)
2. Identify the subject area and topics
3. Assess the complexity and difficulty
4. Provide study recommendations
5. Extract key learning points
`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const textResponse = response.text();
    
    // Extract JSON from response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const analysisData = JSON.parse(jsonMatch[0]);
    
    return {
      topics: analysisData.topics || [],
      concepts: analysisData.concepts || [],
      difficultyLevel: analysisData.difficultyLevel || 'Intermediate',
      estimatedStudyTime: analysisData.estimatedStudyTime || 60,
      aiRecommendations: analysisData.aiRecommendations || [],
      keyInsights: analysisData.keyInsights || [],
      subject: analysisData.subject || 'Other',
      keywords: analysisData.keywords || [],
      summary: analysisData.summary || 'Image analysis could not be completed.'
    };
  } catch (error) {
    console.error('Error analyzing image content:', error);
    throw new Error('Failed to analyze image content');
  }
}

// Get student context for personalized analysis
export async function getStudentContext(userId: string): Promise<string | null> {
  try {
    // This would typically query the database for student profile
    // For now, return null to use general analysis
    return null;
  } catch (error) {
    console.error('Error getting student context:', error);
    return null;
  }
}

// Main function to analyze any file
export async function analyzeFile(
  fileId: string,
  fileName: string,
  fileType: string,
  extractedText: string,
  accessToken: string,
  userId: string,
  mimeType: string
): Promise<{ analysis: FileAnalysisResult; fileId: string; fileName: string }> {
  try {
    // Get student context for personalized analysis
    const userContext = await getStudentContext(userId);
    
    let analysis: FileAnalysisResult;
    
    if (fileType === 'image' && mimeType.startsWith('image/')) {
      // For images, we need to download and analyze the image directly
      const { downloadFileFromDrive } = require('./file-processor');
      const imageBuffer = await downloadFileFromDrive(fileId, accessToken);
      analysis = await analyzeImageContent(imageBuffer, fileName, userContext || undefined);
    } else {
      // For text-based files
      analysis = await analyzeFileContent(extractedText, fileName, fileType, userContext || undefined);
    }
    
    return {
      analysis,
      fileId,
      fileName
    };
  } catch (error) {
    console.error('Error in main analyzeFile function:', error);
    throw error;
  }
}
