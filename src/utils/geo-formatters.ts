/**
 * ==============================================================================
 * 🌐 PARTIU — GEO & TIMEZONE UNIVERSAL FORMATTERS (i18n & L10n ENGINE)
 * ==============================================================================
 * Utilitários oficiais para manipulação, internacionalização e conversão de
 * fusos horários (Timezone Awareness), moedas dinâmicas e distâncias geodésicas.
 *
 * Invariantes:
 * - Todos os timestamps de banco de dados são interpretados a partir de UTC.
 * - A renderização no cliente adapta-se dinamicamente ao fuso horário local do
 *   dispositivo (ou ao fuso da praça/tenant quando especificado).
 * - A formatação de valores monetários adapta-se à moeda configurada no tenant.
 * ==============================================================================
 */

/**
 * Obtém o fuso horário resolvido do dispositivo do usuário (ex: 'America/Sao_Paulo', 'Europe/Lisbon', 'America/New_York')
 */
export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Converte qualquer representação de data para um objeto Date seguro em UTC
 */
export function toSafeDate(input: Date | string | number): Date {
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);
  if (typeof input === "string") {
    // Se não tiver indicador de fuso, assume UTC
    if (!input.endsWith("Z") && !input.includes("+") && !input.includes("-", 10)) {
      return new Date(`${input}Z`);
    }
    return new Date(input);
  }
  return new Date();
}

/**
 * Formata data e hora respeitando o fuso horário local do dispositivo ou o fuso da praça
 */
export function formatarDataHora(
  input: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  customTimezone?: string,
  locale = "pt-BR"
): string {
  try {
    const date = toSafeDate(input);
    const tz = customTimezone || getDeviceTimezone();
    const resolvedOptions: Intl.DateTimeFormatOptions = options
      ? { timeZone: tz, ...options }
      : {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: tz,
        };
    return new Intl.DateTimeFormat(locale, resolvedOptions).format(date);
  } catch {
    return String(input);
  }
}

/**
 * Formata apenas o horário (hora e minuto) no fuso horário do usuário
 */
export function formatarHoraMinuto(
  input: Date | string | number,
  customTimezone?: string,
  locale = "pt-BR"
): string {
  return formatarDataHora(
    input,
    { hour: "2-digit", minute: "2-digit" },
    customTimezone,
    locale
  );
}

/**
 * Formata apenas a data civil (dia/mês/ano) no fuso horário do usuário
 */
export function formatarDataCurta(
  input: Date | string | number,
  customTimezone?: string,
  locale = "pt-BR"
): string {
  return formatarDataHora(
    input,
    { day: "2-digit", month: "2-digit", year: "numeric" },
    customTimezone,
    locale
  );
}

/**
 * Formatação de moeda universal e configurável por tenant (BRL, USD, EUR, etc.)
 */
export function formatarMoeda(
  valor: number,
  moedaCodigo = "BRL",
  locale = "pt-BR"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: moedaCodigo,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  } catch {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
  }
}

/**
 * Formata metros para representação legível (ex: "80 m", "1,4 km")
 */
export function formatarDistancia(metros: number): string {
  if (metros < 1000) {
    return `${Math.round(metros)} m`;
  }
  const km = metros / 1000;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

/**
 * Formata coordenadas [lat, lng] com precisão fixa
 */
export function formatarCoordenadas(lat: number, lng: number, casasDecimais = 4): string {
  return `${lat.toFixed(casasDecimais)}, ${lng.toFixed(casasDecimais)}`;
}
