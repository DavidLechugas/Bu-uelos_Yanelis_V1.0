import { useCallback, useEffect, useRef, useState } from 'react';
import { ordersApi } from '../../api/client.js';
import { useNotice } from '../feedback/Toast.jsx';
import { loadPreferences } from '../settings/preferences.js';
import { detectAlerts, summarize } from './orderAlerts.js';

const BACKGROUND_POLL_MS = 15000;
const BASE_TITLE = 'Buñuelos Yanelys';

let audio;

function beep() {
  try {
    audio ??= new (window.AudioContext ?? window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    [660, 880].forEach((frequency, index) => {
      const start = audio.currentTime + index * 0.16;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.15);
    });
  } catch {
    // Sin audio disponible: el aviso visual basta.
  }
}

function setBadge(count) {
  document.title = count > 0 ? `(${count}) ${BASE_TITLE}` : BASE_TITLE;
  if (count > 0) navigator.setAppBadge?.(count)?.catch?.(() => {});
  else navigator.clearAppBadge?.()?.catch?.(() => {});
}

/**
 * Avisos de pedidos nuevos o cambiados. La vista Pedidos entrega cada lista que carga
 * (`report`) y las que cambia el propio usuario (`baseline`, que no avisan); con otra
 * vista abierta, este hook consulta los pedidos por su cuenta.
 */
export function useOrderAlerts({ user, pedidosActive }) {
  const [unseen, setUnseen] = useState(0);
  const [notice, setNotice] = useNotice();
  const last = useRef(null);
  const state = useRef({ user, pedidosActive });
  state.current = { user, pedidosActive };

  const report = useCallback((list) => {
    const current = state.current;
    const alerts = current.user ? detectAlerts(last.current, list, current.user) : [];
    last.current = list;
    if (!alerts.length) return;
    setNotice(summarize(alerts));
    if (!current.pedidosActive) setUnseen((count) => count + alerts.length);
    if (loadPreferences().alertSound) {
      beep();
      navigator.vibrate?.([120, 60, 120]);
    }
  }, [setNotice]);

  const baseline = useCallback((list) => { last.current = list; }, []);

  const userId = user?.id;
  useEffect(() => {
    last.current = null;
    setUnseen(0);
  }, [userId]);

  useEffect(() => {
    if (pedidosActive) setUnseen(0);
  }, [pedidosActive]);

  useEffect(() => {
    if (!userId || pedidosActive) return undefined;
    let cancelled = false;
    const poll = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const list = await ordersApi.list();
        if (!cancelled) report(list);
      } catch {
        // Sin red o sesión vencida: el siguiente intento lo reintenta.
      }
    };
    poll();
    const timer = setInterval(poll, BACKGROUND_POLL_MS);
    document.addEventListener('visibilitychange', poll);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [userId, pedidosActive, report]);

  useEffect(() => {
    setBadge(unseen);
  }, [unseen]);

  return { unseen, notice, closeNotice: () => setNotice(''), report, baseline };
}
