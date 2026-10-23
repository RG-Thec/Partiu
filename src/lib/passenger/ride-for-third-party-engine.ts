/**
 * ==============================================================================
 * 👥 PARTIU MOBILIDADE — RIDE FOR THIRD PARTY ENGINE (v1.0)
 * ==============================================================================
 * Gerenciamento do fluxo de "Pedir para um Amigo ou Familiar".
 *
 * Funcionalidades:
 * - Validação e normalização de nome e telefone celular brasileiro (DDD + 9 dígitos)
 * - Geração de mensagem estruturada e link universal de WhatsApp com token de rastreio ao vivo
 * - Vinculação mandatória de PIN de segurança para impedir embarque no veículo errado
 * ==============================================================================
 */

export interface ThirdPartyRiderValidation {
  isValid: boolean;
  error?: string;
  cleanedName: string;
  normalizedPhone: string;
  e164Phone: string;
}

export interface BuildThirdPartyShareOptions {
  guestName: string;
  guestPhone: string;
  bookerName: string;
  driverName: string;
  driverRating?: number;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor?: string;
  pickupAddress: string;
  destinationAddress?: string;
  boardingPin: string;
  trackingToken: string;
  appName?: string;
}

export class RideForThirdPartyEngine {
  /**
   * Normaliza e valida o telefone brasileiro e o nome do passageiro terceiro
   */
  public validateGuestRider(name: string, phone: string): ThirdPartyRiderValidation {
    const cleanedName = (name || "").trim();
    if (cleanedName.length < 3) {
      return {
        isValid: false,
        error: "Informe o nome completo do passageiro.",
        cleanedName,
        normalizedPhone: "",
        e164Phone: "",
      };
    }

    const digitsOnly = (phone || "").replace(/\D/g, "");
    // Valida celulares brasileiros: 10 dígitos (fixo/antigo) ou 11 dígitos (com 9)
    if (digitsOnly.length < 10 || digitsOnly.length > 11) {
      return {
        isValid: false,
        error: "Telefone inválido. Digite o DDD e o número do celular.",
        cleanedName,
        normalizedPhone: "",
        e164Phone: "",
      };
    }

    // Formata máscara nacional (XX) 9XXXX-XXXX
    let formattedNational = "";
    if (digitsOnly.length === 11) {
      const ddd = digitsOnly.slice(0, 2);
      const part1 = digitsOnly.slice(2, 7);
      const part2 = digitsOnly.slice(7);
      formattedNational = `(${ddd}) ${part1}-${part2}`;
    } else {
      const ddd = digitsOnly.slice(0, 2);
      const part1 = digitsOnly.slice(2, 6);
      const part2 = digitsOnly.slice(6);
      formattedNational = `(${ddd}) ${part1}-${part2}`;
    }

    const e164Phone = `55${digitsOnly}`;

    return {
      isValid: true,
      cleanedName,
      normalizedPhone: formattedNational,
      e164Phone,
    };
  }

  /**
   * Constrói o texto do convite e o link direto da API do WhatsApp
   */
  public buildThirdPartyWhatsAppShare(options: BuildThirdPartyShareOptions): {
    shareText: string;
    whatsappUrl: string;
    trackingUrl: string;
  } {
    const {
      guestName,
      guestPhone,
      bookerName,
      driverName,
      driverRating = 4.98,
      vehicleModel,
      vehiclePlate,
      vehicleColor = "Cor do veículo",
      pickupAddress,
      boardingPin,
      trackingToken,
      appName = "PARTIU",
    } = options;

    const validation = this.validateGuestRider(guestName, guestPhone);
    const originUrl =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://partiumobe.com.br";

    const trackingUrl = `${originUrl}/rastreio/${trackingToken}`;

    const textParts = [
      `Olá, ${guestName}! ${bookerName} pediu um ${appName} para você.`,
      "",
      `🚗 Motorista: ${driverName} (${driverRating.toFixed(2)}★)`,
      `🚙 Veículo: ${vehicleModel} • ${vehicleColor}`,
      `🔢 Placa: ${vehiclePlate.toUpperCase()}`,
      `🔐 PIN de embarque: ${boardingPin}`,
      `📍 Local de encontro: ${pickupAddress}`,
      "",
      `Acompanhe a chegada do motorista no mapa ao vivo:`,
      trackingUrl,
      "",
      "Informe o código PIN ao motorista antes de entrar no carro.",
    ];

    const shareText = textParts.join("\n");
    const encodedText = encodeURIComponent(shareText);

    const whatsappUrl = validation.e164Phone
      ? `https://api.whatsapp.com/send?phone=${validation.e164Phone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    return {
      shareText,
      whatsappUrl,
      trackingUrl,
    };
  }
}

export const rideForThirdPartyEngine = new RideForThirdPartyEngine();
