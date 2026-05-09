import { execute } from './src/presentation/commands/general/profile.js';

const mockInteraction = {
  client: {
    rest: {
      post: async (route: any, data: any) => {
        console.log(`\n=== REST POST to ${route} ===`);
        console.log(JSON.stringify(data, null, 2));
        console.log(`===================================\n`);
      }
    }
  },
  user: { id: 'mock-user-id', username: 'MockUser', tag: 'MockUser#1234' },
  options: {
    getUser: () => null,
  },
  guildId: '739365630251237446',
  id: 'mock-interaction-id',
  token: 'mock-token',
  replied: false,
  deferred: false,
};

async function runTest() {
  console.log('[*] Testing /profile execution...');
  await execute(mockInteraction as any);
  console.log('[+] Test complete.');
  process.exit(0);
}

runTest();
