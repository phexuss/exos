/** Events to every connected window (download progress, install progress). */
import type { MessagePortMain } from 'electron';

const ports = new Set<MessagePortMain>();

export function addPort(port: MessagePortMain) {
  ports.add(port);
  port.on('close', () => ports.delete(port));
}

export function emit(event: string, payload: unknown) {
  for (const port of ports) port.postMessage({ event, payload });
}
