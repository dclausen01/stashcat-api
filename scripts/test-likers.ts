import * as dotenv from 'dotenv';
import axios from 'axios';
import { StashcatClient } from '../src/client/StashcatClient';

dotenv.config();

const BASE_URL = process.env.STASHCAT_BASE_URL || 'https://api.stashcat.com/';
const EMAIL = process.env.STASHCAT_EMAIL!;
const PASSWORD = process.env.STASHCAT_PASSWORD!;
const APP_NAME = process.env.STASHCAT_APP_NAME || 'stashcat-api-client';

async function main() {
  console.log('=== Stashcat Likers Endpoint Discovery ===\n');

  // 1. Login
  const client = new StashcatClient({ baseUrl: BASE_URL });
  await client.login({ email: EMAIL, password: PASSWORD, appName: APP_NAME });
  console.log('Logged in successfully.\n');

  const info = client.getClientInfo();
  const deviceId = info.deviceId;

  // Get client_key from serialized session
  const session = client.serialize();
  const clientKey = session.clientKey;

  // 2. Get companies, then channels, then find a message with likes > 0
  const companies = await client.getCompanies();
  console.log(`Found ${companies.length} companies.`);

  let likedMessageId: string | null = null;
  let searchChannelId: string | null = null;

  for (const company of companies) {
    console.log(`\nSearching company: ${company.name} (${company.id})`);
    const channels = await client.getChannels(company.id);
    console.log(`  Found ${channels.length} channels.`);

    for (const channel of channels.slice(0, 10)) {
      try {
        const messages = await client.getMessages(channel.id, 'channel', { limit: 50 });
        const liked = messages.find((m: any) => m.likes && m.likes > 0);
        if (liked) {
          likedMessageId = liked.id;
          searchChannelId = channel.id;
          console.log(`  Found liked message in channel "${channel.name}": message_id=${liked.id}, likes=${liked.likes}`);
          break;
        }
      } catch (e: any) {
        // skip channels we can't read
      }
    }
    if (likedMessageId) break;
  }

  if (!likedMessageId) {
    console.log('\nNo liked messages found. Will like a message ourselves...');
    // Find any message and like it
    for (const company of companies) {
      const channels = await client.getChannels(company.id);
      for (const channel of channels.slice(0, 5)) {
        try {
          const messages = await client.getMessages(channel.id, 'channel', { limit: 10 });
          if (messages.length > 0) {
            likedMessageId = messages[0].id;
            searchChannelId = channel.id;
            await client.likeMessage(likedMessageId);
            console.log(`Liked message ${likedMessageId} in channel "${channel.name}"`);
            break;
          }
        } catch (e: any) {
          // skip
        }
      }
      if (likedMessageId) break;
    }
  }

  if (!likedMessageId) {
    console.log('ERROR: Could not find any message to test with.');
    return;
  }

  console.log(`\nUsing message_id: ${likedMessageId}`);
  console.log('-------------------------------------------\n');

  // 3. Try all candidate endpoints — expanded set
  const endpoints = [
    // Original guesses (all 404)
    '/message/likers',
    '/message/likes',
    '/message/who_liked',
    '/message/get_likes',
    '/message/like_list',
    '/message/liked_by',
    '/message/get_likers',
    '/message/info',
    // Following the existing API naming patterns
    '/message/list_likes',
    '/message/list_likers',
    '/message/like_info',
    '/message/like/list',
    '/message/like/get',
    '/like/list',
    '/like/get',
    '/likes/list',
    '/likes/get',
    // Maybe it's under a different root
    '/message/details',
    '/message/get',
    '/message/show',
    '/message/view',
    // Snake case variants
    '/message/get_like_list',
    '/message/list_liked_users',
    '/message/get_liked_users',
    // Maybe "liker" without s
    '/message/liker',
    '/message/get_liker',
    '/message/list_liker',
  ];

  const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

  for (const endpoint of endpoints) {
    console.log(`\n>>> Testing POST ${endpoint}`);
    try {
      const params = new URLSearchParams({
        client_key: clientKey,
        device_id: deviceId,
        message_id: likedMessageId,
      });

      const response = await axios.post(`${baseUrl}${endpoint}`, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        timeout: 15000,
        // Don't throw on non-2xx so we can see the response
        validateStatus: () => true,
      });

      console.log(`    HTTP Status: ${response.status}`);
      console.log(`    API Status: ${JSON.stringify(response.data?.status)}`);
      if (response.data?.payload) {
        console.log(`    Payload keys: ${Object.keys(response.data.payload)}`);
        console.log(`    Payload: ${JSON.stringify(response.data.payload, null, 2).slice(0, 1000)}`);
      }
      if (response.data?.status?.value === 'OK') {
        console.log('    *** SUCCESS! This endpoint works! ***');
      }
    } catch (error: any) {
      console.log(`    Error: ${error.message}`);
      if (error.response) {
        console.log(`    HTTP Status: ${error.response.status}`);
        console.log(`    Response: ${JSON.stringify(error.response.data).slice(0, 500)}`);
      }
    }
  }

  // Also try some alternative parameter names
  console.log('\n\n=== Testing alternative parameter names ===\n');

  const altTests = [
    { endpoint: '/message/likers', params: { id: likedMessageId } },
    { endpoint: '/message/likes', params: { id: likedMessageId } },
    { endpoint: '/message/info', params: { id: likedMessageId } },
    { endpoint: '/message/likers', params: { message_id: likedMessageId, channel_id: searchChannelId } },
    { endpoint: '/message/likes', params: { message_id: likedMessageId, channel_id: searchChannelId } },
    { endpoint: '/message/get_likes', params: { message_id: likedMessageId, channel_id: searchChannelId } },
  ];

  for (const test of altTests) {
    console.log(`\n>>> Testing POST ${test.endpoint} with params: ${JSON.stringify(test.params)}`);
    try {
      const paramObj: Record<string, string> = {
        client_key: clientKey,
        device_id: deviceId,
      };
      for (const [k, v] of Object.entries(test.params)) {
        if (v != null) paramObj[k] = String(v);
      }
      const params = new URLSearchParams(paramObj);

      const response = await axios.post(`${baseUrl}${test.endpoint}`, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      console.log(`    HTTP Status: ${response.status}`);
      console.log(`    API Status: ${JSON.stringify(response.data?.status)}`);
      if (response.data?.payload) {
        console.log(`    Payload keys: ${Object.keys(response.data.payload)}`);
        console.log(`    Payload: ${JSON.stringify(response.data.payload, null, 2).slice(0, 1000)}`);
      }
      if (response.data?.status?.value === 'OK') {
        console.log('    *** SUCCESS! This endpoint works! ***');
      }
    } catch (error: any) {
      console.log(`    Error: ${error.message}`);
    }
  }

  console.log('\n\n=== Done ===');
  client.logout();
}

main().catch(console.error);
