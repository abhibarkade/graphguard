#!/usr/bin/env node

/**
 * Schema Check Script with Retry Logic
 * 
 * Validates a GraphQL schema against a variant using GraphGuard's checkSchema mutation.
 * Includes automatic retry logic with exponential backoff for network failures.
 * 
 * Usage:
 *   node scripts/schema-check.js \
 *     --schema-path <path> \
 *     --variant-id <variant> \
 *     --api-key <key> \
 *     --endpoint <url>
 */

const axios = require('axios');
const pRetry = require('p-retry');
const fs = require('fs');
const path = require('path');

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }
  
  return options;
}

// Validate required arguments
function validateArgs(options) {
  const required = ['schema-path', 'variant-id', 'api-key', 'endpoint'];
  const missing = required.filter(arg => !options[arg]);
  
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

// Read schema file
function readSchema(schemaPath) {
  try {
    const absolutePath = path.resolve(schemaPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Schema file not found: ${absolutePath}`);
    }
    return fs.readFileSync(absolutePath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error reading schema file: ${error.message}`);
    process.exit(1);
  }
}

// Execute schema check mutation
async function checkSchema(endpoint, apiKey, variantId, schemaSDL) {
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
        'X-API-KEY': apiKey
      },
      timeout: 30000 // 30 second timeout
    }
  );

  return response.data;
}

// Main execution with retry logic
async function main() {
  const options = parseArgs();
  validateArgs(options);

  const schemaPath = options['schema-path'];
  const variantId = options['variant-id'];
  const apiKey = options['api-key'];
  const endpoint = options['endpoint'];

  console.log('🔍 Schema Check Configuration:');
  console.log(`   Schema Path: ${schemaPath}`);
  console.log(`   Variant ID: ${variantId}`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log('');

  const schemaSDL = readSchema(schemaPath);
  console.log(`✅ Schema loaded (${schemaSDL.length} characters)`);
  console.log('');

  try {
    console.log('🔄 Executing schema check with retry logic...');
    
    const result = await pRetry(
      () => checkSchema(endpoint, apiKey, variantId, schemaSDL),
      {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 10000,
        onFailedAttempt: error => {
          console.log(`⚠️  Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
          console.log(`   Error: ${error.message}`);
        }
      }
    );

    // Check for GraphQL errors
    if (result.errors) {
      console.error('❌ GraphQL Errors:');
      result.errors.forEach(err => console.error(`   - ${err.message}`));
      process.exit(1);
    }

    // Check validation result
    const checkResult = result.data?.checkSchema;
    
    if (!checkResult) {
      console.error('❌ Unexpected response format');
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }

    if (checkResult.isValid) {
      console.log('✅ Schema validation passed!');
      console.log('');
      process.exit(0);
    } else {
      console.error('❌ Schema validation failed:');
      if (checkResult.errors && checkResult.errors.length > 0) {
        checkResult.errors.forEach(err => {
          console.error(`   - ${err.message}`);
        });
      }
      console.error('');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Schema check failed after all retries:');
    console.error(`   ${error.message}`);
    
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// Run the script
main();
