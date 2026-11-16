export type ReleaseCategory = 'fix' | 'improvement' | 'new feature';
export type ReleaseStatus = 'draft' | 'published';

export interface ReleaseUpdate {
  id: string;
  publishedAt: string;
  category: ReleaseCategory;
  status: ReleaseStatus;
  title: string;
  benefit: string;
  featureKey: string;
  href?: string;
  linkLabel?: string;
  titleEs?: string;
  benefitEs?: string;
  linkLabelEs?: string;
}

export const releaseUpdates: readonly ReleaseUpdate[] = [
  {
    id: '2026-11-11-authenticated-tailored-request',
    publishedAt: '2026-11-11',
    category: 'improvement',
    status: 'draft',
    title: 'Request tailored label help from the generator',
    benefit:
      'The customer-specific scenario links to the tailored-project form, with signed-in contact details and saved company name filled in for easy editing.',
    featureKey: 'authenticated_tailored_request',
    href: '/labels',
    linkLabel: 'Open the label generator'
  },
  {
    id: '2026-11-11-tailored-request-form',
    publishedAt: '2026-11-11',
    category: 'improvement',
    status: 'draft',
    title: 'A clearer way to request tailored work',
    benefit:
      'Visitors can suggest an improvement to the free tool or describe a customer-specific label, printer, or workflow requirement through the public guide.',
    featureKey: 'tailored_request_form',
    href: '/guide#custom-request',
    linkLabel: 'Suggest an improvement or discuss a project'
  },
  {
    id: '2026-11-08-basic-sscc-batch-and-preview',
    publishedAt: '2026-11-08',
    category: 'new feature',
    status: 'published',
    title: 'Generate several basic SSCC labels at once',
    benefit:
      'Basic SSCC labels can now be created in batches of up to 10. Each label receives its own SSCC, all pages are combined into one PDF, and the preview now uses the correct label shape and shows every requested page.',
    featureKey: 'basic_sscc_batch_pdf',
    href: '/labels?type=sscc_basic',
    linkLabel: 'Create basic SSCC labels',
    titleEs: 'Genera varias etiquetas SSCC básicas a la vez',
    benefitEs:
      'Las etiquetas SSCC básicas ahora se pueden crear en lotes de hasta 10. Cada etiqueta recibe su propio SSCC, todas las páginas se combinan en un solo PDF y la vista previa ahora usa la forma correcta de la etiqueta y muestra todas las páginas solicitadas.',
    linkLabelEs: 'Crear etiquetas SSCC básicas'
  },
  {
    id: '2026-10-30-label-detail-corrections',
    publishedAt: '2026-10-30',
    category: 'improvement',
    status: 'published',
    title: 'Refine existing label details',
    benefit:
      'Existing transport and identical-contents labels now use clearer field labels, consistent separator weights, better text clearance, and corrected GS1 data titles for content and batch/lot information.',
    featureKey: 'label_detail_corrections',
    href: '/labels',
    linkLabel: 'Create a label',
    titleEs: 'Refinar los detalles de etiquetas existentes',
    benefitEs:
      'Las etiquetas de transporte y de contenidos idénticos existentes ahora usan etiquetas de campo más claras, grosores de separador consistentes, mejor espacio para el texto y títulos de datos GS1 corregidos para la información de contenido y lote/partida.',
    linkLabelEs: 'Crear una etiqueta'
  },
  {
    id: '2026-10-22-app-shell-and-dark-mode',
    publishedAt: '2026-10-22',
    category: 'improvement',
    status: 'published',
    title: 'A clearer workspace and dark mode',
    benefit:
      'Marketing pages and the signed-in workspace are now separate: the site keeps a simple top header, while the app uses a left sidebar for Dashboard, Label Generator, Saved Labels, Settings, and owner Statistics. Every page also has a light and dark theme you can switch from the header.',
    featureKey: 'app_shell_dark_mode',
    href: '/dashboard',
    linkLabel: 'Open the workspace',
    titleEs: 'Un espacio de trabajo más claro y modo oscuro',
    benefitEs:
      'Las páginas de marketing y el espacio de trabajo autenticado ahora están separados: el sitio mantiene un encabezado superior simple, mientras que la aplicación usa una barra lateral izquierda para Panel, Generador de etiquetas, Etiquetas guardadas, Configuración y Estadísticas del propietario. Cada página también tiene un tema claro y oscuro que puedes cambiar desde el encabezado.',
    linkLabelEs: 'Abrir el espacio de trabajo'
  },
  {
    id: '2026-10-21-saved-products',
    publishedAt: '2026-10-22',
    category: 'new feature',
    status: 'published',
    title: 'Save your products for faster labels',
    benefit:
      'Products now have their own page in the sidebar, with brand and net content alongside each GTIN. Select a saved product when creating a label to fill its product fields; shipment details stay on each label.',
    featureKey: 'saved_products',
    href: '/products',
    linkLabel: 'Manage saved products',
    titleEs: 'Guarda tus productos para etiquetas más rápidas',
    benefitEs:
      'Los productos ahora tienen su propia página en la barra lateral, con marca y contenido neto junto a cada GTIN. Selecciona un producto guardado al crear una etiqueta para completar sus campos de producto; los detalles del envío permanecen en cada etiqueta.',
    linkLabelEs: 'Administrar productos guardados'
  },
  {
    id: '2026-10-20-data-export-excel',
    publishedAt: '2026-10-20',
    category: 'new feature',
    status: 'published',
    title: 'Download all of your data as Excel',
    benefit:
      'Export your account details, company settings (including GS1 company prefix), and every label you created in a single .xlsx file. Available in Settings under Data Export.',
    featureKey: 'data_export_excel',
    href: '/settings',
    linkLabel: 'Export your data',
    titleEs: 'Descarga todos tus datos como Excel',
    benefitEs:
      'Exporta los detalles de tu cuenta, la configuración de la empresa (incluido el prefijo de empresa GS1) y cada etiqueta que creaste en un solo archivo .xlsx. Disponible en Configuración en Exportación de datos.',
    linkLabelEs: 'Exportar tus datos'
  },
  {
    id: '2026-10-15-lan-printing',
    publishedAt: '2026-10-15',
    category: 'new feature',
    status: 'published',
    title: 'Send saved labels to a LAN printer',
    benefit:
      'Follow the linked Print Bridge setup guide, configure your network printer in Settings, then use Print via bridge in Saved labels. Existing labels and SSCCs are reused, with PDF and ZPL downloads still available.',
    featureKey: 'lan_printing',
    href: '/settings',
    linkLabel: 'Configure your printer',
    titleEs: 'Enviar etiquetas guardadas a una impresora LAN',
    benefitEs:
      'Sigue la guía de configuración de Print Bridge enlazada, configura tu impresora de red en Configuración y luego usa Imprimir mediante puente en Etiquetas guardadas. Las etiquetas y SSCC existentes se reutilizan, con las descargas de PDF y ZPL todavía disponibles.',
    linkLabelEs: 'Configurar tu impresora'
  },
  {
    id: '2026-10-08-zpl-download',
    publishedAt: '2026-10-08',
    category: 'new feature',
    status: 'published',
    title: 'Download saved labels as ZPL',
    benefit:
      'Download saved labels as .zpl files for compatible thermal printers. In Saved labels, choose 203, 300, or 600 dpi to match your printer and download using the existing SSCC.',
    featureKey: 'zpl_download',
    href: '/labels/history',
    linkLabel: 'Download a saved label',
    titleEs: 'Descargar etiquetas guardadas como ZPL',
    benefitEs:
      'Descarga las etiquetas guardadas como archivos .zpl para impresoras térmicas compatibles. En Etiquetas guardadas, elige 203, 300 o 600 ppp para que coincida con tu impresora y descarga usando el SSCC existente.',
    linkLabelEs: 'Descargar una etiqueta guardada'
  },
  {
    id: '2026-10-04-supported-label-guide',
    publishedAt: '2026-10-04',
    category: 'improvement',
    status: 'published',
    title: 'Compare supported labels before creating one',
    benefit:
      'A public visual guide now explains when to use each available label, the information and GS1 barcodes it contains, supported PDF sizes, and situations that need another solution.',
    featureKey: 'supported_label_guide',
    href: '/guide',
    linkLabel: 'Compare supported labels',
    titleEs: 'Compara las etiquetas compatibles antes de crear una',
    benefitEs:
      'Una guía visual pública ahora explica cuándo usar cada etiqueta disponible, la información y los códigos de barras GS1 que contiene, los tamaños de PDF compatibles y las situaciones que necesitan otra solución.',
    linkLabelEs: 'Comparar etiquetas compatibles'
  },
  {
    id: '2026-10-04-google-sign-in-errors',
    publishedAt: '2026-10-04',
    category: 'fix',
    status: 'published',
    title: 'Google sign-in failures explain the next step',
    benefit:
      'If Google sign-in is cancelled or cannot finish, the account page now shows safe recovery guidance and keeps the Google and email sign-in options available.',
    featureKey: 'google_sign_in_errors',
    href: '/login',
    linkLabel: 'Sign in',
    titleEs: 'Los fallos de inicio de sesión con Google explican el siguiente paso',
    benefitEs:
      'Si el inicio de sesión con Google se cancela o no puede terminar, la página de cuenta ahora muestra orientación de recuperación segura y mantiene disponibles las opciones de inicio de sesión con Google y correo electrónico.',
    linkLabelEs: 'Iniciar sesión'
  },
  {
    id: '2026-10-01-new-user-onboarding',
    publishedAt: '2026-10-01',
    category: 'improvement',
    status: 'published',
    title: 'The dashboard guides your first label',
    benefit:
      'A short checklist now shows the next step from company setup through preview and the first saved label, with clearer explanations for SSCC settings.',
    featureKey: 'first_label_onboarding',
    href: '/dashboard',
    linkLabel: 'Continue label setup',
    titleEs: 'El panel guía tu primera etiqueta',
    benefitEs:
      'Una lista de verificación corta ahora muestra el siguiente paso desde la configuración de la empresa hasta la vista previa y la primera etiqueta guardada, con explicaciones más claras para la configuración del SSCC.',
    linkLabelEs: 'Continuar la configuración de la etiqueta'
  },
  {
    id: '2026-10-01-label-preflight-summary',
    publishedAt: '2026-10-01',
    category: 'improvement',
    status: 'published',
    title: 'Preview explains the automated label checks',
    benefit:
      'Before saving, review the selected layout, encoded GS1 Application Identifiers, check digits, required associations, barcode fit, and the remaining physical-print warning.',
    featureKey: 'label_preflight_summary',
    href: '/labels',
    linkLabel: 'Review a label preview',
    titleEs: 'La vista previa explica las verificaciones automáticas de la etiqueta',
    benefitEs:
      'Antes de guardar, revisa el diseño seleccionado, los identificadores de aplicación GS1 codificados, los dígitos de control, las asociaciones requeridas, el ajuste del código de barras y la advertencia restante de impresión física.',
    linkLabelEs: 'Revisar una vista previa de etiqueta'
  },
  {
    id: '2026-10-01-identical-content-count-label',
    publishedAt: '2026-10-01',
    category: 'fix',
    status: 'published',
    title: 'Individual-item counts fit on the label',
    benefit:
      'Identical-content labels now print the concise unit “Each” so counts such as “120 Each” remain complete on both supported label sizes.',
    featureKey: 'identical_content_count_label',
    href: '/labels',
    linkLabel: 'Create an identical-contents label',
    titleEs: 'Los conteos de artículos individuales caben en la etiqueta',
    benefitEs:
      'Las etiquetas de contenidos idénticos ahora imprimen la unidad concisa "Each" para que los conteos como "120 Each" permanezcan completos en ambos tamaños de etiqueta compatibles.',
    linkLabelEs: 'Crear una etiqueta de contenidos idénticos'
  },
  {
    id: '2026-09-29-business-scenario-labels',
    publishedAt: '2026-09-29',
    category: 'improvement',
    status: 'published',
    title: 'Choose a label by the shipping problem it solves',
    benefit:
      'Start with a real-world shipping situation. Both available options now use clear transport zones, while identical-content shipments can use a larger 6 × 8 layout for lot and date traceability.',
    featureKey: 'business_scenario_labels',
    href: '/labels',
    linkLabel: 'Choose a shipping label',
    titleEs: 'Elige una etiqueta por el problema de envío que resuelve',
    benefitEs:
      'Comienza con una situación de envío del mundo real. Ambas opciones disponibles ahora usan zonas de transporte claras, mientras que los envíos de contenidos idénticos pueden usar un diseño más grande de 6 × 8 para trazabilidad de lote y fecha.',
    linkLabelEs: 'Elegir una etiqueta de envío'
  },
  {
    id: '2026-09-28-analytics-validation',
    publishedAt: '2026-09-28',
    category: 'improvement',
    status: 'published',
    title: 'Privacy-safe usage signals are more reliable',
    benefit:
      'Public contact actions now use controlled analytics values, while configured owner sessions stop sending product analytics after sign-in.',
    featureKey: 'analytics_validation',
    href: '/privacy',
    linkLabel: 'Review analytics privacy',
    titleEs: 'Las señales de uso que protegen la privacidad son más confiables',
    benefitEs:
      'Las acciones de contacto público ahora usan valores de analítica controlados, mientras que las sesiones de propietario configuradas dejan de enviar analítica del producto después de iniciar sesión.',
    linkLabelEs: 'Revisar la privacidad de la analítica'
  },
  {
    id: '2026-09-28-guided-label-workflows',
    publishedAt: '2026-09-28',
    category: 'improvement',
    status: 'published',
    title: 'Labels now begin with a clear logistics scenario',
    benefit:
      'Choose practical transport-label layouts or describe multiple identical contained items with optional batch/lot and a selected GS1 date type.',
    featureKey: 'guided_label_workflows',
    href: '/labels',
    linkLabel: 'Create a guided label',
    titleEs: 'Las etiquetas ahora comienzan con un escenario logístico claro',
    benefitEs:
      'Elige diseños prácticos de etiquetas de transporte o describe varios artículos contenidos idénticos con lote/partida opcional y un tipo de fecha GS1 seleccionado.',
    linkLabelEs: 'Crear una etiqueta guiada'
  },
  {
    id: '2026-09-27-atomic-sscc-allocation',
    publishedAt: '2026-09-27',
    category: 'fix',
    status: 'published',
    title: 'Simultaneous label creation is safer',
    benefit:
      'Each label now reserves its SSCC serial in the database, preventing simultaneous requests from receiving the same number.',
    featureKey: 'atomic_sscc_allocation',
    titleEs: 'La creación simultánea de etiquetas es más segura',
    benefitEs:
      'Cada etiqueta ahora reserva su serial SSCC en la base de datos, evitando que solicitudes simultáneas reciban el mismo número.'
  },
  {
    id: '2026-09-26-password-recovery',
    publishedAt: '2026-09-26',
    category: 'fix',
    status: 'published',
    title: 'Password recovery is available',
    benefit:
      'Request a secure, time-limited reset link from the sign-in page and choose a new password without support intervention.',
    featureKey: 'password_recovery',
    href: '/reset-password',
    linkLabel: 'Reset a password',
    titleEs: 'La recuperación de contraseña está disponible',
    benefitEs:
      'Solicita un enlace de restablecimiento seguro y con tiempo limitado desde la página de inicio de sesión y elige una nueva contraseña sin intervención de soporte.',
    linkLabelEs: 'Restablecer una contraseña'
  },
  {
    id: '2026-09-25-private-usage-statistics',
    publishedAt: '2026-09-25',
    category: 'improvement',
    status: 'published',
    title: 'Product decisions now use aggregate statistics',
    benefit:
      'Private aggregate reporting now helps prioritize onboarding and reliability improvements while keeping emails, company names, and label contents out of the report.',
    featureKey: 'owner_statistics',
    href: '/privacy',
    linkLabel: 'Review analytics privacy',
    titleEs: 'Las decisiones de producto ahora usan estadísticas agregadas',
    benefitEs:
      'Los informes agregados privados ahora ayudan a priorizar las mejoras de incorporación y confiabilidad, manteniendo los correos, nombres de empresa y contenidos de etiquetas fuera del informe.',
    linkLabelEs: 'Revisar la privacidad de la analítica'
  },
  {
    id: '2026-09-24-usage-tracking-foundation',
    publishedAt: '2026-09-24',
    category: 'improvement',
    status: 'published',
    title: 'Usage signals now guide improvements',
    benefit:
      'Successful workflow milestones and controlled failure categories can now show where the label journey needs improvement without sending label contents to analytics.',
    featureKey: 'usage_tracking',
    href: '/privacy',
    linkLabel: 'Review analytics privacy',
    titleEs: 'Las señales de uso ahora guían las mejoras',
    benefitEs:
      'Los hitos exitosos del flujo y las categorías de fallo controladas ahora pueden mostrar dónde necesita mejora el recorrido de la etiqueta sin enviar contenidos de etiquetas a la analítica.',
    linkLabelEs: 'Revisar la privacidad de la analítica'
  },
  {
    id: '2026-09-24-whats-new-panel',
    publishedAt: '2026-09-24',
    category: 'new feature',
    status: 'published',
    title: "What's new is now visible",
    featureKey: 'release_history',
    benefit:
      'See recently released fixes, improvements, and features from the public home page and review the complete update history.',
    href: '/updates',
    linkLabel: 'View update history',
    titleEs: 'Novedades ahora es visible',
    benefitEs:
      'Consulta las correcciones, mejoras y funciones recién publicadas desde la página de inicio pública y revisa el historial completo de actualizaciones.',
    linkLabelEs: 'Ver el historial de actualizaciones'
  }
];

