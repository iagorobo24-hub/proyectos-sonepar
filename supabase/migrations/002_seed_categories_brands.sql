-- ============================================================
-- SEED: Categorías (familias) + Marcas conocidas
-- Datos extraídos de categoryMapping.js, hierarchy.json y marcasLogos.js
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- FAMILIAS (level 1) — las 10 categorías principales de Sonepar
-- ──────────────────────────────────────────────────────────
INSERT INTO categories (name, slug, level, parent_id, icon, description, tip, sort_order) VALUES
  ('CABLES', 'cables', 1, NULL, '🧶',
   'Cables de baja, media y alta tensión, mangueras y conductores especiales.',
   'Selecciona según la sección (mm²), el número de conductores y el aislamiento (PVC, Libre de Halógenos, etc.).', 1),
  ('DISTRIBUCION DE POTENCIA', 'potencia', 1, NULL, '⚡',
   'Aparamenta modular, envolventes, cuadros eléctricos y sistemas de gestión de cableado.',
   'Verifica la intensidad nominal (A), el poder de corte (kA) y el número de polos necesario.', 2),
  ('CONTROL Y AUTOMATIZACION INDUSTRIAL', 'control', 1, NULL, '⚙️',
   'Variadores de frecuencia, contactores, guardamotores, PLCs y sensores industriales.',
   'Dimensiona según la potencia del motor (kW), el tipo de carga y los protocolos de comunicación.', 3),
  ('AUTOMATIZACION DE EDIFICIOS', 'domotica', 1, NULL, '🏘️',
   'Domótica, sistemas KNX, videoporteros y mecanismos de control inteligente.',
   'Asegura la compatibilidad entre dispositivos y el protocolo de control (cableado o inalámbrico).', 4),
  ('ILUMINACION', 'iluminacion', 1, NULL, '💡',
   'Luminarias LED para interior, exterior, industrial, decorativa y alumbrado de emergencia.',
   'Calcula el nivel de iluminación requerido (lux) y elige la temperatura de color adecuada (K).', 5),
  ('HVAC', 'clima', 1, NULL, '❄️',
   'Sistemas de climatización, ventilación, calefacción y aire acondicionado.',
   'Calcula las frigorías o calorías necesarias según el volumen de la estancia y su aislamiento.', 6),
  ('SEGURIDAD Y HERRAMIENTAS', 'seguridad', 1, NULL, '🛡️',
   'Equipos de protección individual (EPIs), herramientas manuales, eléctricas y de medida.',
   'Usa herramientas con certificación VDE (1000V) para trabajos en tensión y EPIs homologados.', 7),
  ('FONTANERIA', 'fontaneria', 1, NULL, '🚿',
   'Sistemas de conducción de agua, sanitarios, grifería y accesorios de conexión.',
   'Verifica el material (cobre, multicapa, PVC) y el diámetro de las roscas o conexiones.', 8),
  ('ENERGIAS RENOVABLES', 'solar', 1, NULL, '☀️',
   'Paneles solares, inversores, baterías y puntos de recarga para vehículo eléctrico.',
   'Dimensiona el campo fotovoltaico según el consumo anual y la superficie disponible en cubierta.', 9),
  ('SERVICIOS', 'servicios', 1, NULL, '🚚',
   'Gestión de bobinas, palets, portes y otros servicios logísticos especializados.',
   'Consulta las condiciones de retorno de envases y los plazos de entrega especiales.', 10)
