import { useEffect, useRef, useState } from 'react';
import { auth } from '../../api/client.js';
import { Avatar } from '../../components/Avatar.jsx';
import { trapTabKey } from '../../components/Drawer.jsx';
import { CameraIcon, CloseIcon } from '../../components/icons.jsx';
import { ManagementField } from '../ManagementField.jsx';

const ROLE_LABEL = { ADMIN: 'Administrador', COURIER: 'Domiciliario' };
const PHOTO_SIZE = 160;

/** Recorta al centro y reduce a 160×160 JPEG (~10 KB) en el propio teléfono. */
export async function resizePhoto(file) {
  if (!file.type.startsWith('image/')) throw new Error('Elige un archivo de imagen.');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('No se pudo leer la imagen. Prueba con otra foto (JPG o PNG).');
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_SIZE;
  canvas.height = PHOTO_SIZE;
  canvas.getContext('2d').drawImage(
    bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE,
  );
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Panel lateral de perfil (diálogo modal): nombre, foto pequeña y
 * cambio de contraseña. Escape u overlay lo cierran; el foco vuelve
 * al botón del perfil.
 */
export function ProfilePanel({ open, user, onClose, onUpdated }) {
  const panelRef = useRef(null);
  const previousFocus = useRef(null);
  const [draft, setDraft] = useState({ nombre: '', foto: null });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    setDraft({ nombre: user.nombre, foto: user.foto ?? null });
    setErrors({});
    setNotice('');
    setPasswords(null);
    panelRef.current?.querySelector('.profile-close')?.focus();
    function onKey(event) {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'Tab' && panelRef.current) trapTabKey(event, panelRef.current);
    }
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previousFocus.current?.focus?.();
    };
    // Solo al abrir/cerrar: el borrador no debe reiniciarse en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function choosePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const foto = await resizePhoto(file);
      setDraft((current) => ({ ...current, foto }));
      setNotice('Foto lista. Pulsa «Guardar perfil».');
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!draft.nombre.trim()) {
      setErrors({ nombre: 'Escribe tu nombre.' });
      return;
    }
    setSaving(true);
    try {
      const result = await auth.updateProfile({ nombre: draft.nombre.trim(), foto: draft.foto });
      onUpdated(result.usuario);
      setErrors({});
      setNotice('Perfil guardado.');
    } catch (error) {
      setErrors(error.fields ?? {});
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    const next = {};
    if (!passwords.actual) next.actual = 'Escribe tu contraseña actual.';
    if (passwords.nueva.length < 8 || passwords.nueva.length > 72) next.nueva = 'Entre 8 y 72 caracteres.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await auth.changePassword(passwords.actual, passwords.nueva);
      setPasswords(null);
      setNotice('Contraseña cambiada. Se cerraron tus sesiones en otros dispositivos.');
    } catch (error) {
      setErrors(error.fields ?? {});
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel-overlay" onClick={onClose} data-testid="profile-overlay">
      <aside
        ref={panelRef}
        className="profile-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-panel-header">
          <h2 id="profile-title">Mi perfil</h2>
          <button type="button" className="icon-btn profile-close" aria-label="Cerrar perfil" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form className="profile-form" onSubmit={saveProfile} noValidate>
          <div className="profile-photo">
            <Avatar user={{ nombre: draft.nombre || user.nombre, foto: draft.foto }} size="large" />
            <div className="profile-photo-actions">
              <label className="btn-secondary profile-photo-pick">
                <CameraIcon size={20} />
                <span>{draft.foto ? 'Cambiar foto' : 'Añadir foto'}</span>
                <input type="file" accept="image/*" className="visually-hidden" onChange={choosePhoto} />
              </label>
              {draft.foto && (
                <button type="button" className="btn-help" onClick={() => setDraft({ ...draft, foto: null })}>
                  Quitar foto
                </button>
              )}
            </div>
          </div>
          <ManagementField label="Nombre" maxLength={60} value={draft.nombre} onChange={(event) => setDraft({ ...draft, nombre: event.target.value })} error={errors.nombre} />
          <dl className="profile-facts">
            <div><dt>Usuario</dt><dd>@{user.usuario}</dd></div>
            <div><dt>Rol</dt><dd>{ROLE_LABEL[user.role]}</dd></div>
          </dl>
          <button type="submit" className="btn-primary" disabled={saving} aria-busy={saving}>Guardar perfil</button>
        </form>

        <p role="status" className="management-notice">{notice}</p>

        {passwords ? (
          <form className="profile-form" onSubmit={savePassword} noValidate>
            <h3>Cambiar contraseña</h3>
            <ManagementField label="Contraseña actual" type="password" autoComplete="current-password" value={passwords.actual} onChange={(event) => setPasswords({ ...passwords, actual: event.target.value })} error={errors.actual} />
            <ManagementField label="Nueva contraseña" type="password" autoComplete="new-password" maxLength={72} value={passwords.nueva} onChange={(event) => setPasswords({ ...passwords, nueva: event.target.value })} error={errors.nueva} hint="Mínimo 8 caracteres." />
            <div className="management-actions">
              <button type="submit" className="btn-primary" disabled={saving}>Guardar contraseña</button>
              <button type="button" className="btn-secondary" onClick={() => setPasswords(null)}>Cancelar</button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn-secondary" onClick={() => { setPasswords({ actual: '', nueva: '' }); setErrors({}); }}>
            Cambiar contraseña
          </button>
        )}
      </aside>
    </div>
  );
}
