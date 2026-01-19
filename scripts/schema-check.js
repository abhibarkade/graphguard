#!/usr/bin/env node

/**
 * Schema Check Script with Retry Logic
 * 
 * This script validates a GraphQL schema against a variant using GraphGuard's checkSchema mutation.
 * It includes automatic retry logic with exponential backoff for handling transient network failures.
 * 
 * Features:
 * - Automatic retry with exponential backoff (3 attempts)
 * - Comprehensive error handling and reporting
 * - Clear console output with status indicators
 * - Proper exit codes for CI/CD integration
 * 
 * Exit Codes:
 * - 0: Schema validation passed
 * - 1: Validation failed, missing arguments, or network error
 * 
 * Usage:
 *   node scripts/schema-check.js \
 *     --schema-path <path> \
 *     --variant-id <variant> \
 *     --api-key <key> \
 *     --endpoint <url>
 * 
 * Example:
 *   node scripts/schema-check.js \
 *     --schema-path ./schema.graphql \
 *     --variant-id current \
 *     --api-key abc123 \
 *     --endpoint http://localhost:3000/graphql
 */

// Required dependencies
const axios = require('axios');      // HTTP client for making GraphQL requests
const pRetry = require('p-retry');   // Retry library with exponential backoff
const fs = require('fs');            // File system operations
const path = require('path');        // Path manipulation utilities

/**
 * Parse command-line arguments into a key-value object
 * Converts --arg-name value pairs into { 'arg-name': 'value' }
 * 
 * @returns {Object} Parsed arguments as key-value pairs
 */
function parseArgs() {
  // Skip first two args (node executable and script path)
  const args = process.argv.slice(2);
  const options = {};
  
  // Process arguments in pairs (--key value)
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');  // Remove -- prefix
    const value = args[i + 1];
    options[key] = value;
  }
  
  return options;
}

/**
 * Validate that all required arguments are present
 * Exits with code 1 and shows usage if any required args are missing
 * 
 * @param {Object} options - Parsed command-line arguments
 */
function validateArgs(options) {
  // Define required arguments for schema validation
  const required = ['schema-path', 'variant-id', 'api-key', 'endpoint'];
  
  // Find any missing required arguments
  const missing = required.filter(arg => !options[arg]);
  
  // If any required args are missing, show error and usage
  if (missing.length > 0) {
    console.error(`❌ Missing required arguments: ${missing.join(', ')}`);
    console.error('\nUsage:');
    console.error('  node scripts/schema-check.js \\');
    console.error('    --schema-path <path> \\');
    console.error('    --variant-id <variant> \\');
    console.error('    --api-key <key> \\');
    console.error('    --endpoint <url>');
    process.exit(1);
  }
}

/**
 * Read and validate the schema file from disk
 * 
 * @param {string} schemaPath - Path to the GraphQL schema file
 * @returns {string} Schema content as a string
 * @throws {Error} If file doesn't exist or can't be read
 */
function readSchema(schemaPath) {
  try {
    // Convert to absolute path for reliability
    const absolutePath = path.resolve(schemaPath);
    
    // Check if file exists before attempting to read
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Schema file not found: ${absolutePath}`);
    }
    
    // Read file content as UTF-8 string
    return fs.readFileSync(absolutePath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error reading schema file: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Execute the GraphQL checkSchema mutation
 * This function will be retried automatically by pRetry if it fails
 * 
 * @param {string} endpoint - GraphGuard GraphQL endpoint URL
 * @param {string} apiKey - API key for authentication
 * @param {string} variantId - Target variant ID to check against
 * @param {string} schemaSDL - GraphQL schema as SDL string
 * @returns {Promise<Object>} GraphQL response data
 * @throws {Error} On network errors or HTTP failures
 */
async function checkSchema(endpoint, apiKey, variantId, schemaSDL) {
  // GraphQL mutation for schema validation
  const mutation = `
    mutation CheckSchema($variantId: String!, $schemaSDL: String!) {
      checkSchema(variantId: $variantId, schemaSDL: $schemaSDL) {
        isValid
        errors {
          message
        }
      }
    }
  `;

  // Make HTTP POST request to GraphQL endpoint
  const response = await axios.post(
    endpoint,
    {
      query: mutation,
      variables: {
        variantId,
        schemaSDL
      }
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey  // Custom header for API key authentication
      },
      timeout: 30000  // 30 second timeout to prevent hanging
    }
  );

  return response.data;
}

/**
 * Main execution function
 * Orchestrates the entire schema validation process with retry logic
 */
async function main() {
  // Parse and validate command-line arguments
  const options = parseArgs();
  validateArgs(options);

  // Extract configuration from parsed arguments
  const schemaPath = options['schema-path'];
  const variantId = options['variant-id'];
  const apiKey = options['api-key'];
  const endpoint = options['endpoint'];

  // Display configuration for transparency
  console.log('🔍 Schema Check Configuration:');
  console.log(`   Schema Path: ${schemaPath}`);
  console.log(`   Variant ID: ${variantId}`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log('');

  // Load schema file from disk
  const schemaSDL = readSchema(schemaPath);
  console.log(`✅ Schema loaded (${schemaSDL.length} characters)`);
  console.log('');

  try {
    console.log('🔄 Executing schema check with retry logic...');
    
    // Execute mutation with automatic retry logic
    // pRetry will automatically retry on failures with exponential backoff
    const result = await pRetry(
      () => checkSchema(endpoint, apiKey, variantId, schemaSDL),
      {
        retries: 3,           // Maximum 3 retry attempts
        factor: 2,            // Exponential backoff factor (2x each time)
        minTimeout: 1000,     // Start with 1 second delay
        maxTimeout: 10000,    // Cap delay at 10 seconds
        onFailedAttempt: error => {
          // Log each failed attempt for debugging
          console.log(`⚠️  Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
          console.log(`   Error: ${error.message}`);
        }
      }
    );

    // Check for GraphQL-level errors (not HTTP errors)
    if (result.errors) {
      console.error('❌ GraphQL Errors:');
      result.errors.forEach(err => console.error(`   - ${err.message}`));
      process.exit(1);
    }

    // Extract the checkSchema result from the response
    const checkResult = result.data?.checkSchema;
    
    // Validate response structure
    if (!checkResult) {
      console.error('❌ Unexpected response format');
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }

    // Check if schema validation passed
    if (checkResult.isValid) {
      console.log('✅ Schema validation passed!');
      console.log('');
      process.exit(0);  // Success exit code
    } else {
      // Schema validation failed - show errors
      console.error('❌ Schema validation failed:');
      if (checkResult.errors && checkResult.errors.length > 0) {
        checkResult.errors.forEach(err => {
          console.error(`   - ${err.message}`);
        });
      }
      console.error('');
      process.exit(1);  // Failure exit code
    }

  } catch (error) {
    // All retries exhausted or unrecoverable error
    console.error('❌ Schema check failed after all retries:');
    console.error(`   ${error.message}`);
    
    // Show additional HTTP response details if available
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);  // Failure exit code
  }
}

// Execute main function
// Any unhandled errors will be caught by Node.js and exit with code 1
main();
