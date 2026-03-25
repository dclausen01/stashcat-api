/**
 * Test script: find a channel event and show its channel/channel_invites structure
 */
import 'dotenv/config';
import { StashcatClient } from '../src/index';

async function main() {
  const client = new StashcatClient({
    baseUrl: process.env.STASHCAT_BASE_URL,
  });

  await client.login({
    email: process.env.STASHCAT_EMAIL!,
    password: process.env.STASHCAT_PASSWORD!,
    appName: process.env.STASHCAT_APP_NAME || 'stashcat-api-test',
    deviceId: process.env.STASHCAT_DEVICE_ID,
  });

  // List events in March 2026
  const events = await client.listEvents({
    start: Math.floor(new Date('2026-03-01').getTime() / 1000),
    end: Math.floor(new Date('2026-03-31').getTime() / 1000),
  });

  console.log(`Total events: ${events.length}`);

  // Find channel events
  const channelEvents = events.filter(e => e.type === 'channel');
  console.log(`Channel events: ${channelEvents.length}`);

  if (channelEvents.length > 0) {
    // Get details for first channel event
    const ev = channelEvents[0];
    console.log(`\n=== Event: ${ev.name} (id=${ev.id}) ===`);
    console.log(`type: ${ev.type}, type_id: ${ev.type_id}`);
    console.log(`channel: ${JSON.stringify(ev.channel, null, 2)}`);
    console.log(`channel_invites: ${JSON.stringify(ev.channel_invites, null, 2)}`);

    // Also get full details
    const details = await client.getEventDetails(String(ev.id));
    console.log(`\n=== Full details ===`);
    console.log(`channel: ${JSON.stringify(details.channel, null, 2)}`);
    console.log(`channel_invites: ${JSON.stringify(details.channel_invites, null, 2)}`);

    // Show all keys
    console.log(`\nAll event keys: ${Object.keys(details).join(', ')}`);
  }

  // Also check personal events with channel_invites
  const personalEvents = events.filter(e => e.type === 'personal' && e.channel_invites && (e.channel_invites as unknown[]).length > 0);
  console.log(`\nPersonal events with channel_invites: ${personalEvents.length}`);
  if (personalEvents.length > 0) {
    const ev = personalEvents[0];
    console.log(`\n=== Personal event with invites: ${ev.name} (id=${ev.id}) ===`);
    console.log(`channel_invites: ${JSON.stringify(ev.channel_invites, null, 2)}`);
  }

  await client.logout();
}

main().catch(console.error);
