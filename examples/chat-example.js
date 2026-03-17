const { StashcatClient } = require('../dist/index');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function demonstrateUsage() {
  const email = process.env.STASHCAT_EMAIL;
  const password = process.env.STASHCAT_PASSWORD;
  const baseUrl = process.env.STASHCAT_BASE_URL || 'https://api.stashcat.com/';

  if (!email || !password) {
    console.error('❌ Bitte STASHCAT_EMAIL und STASHCAT_PASSWORD in der .env-Datei setzen.');
    process.exit(1);
  }

  try {
    console.log('🚀 Initializing Stashcat API Client...');

    const client = new StashcatClient({
      baseUrl,
      deviceId: process.env.STASHCAT_DEVICE_ID,
    });

    console.log('📋 Client Info:', client.getClientInfo());

    // --- Login ---
    console.log('\n� Logging in as', email, '...');
    await client.login({ email, password, appName: process.env.STASHCAT_APP_NAME || 'stashcat-api-client' });
    console.log('✅ Login successful!');
    console.log('📋 Authenticated Client Info:', client.getClientInfo());

    // --- Conversations ---
    console.log('\n💬 Loading conversations...');
    try {
      const conversations = await client.getConversations();
      console.log(`  Found ${conversations.length} conversation(s).`);
      if (conversations.length > 0) {
        const first = conversations[0];
        console.log(`  First conversation: ID=${first.id}, Name=${first.name || '(unnamed)'}`);

        console.log('\n📨 Loading messages from first conversation...');
        const messages = await client.getMessages(first.id, 'conversation');
        console.log(`  Found ${messages.length} message(s).`);
        if (messages.length > 0) {
          const m = messages[messages.length - 1];
          console.log(`  Latest message: [${m.sender_id}] ${m.text || '(no text)'}`);
        }
      }
    } catch (e) {
      console.warn('  ⚠️ Conversation test failed:', e instanceof Error ? e.message : e);
    }

    // --- Channels (optional, needs company ID) ---
    const companyId = process.env.TEST_COMPANY_ID;
    if (companyId) {
      console.log('\n� Loading channels for company', companyId, '...');
      try {
        const channels = await client.getChannels(companyId);
        console.log(`  Found ${channels.length} channel(s).`);
        if (channels.length > 0) {
          console.log(`  First channel: ID=${channels[0].id}, Name=${channels[0].name}`);
        }
      } catch (e) {
        console.warn('  ⚠️ Channel test failed:', e instanceof Error ? e.message : e);
      }
    } else {
      console.log('\n📢 Channels: set TEST_COMPANY_ID in .env to test channels.');
    }

    // --- Logout ---
    console.log('\n🔓 Logging out...');
    await client.logout();
    console.log('✅ Logged out successfully.');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

demonstrateUsage();
