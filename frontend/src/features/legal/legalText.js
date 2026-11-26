// Textos legales. Revisar con un abogado antes de darlos por definitivos.
export const LEGAL_UPDATED = '25 de noviembre de 2026';

export const LEGAL_DOCS = {
  privacidad: {
    title: 'Política de privacidad',
    sections: [
      {
        heading: 'Quién responde por tus datos',
        paragraphs: ['Buñuelos Yanelys es la responsable de los datos que se guardan en esta aplicación interna de gestión de pedidos y entregas. Para cualquier consulta sobre tus datos, habla con el administrador de la aplicación.'],
      },
      {
        heading: 'Qué datos guardamos',
        list: [
          'Del personal (administradores y domiciliarios): nombre, usuario, contraseña (guardada cifrada, nunca en texto), foto de perfil y datos de contacto si se registran.',
          'De los clientes, en cada pedido: nombre, teléfono, dirección de entrega y los productos pedidos.',
          'Del dispositivo: la suscripción técnica para enviarte avisos de pedidos, solo si activas las notificaciones.',
        ],
      },
      {
        heading: 'Para qué los usamos',
        paragraphs: ['Solo para tomar, asignar y entregar pedidos, y para que cada persona acceda a su cuenta de forma segura. No vendemos tus datos ni los usamos para publicidad ni para analítica.'],
      },
      {
        heading: 'Quién puede verlos',
        list: [
          'El administrador ve la información completa de los pedidos.',
          'Un domiciliario ve solo el primer nombre y la zona de un pedido disponible. El teléfono y la dirección exacta se muestran cuando el pedido es suyo.',
          'Pasados 3 días desde que un domiciliario cierra un pedido, el teléfono y la dirección dejan de mostrársele.',
        ],
      },
      {
        heading: 'Servicios que usamos',
        paragraphs: ['Para funcionar usamos proveedores que procesan datos por nuestra cuenta: Cloudflare (alojamiento de la aplicación y protección), Render (servidor), MongoDB Atlas (base de datos) y los servicios de notificaciones de Google, Mozilla, Apple y Microsoft según tu dispositivo. No usamos publicidad, analítica ni pagos de terceros.'],
      },
      {
        heading: 'Cookies y almacenamiento',
        paragraphs: ['Usamos una cookie de sesión y una de seguridad, ambas necesarias para iniciar sesión (la sesión dura 7 días). En tu dispositivo guardamos tus preferencias de apariencia y avisos. No usamos cookies de seguimiento.'],
      },
      {
        heading: 'Cuánto tiempo los guardamos',
        paragraphs: ['Los datos del personal se conservan mientras su cuenta exista. Los datos de los pedidos se conservan mientras el negocio los necesite para su operación. Las suscripciones de notificaciones se eliminan al cerrar sesión, al desactivar la cuenta o al cambiar la contraseña, y caducan a los 90 días.'],
      },
      {
        heading: 'Tus derechos',
        paragraphs: ['Puedes pedir conocer, corregir o eliminar tus datos personales, o retirar tu autorización, escribiendo al administrador. Como referencia, en Colombia aplica la Ley 1581 de 2012 de protección de datos personales. También puedes presentar una queja ante la Superintendencia de Industria y Comercio.'],
      },
      {
        heading: 'Cambios',
        paragraphs: [`Si esta política cambia, actualizaremos la fecha. Última actualización: ${LEGAL_UPDATED}.`],
      },
    ],
  },
  terminos: {
    title: 'Términos y condiciones',
    sections: [
      {
        heading: 'Qué es esta aplicación',
        paragraphs: ['Es una herramienta interna de Buñuelos Yanelys para gestionar productos, pedidos y entregas. Solo pueden usarla las personas a quienes el administrador les haya creado una cuenta.'],
      },
      {
        heading: 'Tu cuenta',
        list: [
          'Tu usuario y contraseña son personales. No los compartas ni uses cuentas de otras personas.',
          'Avisa al administrador si crees que alguien más conoce tu contraseña.',
          'Eres responsable de lo que se haga con tu cuenta.',
        ],
      },
      {
        heading: 'Uso permitido',
        list: [
          'Usa la información de clientes (nombre, teléfono, dirección) únicamente para entregar el pedido.',
          'No copies, compartas ni publiques esos datos, ni los uses para otros fines.',
          'No intentes acceder a datos o funciones que no te correspondan ni afectar el funcionamiento de la aplicación.',
        ],
      },
      {
        heading: 'Suspensión de cuentas',
        paragraphs: ['El administrador puede desactivar una cuenta o restablecer su contraseña en cualquier momento, por ejemplo cuando una persona deja de colaborar o se detecta un uso indebido.'],
      },
      {
        heading: 'Disponibilidad',
        paragraphs: ['Hacemos lo posible por mantener la aplicación disponible, pero puede haber interrupciones por mantenimiento o por fallas de internet o de los proveedores. La primera conexión puede tardar hasta un minuto.'],
      },
      {
        heading: 'Datos personales',
        paragraphs: ['El tratamiento de datos personales se describe en la Política de privacidad. Al iniciar sesión declaras que la has leído.'],
      },
      {
        heading: 'Cambios y ley aplicable',
        paragraphs: [`Podemos actualizar estos términos; la fecha de última actualización es ${LEGAL_UPDATED}. Se rigen por las leyes de Colombia.`],
      },
    ],
  },
};
