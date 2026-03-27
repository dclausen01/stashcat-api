"use strict";
/**
 * Echtzeit-Event-Types für push.stashcat.com (Socket.io v4)
 *
 * Auth-Flow (verifiziert via reverse engineering + Live-Test):
 *   1. connect to 'https://push.stashcat.com'
 *   2. on 'connect': emit('userid', { hidden_id: socket_id, device_id, client_key })
 *      - socket_id kommt aus /users/me → Feld 'socket_id'
 *   3. Server antwortet mit 'new_device_connected' → Events fließen
 *
 * Alle Event-Namen aus dem Angular-Bundle (Qa-Enum) + Live-verifizierte Events.
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=types.js.map