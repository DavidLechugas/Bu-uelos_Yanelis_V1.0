import { useState } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { LEGAL_DOCS, LEGAL_UPDATED } from './legalText.js';

function LegalDocument({ doc }) {
  return (
    <div className="legal-body">
      <p className="legal-updated">Actualizada el {LEGAL_UPDATED}</p>
      {doc.sections.map((section) => (
        <section key={section.heading}>
          <h3>{section.heading}</h3>
          {section.paragraphs?.map((text) => <p key={text}>{text}</p>)}
          {section.list && <ul>{section.list.map((item) => <li key={item}>{item}</li>)}</ul>}
        </section>
      ))}
    </div>
  );
}

/** Enlaces a la política de privacidad y a los términos, que se leen en una ventana sin salir de la app. */
export function LegalLinks({ prefix }) {
  const [open, setOpen] = useState(null);
  const doc = open ? LEGAL_DOCS[open] : null;

  return (
    <>
      <p className="legal-links">
        {prefix}
        <button type="button" className="legal-link" aria-haspopup="dialog" onClick={() => setOpen('privacidad')}>Política de privacidad</button>
        {' y los '}
        <button type="button" className="legal-link" aria-haspopup="dialog" onClick={() => setOpen('terminos')}>Términos y condiciones</button>
        .
      </p>
      <Modal open={Boolean(doc)} title={doc?.title ?? ''} onClose={() => setOpen(null)} focusField={false}>
        {doc && <LegalDocument doc={doc} />}
      </Modal>
    </>
  );
}
