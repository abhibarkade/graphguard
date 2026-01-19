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
  const required = ['schema-path', 'schema-name', 'variant-id', 'api-key', 'endpoint', 'version-label'];
  const missing = required.filter(arg => !options[arg]);
  
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

// Execute schema publish mutation
async function publishSchema(endpoint, apiKey, variantId, schemaName, schemaSDL, versionLabel) {
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
  const schemaName = options['schema-name'];
  const variantId = options['variant-id'];
  const apiKey = options['api-key'];
  const endpoint = options['endpoint'];
  const versionLabel = options['version-label'];

  console.log('🚀 Schema Publish Configuration:');
  console.log(`   Schema Path: ${schemaPath}`);
  console.log(`   Schema Name: ${schemaName}`);
  console.log(`   Variant ID: ${variantId}`);
  console.log(`   Version Label: ${versionLabel}`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log('');

  const schemaSDL = readSchema(schemaPath);
  console.log(`✅ Schema loaded (${schemaSDL.length} characters)`);
  console.log('');

  try {
    console.log('🔄 Publishing schema with retry logic...');
    
    const result = await pRetry(
      () => publishSchema(endpoint, apiKey, variantId, schemaName, schemaSDL, versionLabel),
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

    // Check deployment result
    const deployResult = result.data?.deploySchema;
    
    if (!deployResult) {
      console.error('❌ Unexpected response format');
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log('✅ Schema published successfully!');
    console.log(`   Deployment ID: ${deployResult.id}`);
    console.log(`   Status: ${deployResult.status}`);
    console.log('');
    process.exit(0);

  } catch (error) {
    console.error('❌ Schema publish failed after all retries:');
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
