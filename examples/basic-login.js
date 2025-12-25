const { StashcatClient } = require('../dist/index');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('🚀 Initializing Stashcat API Client...');

    // Create client with configuration
    const client = new StashcatClient({
      baseUrl: process.env.STASHCAT_BASE_URL,
      deviceId: process.env.STASHCAT_DEVICE_ID,
    });

    console.log('📋 Client Info:', client.getClientInfo());

    // Login with credentials
    await client.login({
      email: process.env.STASHCAT_EMAIL,
      password: process.env.STASHCAT_PASSWORD,
      appName: process.env.STASHCAT_APP_NAME || 'stashcat-api-client',
      encrypted: false,
      callable: false,
      keyTransferSupport: false,
    });

    console.log('✅ Successfully authenticated!');
    console.log('🔒 Encryption key generated:', !!client.getEncryptionKey());

    // Get client info after login
    console.log('📋 Updated Client Info:', client.getClientInfo());

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the example
main();
