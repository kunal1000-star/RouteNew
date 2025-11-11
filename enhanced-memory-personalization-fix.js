// Enhanced Memory Personalization - Issue 4 Fix
// ================================================

// Enhanced name extraction patterns and logic for better user name detection

export const ENHANCED_NAME_PATTERNS = [
  /(?:name is|call me|i am|my name is|you can call me|just call me|my name's)\s+([A-Za-z]+)/i,
  /(?:i(?:'|’)m|i am|this is)\s+([A-Za-z]+)/i,
  /(?:my name|user name)\s*[:\-]\s*([A-Za-z]+)/i,
  /(?:user|person)\s+named\s+([A-Za-z]+)/i,
  /(?:introduction|intro)\s*[:\-]\s*([A-Za-z]+)/i,
  /(?:hi|hello|hey)\s+(?:i'm|i am|this is)\s+([A-Za-z]+)/i
];

export const PERSONAL_INDICATORS = {
  nameQueries: [
    'my name',
    'do you know',
    'who am i',
    'what is my',
    'call me',
    'what should you call me',
    'my name is',
    'introduction',
    'introduction:'
  ],
  commonNames: ['kunal', 'alex', 'john', 'sarah', 'mike', 'lisa', 'david', 'emma'],
  academicPatterns: ['grade', 'class', 'school', 'year', 'study'],
  locationPatterns: ['location', 'live', 'from', 'based', 'city', 'country'],
  learningPatterns: ['learn', 'study', 'understand', 'visual', 'auditory', 'hands-on', 'practice']
};

export function extractEnhancedPersonalFacts(query: string, memories: any[]): string[] {
  const lowerQuery = query.toLowerCase();
  const personalFacts: string[] = [];

  // Check if this is a personal identity question
  const isNameQuery = PERSONAL_INDICATORS.nameQueries.some(pattern => 
    lowerQuery.includes(pattern)
  );

  if (isNameQuery) {
    const nameMemories = memories.filter(memory => 
      memory && memory.content && (
        memory.content.toLowerCase().includes('name') ||
        memory.content.toLowerCase().includes('kunal') ||
        (memory.tags && (memory.tags.includes('identity') || memory.tags.includes('personal')))
      )
    );

    for (const memory of nameMemories) {
      if (memory && memory.content) {
        // Try enhanced name patterns
        for (const pattern of ENHANCED_NAME_PATTERNS) {
          const nameMatch = memory.content.match(pattern);
          if (nameMatch) {
            const name = nameMatch[1].trim();
            // Validate name
            if (name.length >= 2 && name.length <= 20 && /^[A-Za-z]+$/.test(name)) {
              personalFacts.push(`User name: ${name}`);
              return personalFacts; // Return early if name found
            }
          }
        }
        
        // Fallback to common name lookup
        const contentLower = memory.content.toLowerCase();
        for (const commonName of PERSONAL_INDICATORS.commonNames) {
          if (contentLower.includes(commonName)) {
            personalFacts.push(`User name: ${commonName.charAt(0).toUpperCase() + commonName.slice(1)}`);
            return personalFacts;
          }
        }
      }
    }

    // If no name found
    if (personalFacts.length === 0) {
      personalFacts.push('User name: Not found in previous conversations');
    }
  }

  // Extract other personal information
  for (const memory of memories.slice(0, 3)) {
    if (memory && memory.content) {
      const content = memory.content.toLowerCase();
      
      // Academic information
      if (PERSONAL_INDICATORS.academicPatterns.some(pattern => content.includes(pattern))) {
        personalFacts.push(`Academic: ${memory.content.substring(0, 100)}`);
      }
      
      // Learning style
      if (PERSONAL_INDICATORS.learningPatterns.some(pattern => content.includes(pattern))) {
        if (content.includes('visual')) {
          personalFacts.push('Learning style: Visual learner');
        } else if (content.includes('auditory')) {
          personalFacts.push('Learning style: Auditory learner');
        } else if (content.includes('hands-on') || content.includes('practice')) {
          personalFacts.push('Learning style: Kinesthetic learner');
        }
      }
    }
  }

  return personalFacts;
}

// Memory system UUID fix helper (Issue 3)
export function generateProperUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Provider display mapping fix (Issue 6)
export const PROVIDER_DISPLAY_MAP: Record<string, string> = {
  'groq': 'Groq',
  'gemini': 'Gemini', 
  'cerebras': 'Cerebras',
  'cohere': 'Cohere',
  'mistral': 'Mistral',
  'openrouter': 'OpenRouter',
  'openai': 'OpenAI',
  'anthropic': 'Anthropic'
};

export function getDisplayProviderName(internalName: string): string {
  return PROVIDER_DISPLAY_MAP[internalName.toLowerCase()] || internalName;
}

// RLS Policy Fix for Student Profiles (Issue 5)
export const STUDENT_PROFILE_RLS_FIX = `
-- Fix RLS policies for student_ai_profile table
-- This addresses the "new row violates row-level security policy" error

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can view their own profile" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON student_ai_profile;

-- Create comprehensive RLS policies
CREATE POLICY "Users can manage their own student profile" 
ON student_ai_profile FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow profile creation for authenticated users
CREATE POLICY "Allow authenticated profile creation" 
ON student_ai_profile FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE student_ai_profile ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON student_ai_profile TO authenticated, service_role;
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
`;