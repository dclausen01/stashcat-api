import { StashcatClient } from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = new StashcatClient({
    baseUrl: process.env.STASHCAT_BASE_URL,
  });

  console.log('Logging in...');
  await client.login({
    email: process.env.STASHCAT_EMAIL!,
    password: process.env.STASHCAT_PASSWORD!,
    appName: process.env.STASHCAT_APP_NAME || 'stashcat-api-client',
    securityPassword: process.env.STASHCAT_SECURITY_PASSWORD || process.env.STASHCAT_PASSWORD!,
  });
  console.log('Logged in successfully.\n');

  // Try channel 2931324 first, fall back to first available channel
  const channelId = '2931324';

  console.log(`=== Loading messages from channel ${channelId} ===\n`);

  // Load multiple batches to get at least 100 messages
  const allMessages: any[] = [];
  for (let offset = 0; offset < 200; offset += 50) {
    try {
      const msgs = await client.getMessages(channelId, 'channel', { limit: 50, offset });
      if (msgs.length === 0) break;
      allMessages.push(...msgs);
      console.log(`Loaded batch at offset ${offset}: ${msgs.length} messages (total: ${allMessages.length})`);
    } catch (err: any) {
      console.error(`Error loading at offset ${offset}: ${err.message}`);
      break;
    }
  }

  console.log(`\nTotal messages loaded: ${allMessages.length}\n`);

  // Collect all unique kind/type values
  const kinds = new Set<string>();
  const types = new Set<string>();
  allMessages.forEach((m: any) => {
    if (m.kind !== undefined) kinds.add(String(m.kind));
    if (m.type !== undefined) types.add(String(m.type));
  });
  console.log(`=== All unique 'kind' values: ${JSON.stringify([...kinds])} ===`);
  console.log(`=== All unique 'type' values: ${JSON.stringify([...types])} ===\n`);

  // Find non-text messages (system messages)
  const nonTextMessages = allMessages.filter((m: any) =>
    (m.kind && m.kind !== 'text') || (m.type && m.type !== 'text')
  );
  console.log(`=== NON-TEXT MESSAGES (${nonTextMessages.length} found) ===\n`);
  nonTextMessages.forEach((m: any, i: number) => {
    console.log(`--- Non-text message #${i + 1} ---`);
    console.log(JSON.stringify(m, null, 2));
    console.log('');
  });

  // Find reply messages
  const replyMessages = allMessages.filter((m: any) => m.reply_to_id);
  console.log(`=== REPLY MESSAGES (${replyMessages.length} found) ===\n`);
  replyMessages.forEach((m: any, i: number) => {
    console.log(`--- Reply message #${i + 1} ---`);
    console.log(JSON.stringify(m, null, 2));
    console.log('');
  });

  // Also check messages with files attached
  const fileMessages = allMessages.filter((m: any) => m.files && m.files.length > 0);
  console.log(`=== FILE MESSAGES (${fileMessages.length} found) ===\n`);
  fileMessages.slice(0, 3).forEach((m: any, i: number) => {
    console.log(`--- File message #${i + 1} ---`);
    console.log(JSON.stringify(m, null, 2));
    console.log('');
  });

  // If no non-text messages found in this channel, also try conversations
  if (nonTextMessages.length === 0) {
    console.log('=== No non-text messages in channel. Trying conversations... ===\n');
    try {
      const convos = await client.getConversations({ limit: 5 });
      for (const conv of convos.slice(0, 3)) {
        console.log(`Checking conversation ${conv.id}...`);
        const msgs = await client.getMessages(conv.id, 'conversation', { limit: 50 });
        const nonText = msgs.filter((m: any) => (m.kind && m.kind !== 'text') || (m.type && m.type !== 'text'));
        const replies = msgs.filter((m: any) => m.reply_to_id);
        if (nonText.length > 0) {
          console.log(`  Found ${nonText.length} non-text messages:`);
          nonText.forEach((m: any) => console.log(JSON.stringify(m, null, 2)));
        }
        if (replies.length > 0) {
          console.log(`  Found ${replies.length} reply messages:`);
          replies.forEach((m: any) => console.log(JSON.stringify(m, null, 2)));
        }
      }
    } catch (err: any) {
      console.error(`Conversation check failed: ${err.message}`);
    }
  }

  // Also try to get channels list and check a few more channels
  if (nonTextMessages.length === 0 || replyMessages.length === 0) {
    console.log('\n=== Checking additional channels for system/reply messages... ===\n');
    try {
      const companies = await client.getCompanies();
      if (companies.length > 0) {
        const channels = await client.getChannels(companies[0].id);
        for (const ch of channels.slice(0, 5)) {
          if (ch.id === channelId) continue;
          console.log(`Checking channel "${ch.name}" (${ch.id})...`);
          try {
            const msgs = await client.getMessages(ch.id, 'channel', { limit: 50 });
            const nonText = msgs.filter((m: any) => (m.kind && m.kind !== 'text') || (m.type && m.type !== 'text'));
            const replies = msgs.filter((m: any) => m.reply_to_id);
            if (nonText.length > 0 || replies.length > 0) {
              console.log(`  ${nonText.length} non-text, ${replies.length} replies`);
              nonText.slice(0, 3).forEach((m: any) => {
                console.log('  NON-TEXT:', JSON.stringify(m, null, 2));
              });
              replies.slice(0, 3).forEach((m: any) => {
                console.log('  REPLY:', JSON.stringify(m, null, 2));
              });
            } else {
              console.log(`  All ${msgs.length} messages are text, no replies`);
            }
          } catch (err: any) {
            console.error(`  Error: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      console.error(`Channel scan failed: ${err.message}`);
    }
  }

  // Log a sample of normal text messages too for comparison
  console.log('\n=== SAMPLE NORMAL TEXT MESSAGE (for field comparison) ===\n');
  const normalMsg = allMessages.find((m: any) => m.kind === 'text' || (!m.kind && !m.type));
  if (normalMsg) {
    console.log(JSON.stringify(normalMsg, null, 2));
  }

  client.logout();
  console.log('\nDone.');
}

main().catch(console.error);
