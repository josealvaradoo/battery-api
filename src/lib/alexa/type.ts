/** Supported Alexa request types. */
type AlexaRequestType =
  | "LaunchRequest"
  | "IntentRequest"
  | "SessionEndedRequest"
  | "CanFulfillIntentRequest";

/** Intent names handled by the skill (string union allows unknown intents for fallback). */
type AlexaIntentName =
  | "BatteryLevelIntent"
  | "HomeConsumptionIntent"
  | "AMAZON.HelpIntent"
  | "AMAZON.CancelIntent"
  | "AMAZON.StopIntent"
  | string;

/** The application object containing the skill ID. */
interface AlexaApplication {
  applicationId: string;
}

/** The System object in the context. */
interface AlexaSystem {
  application: AlexaApplication;
  user?: {
    userId: string;
    accessToken?: string;
  };
  device?: {
    deviceId: string;
  };
  apiEndpoint?: string;
  apiAccessToken?: string;
}

/** The context object in the request envelope. */
interface AlexaContext {
  System: AlexaSystem;
}

/** The intent object in an IntentRequest. */
interface AlexaIntent {
  name: AlexaIntentName;
  confirmationStatus: string;
  slots?: Record<
    string,
    {
      name: string;
      value: string;
      confirmationStatus: string;
    }
  >;
}

/** The request body object (varies by type). */
interface AlexaRequestBody {
  type: AlexaRequestType;
  requestId: string;
  timestamp: string;
  locale: string;
  intent?: AlexaIntent;
  reason?: string;
}

/** The session object (present for standard requests, absent for AudioPlayer etc.). */
interface AlexaSession {
  new: boolean;
  sessionId: string;
  application: AlexaApplication;
  user: {
    userId: string;
    accessToken?: string;
  };
  attributes?: Record<string, unknown>;
}

/** The full Alexa request envelope received via POST. */
interface AlexaRequest {
  version: string;
  session?: AlexaSession;
  context: AlexaContext;
  request: AlexaRequestBody;
}

/** Output speech types. */
type OutputSpeechType = "PlainText" | "SSML";

/** The outputSpeech object in the response. */
interface AlexaOutputSpeech {
  type: OutputSpeechType;
  text?: string;
  ssml?: string;
  playBehavior?: string;
}

/** The card object in the response. */
interface AlexaCard {
  type: "Simple" | "Standard";
  title: string;
  content?: string;
  text?: string;
  image?: {
    smallImageUrl?: string;
    largeImageUrl?: string;
  };
}

/** The reprompt object in the response. */
interface AlexaReprompt {
  outputSpeech: AlexaOutputSpeech;
}

/** The response body object. outputSpeech is optional because SessionEndedRequest responses omit it. */
interface AlexaResponseBody {
  outputSpeech?: AlexaOutputSpeech;
  card?: AlexaCard;
  reprompt?: AlexaReprompt;
  shouldEndSession: boolean;
}

/** The full Alexa response envelope returned to Alexa. */
interface AlexaResponse {
  version: string;
  sessionAttributes?: Record<string, unknown>;
  response: AlexaResponseBody;
}

export type {
  AlexaRequestType,
  AlexaIntentName,
  AlexaApplication,
  AlexaSystem,
  AlexaContext,
  AlexaIntent,
  AlexaRequestBody,
  AlexaSession,
  AlexaRequest,
  OutputSpeechType,
  AlexaOutputSpeech,
  AlexaCard,
  AlexaReprompt,
  AlexaResponseBody,
  AlexaResponse,
};