export function releaseCategoryLabel(category: ReleaseCategory, locale = 'en'): string {
  const isSpanish = String(locale).startsWith('es');
  if (isSpanish) {
    if (category === 'fix') return 'Corrección';
    if (category === 'improvement') return 'Mejora';
    if (category === 'new feature') return 'Nueva función';
  }
  if (category === 'fix') return 'Fix';
  if (category === 'improvement') return 'Improvement';
  if (category === 'new feature') return 'New feature';
  return category;
}

export function localizeRelease(update: ReleaseUpdate, locale = 'en'): ReleaseUpdate {
  const isSpanish = String(locale).startsWith('es');
  if (!isSpanish) return update;
  return {
    ...update,
    title: update.titleEs ?? update.title,
    benefit: update.benefitEs ?? update.benefit,
    linkLabel: update.linkLabelEs ?? update.linkLabel,
    category: update.category
  };
}

export function getPublishedReleases(
  updates: readonly ReleaseUpdate[] = releaseUpdates
): ReleaseUpdate[] {
  return updates
    .filter((update) => update.status === 'published')
    .sort(
      (first, second) =>
        second.publishedAt.localeCompare(first.publishedAt) || second.id.localeCompare(first.id)
    );
}

export function getRecentPublishedReleases(
  limit: number,
  updates: readonly ReleaseUpdate[] = releaseUpdates
): ReleaseUpdate[] {
  return getPublishedReleases(updates).slice(0, Math.max(0, limit));
}

export function formatReleaseDate(publishedAt: string, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale.startsWith('es') ? 'es-419' : 'en', {
    dateStyle: 'long',
    timeZone: 'UTC'
  }).format(new Date(`${publishedAt}T00:00:00Z`));
}
