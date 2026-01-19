#!/usr/bin/env node

/**
 * Schema Publish Script with Retry Logic
 * 
 * Publishes a GraphQL schema to a variant using GraphGuard's deploySchema mutation.
 * Includes automatic retry logic with exponential backoff for network failures.
 * 
 * Usage:
 *   node scripts/schema-publish.js \
 *     --schema-path <path> \
 *     --schema-name <name> \
 *     --variant-id <variant> \
 *     --api-key <key> \
 *     --endpoint <url> \
 *     --version-label <label>
 */

const axios = require('axios');
const pRetry = require('p-retry');
const fs = require('fs');
const path = require('path');

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
  // Define required arguments for schema publishing
  const required = ['schema-path', 'schema-name', 'variant-id', 'api-key', 'endpoint', 'version-label'];
  
  // Find any missing required arguments
  const missing = required.filter(arg => !options[arg]);
  
  // If any required args are missing, show error and usage
  if (missing.length > 0) {
    console.error(`❌ Missing required arguments: ${missing.join(', ')}`);
    console.error('\nUsage:');
    console.error('  node scripts/schema-publish.js \\');
    console.error('    --schema-path <path> \\');
    console.error('    --schema-name <name> \\');
    console.error('    --variant-id <variant> \\');
    console.error('    --api-key <key> \\');
    console.error('    --endpoint <url> \\');
    console.error('    --version-label <label>');
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
 * Execute the GraphQL deploySchema mutation
 * This function will be retried automatically by pRetry if it fails
 * 
 * @param {string} endpoint - GraphGuard GraphQL endpoint URL
 * @param {string} apiKey - API key for authentication
 * @param {string} variantId - Target variant ID to deploy to
 * @param {string} schemaName - Name of the schema/subgraph
 * @param {string} schemaSDL - GraphQL schema as SDL string
 * @param {string} versionLabel - Version label for deployment tracking
 * @returns {Promise<Object>} GraphQL response data
 * @throws {Error} On network errors or HTTP failures
 */
async function publishSchema(endpoint, apiKey, variantId, schemaName, schemaSDL, versionLabel) {
  // GraphQL mutation for schema deployment
  const mutation = `
    mutation DeploySchema(
      $variantId: String!
      $schemaName: String!
      $schemaSDL: String!
      $versionLabel: String!
    ) {
      deploySchema(
        variantId: $variantId
        schemaName: $schemaName
        schemaSDL: $schemaSDL
        versionLabel: $versionLabel
      ) {
        id
        status
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
        schemaName,
        schemaSDL,
        versionLabel
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
 * Orchestrates the entire schema publishing process with retry logic
 */
async function main() {
  // Parse and validate command-line arguments
  const options = parseArgs();
  validateArgs(options);

  // Extract configuration from parsed arguments
  const schemaPath = options['schema-path'];
  const schemaName = options['schema-name'];
  const variantId = options['variant-id'];
  const apiKey = options['api-key'];
  const endpoint = options['endpoint'];
  const versionLabel = options['version-label'];

  // Display configuration for transparency
  console.log('🚀 Schema Publish Configuration:');
  console.log(`   Schema Path: ${schemaPath}`);
  console.log(`   Schema Name: ${schemaName}`);
  console.log(`   Variant ID: ${variantId}`);
  console.log(`   Version Label: ${versionLabel}`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log('');

  // Load schema file from disk
  const schemaSDL = readSchema(schemaPath);
  console.log(`✅ Schema loaded (${schemaSDL.length} characters)`);
  console.log('');

  try {
    console.log('🔄 Publishing schema with retry logic...');
    
    // Execute mutation with automatic retry logic
    // pRetry will automatically retry on failures with exponential backoff
    const result = await pRetry(
      () => publishSchema(endpoint, apiKey, variantId, schemaName, schemaSDL, versionLabel),
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

    // Extract the deploySchema result from the response
    const deployResult = result.data?.deploySchema;
    
    // Validate response structure
    if (!deployResult) {
      console.error('❌ Unexpected response format');
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }

    // Schema published successfully - show deployment details
    console.log('✅ Schema published successfully!');
    console.log(`   Deployment ID: ${deployResult.id}`);
    console.log(`   Status: ${deployResult.status}`);
    console.log('');
    process.exit(0);  // Success exit code

  } catch (error) {
    // All retries exhausted or unrecoverable error
    console.error('❌ Schema publish failed after all retries:');
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
