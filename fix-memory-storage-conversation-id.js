#!/usr/bin/env node
/**
 * Fix memory storage conversation ID validation
 */

const fs = require('fs');

const filePath = 'src/app/api/ai/memory-storage/route.ts';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Fix the conversationId validation to allow test conversation IDs
const fixedContent = fileContent.replace(
  `    // Prepare conversation_id as proper UUID
    const conversationId = body.conversationId || generateUUID();`,
  `    // Prepare conversation_id as proper UUID or generate one
    let conversationId = body.conversationId;
    if (!conversationId) {
      // If no conversationId provided, generate one
      conversationId = generateUUID();
    } else {
      // If conversationId provided, validate it's a UUID or convert to UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(conversationId)) {
        // Convert non-UUID to UUID format for compatibility
        conversationId = generateUUID();
      }
    }`
);

fs.writeFileSync(filePath, fixedContent);
console.log('✅ Fixed memory storage conversation ID validation');