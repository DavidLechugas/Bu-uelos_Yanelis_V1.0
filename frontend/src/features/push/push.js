import { pushApi } from '../../api/client.js';

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function keyToBytes(base64Url) {
  const padded = base64Url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function currentSubscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

/** `unsupported`, `blocked` (permiso negado), `on` (este dispositivo recibe avisos) u `off`. */
export async function pushStatus() {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  const subscription = await currentSubscription();
  return Notification.permission === 'granted' && subscription ? 'on' : 'off';
}

export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off';
  const registration = await navigator.serviceWorker.ready;
  const { publicKey } = await pushApi.key();
  const subscription = (await registration.pushManager.getSubscription())
    ?? (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) }));
  await pushApi.subscribe(subscription.toJSON());
  return 'on';
}

export async function disablePush() {
  const subscription = await currentSubscription();
  if (subscription) {
    await pushApi.unsubscribe(subscription.endpoint).catch(() => {});
    await subscription.unsubscribe();
  }
}

/** Al iniciar sesión, el dispositivo ya suscrito pasa a recibir los avisos de la cuenta actual. */
export async function syncPush() {
  try {
    if (!pushSupported() || Notification.permission !== 'granted') return;
    const subscription = await currentSubscription();
    if (subscription) await pushApi.subscribe(subscription.toJSON());
  } catch {
    // Sin red o sin service worker: se reintenta en el siguiente inicio de sesión.
  }
}

/** Al cerrar sesión, este dispositivo deja de recibir avisos de la cuenta que salió. */
export async function releasePush() {
  try {
    if (!pushSupported()) return;
    const subscription = await currentSubscription();
    if (subscription) await pushApi.unsubscribe(subscription.endpoint);
  } catch {
    // Si falla, el servidor lo corrige al caducar la suscripción.
  }
}
