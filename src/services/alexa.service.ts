import type {
  AlexaCard,
  AlexaOutputSpeech,
  AlexaRequest,
  AlexaResponse,
} from "../lib/alexa/type";
import type { Battery } from "../lib/battery/type";
import Memory from "../helpers/memory";
import retry from "../helpers/retry.helper";
import GrowattService from "./growatt.service";
import { logger } from "../helpers";

const MEMORY_KEY = "battery";

const WELCOME_MESSAGE =
  "Bienvenido a Planta. Puedes preguntarme por el nivel de batería o por el consumo del hogar. ¿Qué deseas saber?";
const HELP_MESSAGE =
  "Puedes preguntarme cosas como 'cuánta batería queda' o 'cuánto consume el hogar'. ¿Qué deseas saber?";
const GOODBYE_MESSAGE = "Hasta luego.";
const FALLBACK_MESSAGE =
  "Lo siento, no entendí eso. Puedes preguntarme por el nivel de batería o por el consumo del hogar.";
const ERROR_MESSAGE =
  "Lo siento, no pude obtener la información del inversor en este momento. Intenta de nuevo más tarde.";

class AlexaService {
  /**
   * Routes an Alexa request by type and intent name and builds the response.
   * @param request - The parsed Alexa Skills Kit request envelope.
   * @returns The Alexa-formatted response envelope.
   */
  public async handle(request: AlexaRequest): Promise<AlexaResponse> {
    logger.debug("Alexa request received", {
      type: request.request.type,
      locale: request.request.locale,
    });

    switch (request.request.type) {
      case "LaunchRequest":
        return this.launchResponse();
      case "IntentRequest":
        return this.handleIntent(request);
      case "SessionEndedRequest":
        return this.endSessionResponse();
      default:
        return this.fallbackResponse();
    }
  }

  /**
   * Builds the graceful error response used when the Growatt upstream fails.
   * @returns The Alexa-formatted error response.
   */
  public errorResponse(): AlexaResponse {
    return this.buildResponse(ERROR_MESSAGE, true);
  }

  private async handleIntent(request: AlexaRequest): Promise<AlexaResponse> {
    const intentName = request.request.intent?.name ?? "";
    logger.debug("Alexa intent routed", { intentName });

    switch (intentName) {
      case "BatteryLevelIntent":
        return this.batteryLevelResponse();
      case "HomeConsumptionIntent":
        return this.homeConsumptionResponse();
      case "AMAZON.HelpIntent":
        return this.helpResponse();
      case "AMAZON.CancelIntent":
      case "AMAZON.StopIntent":
        return this.stopResponse();
      default:
        logger.warn("Unknown Alexa intent", { intentName });
        return this.fallbackResponse();
    }
  }

  private async getBattery(): Promise<Battery> {
    const memory = Memory.getInstance();
    const cached = memory.get<Battery>(MEMORY_KEY);
    if (cached) return cached;
    const data = await retry(GrowattService.get, 3, 5);
    memory.set<Battery>(MEMORY_KEY, data);
    return data;
  }

  private async batteryLevelResponse(): Promise<AlexaResponse> {
    try {
      const battery = await this.getBattery();
      const level = Math.floor(battery.level);
      return this.buildResponse(
        `Tu inversor tiene actualmente ${level} por ciento de batería`,
        true,
      );
    } catch (error) {
      logger.error("Alexa battery fetch failed", { error });
      return this.errorResponse();
    }
  }

  private async homeConsumptionResponse(): Promise<AlexaResponse> {
    try {
      const battery = await this.getBattery();
      const watts = Math.floor(battery.output_power);
      return this.buildResponse(
        `El consumo actual del hogar es de ${watts} vatios.`,
        true,
      );
    } catch (error) {
      logger.error("Alexa battery fetch failed", { error });
      return this.errorResponse();
    }
  }

  private launchResponse(): AlexaResponse {
    return this.buildResponse(WELCOME_MESSAGE, false);
  }

  private helpResponse(): AlexaResponse {
    return this.buildResponse(HELP_MESSAGE, false);
  }

  private stopResponse(): AlexaResponse {
    return this.buildResponse(GOODBYE_MESSAGE, true);
  }

  private fallbackResponse(): AlexaResponse {
    return this.buildResponse(FALLBACK_MESSAGE, false);
  }

  private endSessionResponse(): AlexaResponse {
    return {
      version: "1.0",
      response: {
        shouldEndSession: true,
      },
    };
  }

  private buildResponse(
    text: string,
    shouldEndSession: boolean,
  ): AlexaResponse {
    const outputSpeech: AlexaOutputSpeech = { type: "PlainText", text };
    const card: AlexaCard = { type: "Simple", title: "Planta", content: text };
    return {
      version: "1.0",
      response: {
        outputSpeech,
        card,
        shouldEndSession,
      },
    };
  }
}

export default new AlexaService();