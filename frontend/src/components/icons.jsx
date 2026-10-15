/**
 * Iconos SVG propios (24×24, trazo de 2 px, color = currentColor).
 * Decorativos: siempre acompañan a un texto o a un aria-label.
 */
function Svg({ children, size = 24, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (props) => (
  <Svg {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9v11.5h5V15h3v5.5h5V9" />
  </Svg>
);

export const OrdersIcon = (props) => (
  <Svg {...props}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 2.5h6v3H9z" />
    <path d="M8.5 10.5h7M8.5 14h7M8.5 17.5h4" />
  </Svg>
);

export const DeliveryIcon = (props) => (
  <Svg {...props}>
    <circle cx="5.5" cy="17.5" r="2.5" />
    <circle cx="18.5" cy="17.5" r="2.5" />
    <path d="M8 17.5h6.5l3-6.5H14" />
    <path d="M14 11 12.5 6.5H10" />
    <rect x="2" y="8.5" width="6" height="5" rx="1" />
  </Svg>
);

export const MenuIcon = (props) => (
  <Svg {...props}>
    <path d="M4 6.5h16M4 12h16M4 17.5h16" />
  </Svg>
);

export const CloseIcon = (props) => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const CameraIcon = (props) => (
  <Svg {...props}>
    <path d="M4 8.5h3l1.5-2.5h7L17 8.5h3v11H4z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </Svg>
);

export const AlertIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3.5 2.5 20h19z" />
    <path d="M12 10v4.5M12 17.5v.01" />
  </Svg>
);
