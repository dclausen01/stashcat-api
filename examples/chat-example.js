const { StashcatClient } = require('../dist/index');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function demonstrateUsage() {
  try {
    console.log('🚀 Initializing Stashcat API Client...');

    // Create client with configuration
    const client = new StashcatClient({
      baseUrl: process.env.STASHCAT_BASE_URL || 'https://api.schul.cloud/',
      deviceId: process.env.STASHCAT_DEVICE_ID,
    });

    console.log('📋 Client Info:', client.getClientInfo());

    console.log('\n📝 Usage Example:');
    console.log('To test with real credentials, update the .env file with:');
    console.log('STASHCAT_EMAIL=your-real-email@example.com');
    console.log('STASHCAT_PASSWORD=your-real-password');
    console.log('STASHCAT_BASE_URL=https://api.schul.cloud/');
    
    console.log('\n💡 Once authenticated, you can:');
    console.log('  • Get channels: await client.getChannels(companyId)');
    console.log('  • Get conversations: await client.getConversations()');
    console.log('  • Get messages: await client.getMessages(chatId, "channel")');
    console.log('  • Download files: await client.downloadFile(file)');
    
    console.log('\n🔒 Encryption:');
    console.log('  • Keys are automatically generated on login');
    console.log('  • Messages are decrypted automatically when retrieved');
    console.log('  • Get encryption key: client.getEncryptionKey()');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Run the demonstration
demonstrateUsage();
