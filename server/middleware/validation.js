/**
 * Input Validation Middleware
 * Protects against injection attacks and malformed data
 */

/**
 * Sanitize string input
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 10000); // Max 10KB per string
}

/**
 * Validate JSON schema
 */
function validateSchema(data, schema) {
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    
    // Required check
    if (rules.required && (value === undefined || value === null)) {
      return { valid: false, error: `Missing required field: ${key}` };
    }
    
    // Type check
    if (value !== undefined && rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        return { valid: false, error: `Invalid type for ${key}: expected ${rules.type}` };
      }
    }
    
    // String length check
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      return { valid: false, error: `${key} exceeds max length of ${rules.maxLength}` };
    }
    
    // Pattern check
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return { valid: false, error: `${key} does not match required pattern` };
    }
  }
  
  return { valid: true };
}

/**
 * Middleware factory for schema validation
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = validateSchema(req.body, schema);
    
    if (!result.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: result.error
      });
    }
    
    // Sanitize string fields
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
    
    next();
  };
}

/**
 * Common validation schemas
 */
const schemas = {
  login: {
    privateKey: { required: true, type: 'string', maxLength: 1000 },
    username: { type: 'string', maxLength: 100 }
  },
  
  pulse: {
    text: { required: true, type: 'string', maxLength: 10000 },
    node: { required: true, type: 'string', pattern: /^[A-Z_]+$/ }
  },
  
  upload: {
    filename: { required: true, type: 'string', maxLength: 255 },
    content: { required: true, type: 'string' }
  },
  
  bookChapter: {
    title: { required: true, type: 'string', maxLength: 500 },
    content: { required: true, type: 'string', maxLength: 100000 },
    tags: { type: 'array' }
  },
  
  memory: {
    conversationId: { type: 'string', maxLength: 100 },
    content: { required: true, type: 'string', maxLength: 50000 }
  }
};

module.exports = {
  validateBody,
  schemas,
  sanitizeString,
  validateSchema
};
