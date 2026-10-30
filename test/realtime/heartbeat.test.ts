import { describe, it, expect, jest } from '@jest/globals';
import { RealtimeManager } from '../../src/realtime/realtime';

function withFakeSocket(answer: unknown | 'none') {
  const rt = new RealtimeManager('ck', 'dev', 'hidden', { heartbeatInterval: 0 });
  const emit = jest.fn((event: string, ...args: unknown[]) => {
    const ack = args[args.length - 1];
    if (event === 'heartbeat' && answer !== 'none' && typeof ack === 'function') ack(answer);
  });
  (rt as any).socket = { connected: true, emit };
  return { rt, emit };
}

describe('RealtimeManager.checkAuthentication', () => {
  it('bleibt bei positiver Antwort still', async () => {
    const { rt, emit } = withFakeSocket(true);
    expect(await rt.checkAuthentication()).toBe('ok');
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('meldet sich bei abgelaufener Anmeldung neu an (userid)', async () => {
    const { rt, emit } = withFakeSocket(false);
    expect(await rt.checkAuthentication()).toBe('reauthenticated');
    expect(emit).toHaveBeenLastCalledWith('userid', { hidden_id: 'hidden', device_id: 'dev', client_key: 'ck' });
  });

  it('meldet sich vorsorglich neu an, wenn keine Antwort kommt', async () => {
    const { rt, emit } = withFakeSocket('none');
    expect(await rt.checkAuthentication(20)).toBe('no_answer');
    expect(emit).toHaveBeenLastCalledWith('userid', expect.anything());
  });

  it('meldet „disconnected“ ohne Verbindung', async () => {
    const rt = new RealtimeManager('ck', 'dev', 'hidden');
    expect(await rt.checkAuthentication()).toBe('disconnected');
  });
});