ON CONFLICT (name, parent_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- MARCAS — fabricantes conocidos con logos y colores
-- ──────────────────────────────────────────────────────────
INSERT INTO brands (name, slug, logo_url, color, website_url, country) VALUES
  -- Grandes fabricantes
  ('SCHNEIDER ELECTRIC', 'schneider-electric', '/logos/schneider.png', '#3DCD58', 'https://www.se.com/es/', 'FR'),
  ('ABB', 'abb', '/logos/abb.png', '#FF000F', 'https://new.abb.com/es', 'CH'),
  ('SIEMENS', 'siemens', '/logos/siemens.jpg', '#009999', 'https://www.siemens.com/es/', 'DE'),
  ('MITSUBISHI ELECTRIC', 'mitsubishi-electric', '/logos/mitsubishi.png', '#E60012', 'https://www.mitsubishielectric.com/', 'JP'),
  ('HAGER', 'hager', '/logos/hager.png', '#0055A4', 'https://www.hager.es/', 'DE'),
  ('LEGRAND', 'legrand', NULL, '#FF6600', 'https://www.legrand.es/', 'FR'),
  ('EATON', 'eaton', NULL, '#0072CE', 'https://www.eaton.com/es/', 'IE'),
  ('CHINT', 'chint', NULL, '#003399', 'https://www.chint.com/', 'CN'),
  -- Sensores e instrumentación
  ('IFM ELECTRONIC', 'ifm', '/logos/ifm.jpg', '#0050AA', 'https://www.ifm.com/es/', 'DE'),
  ('PEPPERL+FUCHS', 'pepperl-fuchs', '/logos/pepperl.png', '#0066CC', 'https://www.pepperl-fuchs.com/', 'DE'),
  ('SICK', 'sick', NULL, '#009FE3', 'https://www.sick.com/es/', 'DE'),
  ('OMRON', 'omron', NULL, '#003DA5', 'https://www.omron.es/', 'JP'),
  -- Iluminación
  ('PHILIPS', 'philips', '/logos/philips.jpg', '#0B5394', 'https://www.signify.com/es-es', 'NL'),
  ('LEDVANCE', 'ledvance', '/logos/ledvance.jpg', '#003366', 'https://www.ledvance.es/', 'DE'),
  ('ZEMPER', 'zemper', '/logos/zemper.png', '#006633', 'https://www.zemper.com/', 'ES'),
  ('TRILUX', 'trilux', NULL, '#0072B1', 'https://www.trilux.com/es/', 'DE'),
  ('DISANO', 'disano', NULL, '#FF6600', 'https://www.disano.it/', 'IT'),
  -- Cables
  ('GENERAL CABLE', 'general-cable', NULL, '#002855', 'https://www.generalcable.com/', 'US'),
  ('PRYSMIAN', 'prysmian', NULL, '#005DA6', 'https://www.prysmiangroup.com/es', 'IT'),
  ('NEXANS', 'nexans', NULL, '#0067B9', 'https://www.nexans.es/', 'FR'),
  ('MIGUELEZ', 'miguelez', NULL, '#CC0000', 'https://www.miguelez.com/', 'ES'),
  ('TOP CABLE', 'top-cable', NULL, '#0066CC', 'https://www.topcable.com/', 'ES'),
  ('EXCEL', 'excel', NULL, '#333333', NULL, 'UK'),
  ('TELEVES', 'televes', NULL, '#0099CC', 'https://www.televes.com/', 'ES'),
  -- Energía solar / renovables
  ('FRONIUS', 'fronius', '/logos/fronius.png', '#00A3E0', 'https://www.fronius.com/es-es/', 'AT'),
  ('SMA', 'sma', '/logos/sma.png', '#009640', 'https://www.sma.de/es/', 'DE'),
  ('PYLONTECH', 'pylontech', '/logos/pylontech.png', '#336699', 'https://www.pylontech.com/', 'CN'),
  ('VICTRON ENERGY', 'victron-energy', NULL, '#0051A5', 'https://www.victronenergy.com/', 'NL'),
  ('WALLBOX', 'wallbox', '/logos/wallbox.png', '#00BFFF', 'https://wallbox.com/es/', 'ES'),
  ('HUAWEI', 'huawei', NULL, '#CF0A2C', 'https://solar.huawei.com/es/', 'CN'),
  ('JINKO SOLAR', 'jinko-solar', NULL, '#003366', 'https://www.jinkosolar.com/', 'CN'),
  ('CANADIAN SOLAR', 'canadian-solar', NULL, '#003366', 'https://www.canadiansolar.com/', 'CA'),
  -- HVAC
  ('DAIKIN', 'daikin', NULL, '#003366', 'https://www.daikin.es/', 'JP'),
  ('MITSUBISHI HEAVY', 'mitsubishi-heavy', NULL, '#E60012', 'https://www.mhiae.com/', 'JP'),
  ('JUNKERS', 'junkers', NULL, '#003366', 'https://www.junkers.es/', 'DE'),
  ('VAILLANT', 'vaillant', NULL, '#00994C', 'https://www.vaillant.es/', 'DE'),
  -- Fontanería
  ('UPONOR', 'uponor', NULL, '#0082C8', 'https://www.uponor.es/', 'FI'),
  ('GIACOMINI', 'giacomini', NULL, '#0066CC', 'https://www.giacomini.com/es/', 'IT'),
  -- Herramientas
  ('FLUKE', 'fluke', NULL, '#FFCC00', 'https://www.fluke.com/es/', 'US'),
  ('KNIPEX', 'knipex', NULL, '#CC0000', 'https://www.knipex.com/es/', 'DE'),
  ('WEIDMULLER', 'weidmuller', NULL, '#FF6600', 'https://www.weidmueller.com/es/', 'DE'),
  ('PHOENIX CONTACT', 'phoenix-contact', NULL, '#00843D', 'https://www.phoenixcontact.com/es/', 'DE'),
  ('WAGO', 'wago', NULL, '#003399', 'https://www.wago.com/es/', 'DE'),
  -- Domótica
  ('KNX', 'knx', NULL, '#006633', 'https://www.knx.org/', 'BE'),
  ('JUNG', 'jung', NULL, '#003366', 'https://www.jung.de/es/', 'DE'),
  ('BTICINO', 'bticino', NULL, '#003366', 'https://www.bticino.es/', 'IT'),
  ('NIESSEN', 'niessen', NULL, '#003366', NULL, 'ES'),
  ('SIMON', 'simon', NULL, '#000000', 'https://www.simonelectric.com/', 'ES')
ON CONFLICT (name) DO UPDATE SET
  logo_url = EXCLUDED.logo_url,
  color = EXCLUDED.color,
  website_url = EXCLUDED.website_url,
  country = EXCLUDED.country,
  updated_at = now();
