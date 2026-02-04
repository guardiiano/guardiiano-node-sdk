# guardiiano-node-sdk

SDK Node.js e plugin Fastify per il progetto Guardiiano.

## License

Licensed under [MIT](./LICENSE).

**Nota importante:** questo SDK è in fase di sviluppo. Al momento sono implementati solo i metodi `postAction`, `identifyDataSubject`, `getDataSubject` e `getMetrics`.

<a id="indice"></a>
## Indice

**SDK**
- [guardiiano-node-sdk](#guardiiano-node-sdk)
  - [License](#license)
  - [Indice](#indice)
  - [Funzionalità](#funzionalità)
  - [Requisiti](#requisiti)
  - [Installazione](#installazione)
  - [Superficie API](#superficie-api)
    - [Tipi](#tipi)
    - [Type Guard](#type-guard)
    - [Errori (export dedicato)](#errori-export-dedicato)
    - [Interfaccia GuardiianoSDKApi](#interfaccia-guardiianosdkapi)
    - [Factory](#factory)
  - [Retry](#retry)
    - [Configurazione Retry](#configurazione-retry)
    - [Formula Backoff](#formula-backoff)
    - [Abilitazione Retry a Doppio Livello](#abilitazione-retry-a-doppio-livello)
  - [Esempi di utilizzo (SDK)](#esempi-di-utilizzo-sdk)
    - [Creazione SDK](#creazione-sdk)
    - [Creazione SDK con parametri di default](#creazione-sdk-con-parametri-di-default)
    - [Identify Data Subject](#identify-data-subject)
    - [Disabilitare Retry per una singola chiamata](#disabilitare-retry-per-una-singola-chiamata)
    - [Post di un'azione](#post-di-unazione)
    - [Metriche](#metriche)
  - [Plugin Fastify](#plugin-fastify)
    - [Registrazione Plugin](#registrazione-plugin)
    - [Esempio route con type guard](#esempio-route-con-type-guard)
    - [Esempio `example.ts` (200 OK e 404)](#esempio-examplets-200-ok-e-404)
    - [Esempio route senza retry per singola chiamata](#esempio-route-senza-retry-per-singola-chiamata)
    - [Esempio gestione errori con try/catch](#esempio-gestione-errori-con-trycatch)
    - [Esempio gestione errori con controllo status](#esempio-gestione-errori-con-controllo-status)
    - [Esempio log in blocco degli header di tracing](#esempio-log-in-blocco-degli-header-di-tracing)
    - [Esempio con validazione schema Fastify](#esempio-con-validazione-schema-fastify)
    - [Esempio con validazione e mapping response](#esempio-con-validazione-e-mapping-response)
    - [Esempio con retry globale disabilitato e retry per chiamata](#esempio-con-retry-globale-disabilitato-e-retry-per-chiamata)
    - [Esempio con allowlist personalizzata dei retry](#esempio-con-allowlist-personalizzata-dei-retry)
    - [Esempio con backoff aggressivo](#esempio-con-backoff-aggressivo)
    - [Esempio di utilizzo `calculateBackoffDelay`](#esempio-di-utilizzo-calculatebackoffdelay)
    - [Esempio di invio Action con payload tipizzato](#esempio-di-invio-action-con-payload-tipizzato)
    - [Esempio di metrics tipizzate](#esempio-di-metrics-tipizzate)
    - [Esempio con timeout per richiesta](#esempio-con-timeout-per-richiesta)
    - [Esempio plugin Fastify con hook `onError`](#esempio-plugin-fastify-con-hook-onerror)
    - [Esempio logging strutturato con `pino`](#esempio-logging-strutturato-con-pino)
    - [Esempio `withRetry` + circuit breaker](#esempio-withretry--circuit-breaker)
    - [Esempio timeout + retry con policy separate (con logging e stop su errori non transienti)](#esempio-timeout--retry-con-policy-separate-con-logging-e-stop-su-errori-non-transienti)
    - [Avvio Server](#avvio-server)
  - [Gestione errori](#gestione-errori)
  - [Note](#note)
  - [Riepilogo metodi](#riepilogo-metodi)
  - [Common pitfalls](#common-pitfalls)
  - [Esempio wrapper per retry custom per method](#esempio-wrapper-per-retry-custom-per-method)
  - [Appendice](#appendice)
    - [Approfondimento: Retry esponenziale con Jitter](#approfondimento-retry-esponenziale-con-jitter)
    - [Disabilitare il retry solo per una chiamata](#disabilitare-il-retry-solo-per-una-chiamata)
    - [Lettura degli header di tracing](#lettura-degli-header-di-tracing)
    - [Quando usare `GuardiianoNetworkError`](#quando-usare-guardiianonetworkerror)
    - [Configurare un timeout per tentativo](#configurare-un-timeout-per-tentativo)
    - [Retry e idempotenza](#retry-e-idempotenza)
    - [Osservabilità e `correlationId`](#osservabilità-e-correlationid)

**Fastify**
- [Plugin Fastify](#plugin-fastify)
- [Registrazione Plugin](#registrazione-plugin)

**Esempi**
- [guardiiano-node-sdk](#guardiiano-node-sdk)
  - [License](#license)
  - [Indice](#indice)
  - [Funzionalità](#funzionalità)
  - [Requisiti](#requisiti)
  - [Installazione](#installazione)
  - [Superficie API](#superficie-api)
    - [Tipi](#tipi)
    - [Type Guard](#type-guard)
    - [Errori (export dedicato)](#errori-export-dedicato)
    - [Interfaccia GuardiianoSDKApi](#interfaccia-guardiianosdkapi)
    - [Factory](#factory)
  - [Retry](#retry)
    - [Configurazione Retry](#configurazione-retry)
    - [Formula Backoff](#formula-backoff)
    - [Abilitazione Retry a Doppio Livello](#abilitazione-retry-a-doppio-livello)
  - [Esempi di utilizzo (SDK)](#esempi-di-utilizzo-sdk)
    - [Creazione SDK](#creazione-sdk)
    - [Creazione SDK con parametri di default](#creazione-sdk-con-parametri-di-default)
    - [Identify Data Subject](#identify-data-subject)
    - [Disabilitare Retry per una singola chiamata](#disabilitare-retry-per-una-singola-chiamata)
    - [Post di un'azione](#post-di-unazione)
    - [Metriche](#metriche)
  - [Plugin Fastify](#plugin-fastify)
    - [Registrazione Plugin](#registrazione-plugin)
    - [Esempio route con type guard](#esempio-route-con-type-guard)
    - [Esempio `example.ts` (200 OK e 404)](#esempio-examplets-200-ok-e-404)
    - [Esempio route senza retry per singola chiamata](#esempio-route-senza-retry-per-singola-chiamata)
    - [Esempio gestione errori con try/catch](#esempio-gestione-errori-con-trycatch)
    - [Esempio gestione errori con controllo status](#esempio-gestione-errori-con-controllo-status)
    - [Esempio log in blocco degli header di tracing](#esempio-log-in-blocco-degli-header-di-tracing)
    - [Esempio con validazione schema Fastify](#esempio-con-validazione-schema-fastify)
    - [Esempio con validazione e mapping response](#esempio-con-validazione-e-mapping-response)
    - [Esempio con retry globale disabilitato e retry per chiamata](#esempio-con-retry-globale-disabilitato-e-retry-per-chiamata)
    - [Esempio con allowlist personalizzata dei retry](#esempio-con-allowlist-personalizzata-dei-retry)
    - [Esempio con backoff aggressivo](#esempio-con-backoff-aggressivo)
    - [Esempio di utilizzo `calculateBackoffDelay`](#esempio-di-utilizzo-calculatebackoffdelay)
    - [Esempio di invio Action con payload tipizzato](#esempio-di-invio-action-con-payload-tipizzato)
    - [Esempio di metrics tipizzate](#esempio-di-metrics-tipizzate)
    - [Esempio con timeout per richiesta](#esempio-con-timeout-per-richiesta)
    - [Esempio plugin Fastify con hook `onError`](#esempio-plugin-fastify-con-hook-onerror)
    - [Esempio logging strutturato con `pino`](#esempio-logging-strutturato-con-pino)
    - [Esempio `withRetry` + circuit breaker](#esempio-withretry--circuit-breaker)
    - [Esempio timeout + retry con policy separate (con logging e stop su errori non transienti)](#esempio-timeout--retry-con-policy-separate-con-logging-e-stop-su-errori-non-transienti)
    - [Avvio Server](#avvio-server)
  - [Gestione errori](#gestione-errori)
  - [Note](#note)
  - [Riepilogo metodi](#riepilogo-metodi)
  - [Common pitfalls](#common-pitfalls)
  - [Esempio wrapper per retry custom per method](#esempio-wrapper-per-retry-custom-per-method)
  - [Appendice](#appendice)
    - [Approfondimento: Retry esponenziale con Jitter](#approfondimento-retry-esponenziale-con-jitter)
    - [Disabilitare il retry solo per una chiamata](#disabilitare-il-retry-solo-per-una-chiamata)
    - [Lettura degli header di tracing](#lettura-degli-header-di-tracing)
    - [Quando usare `GuardiianoNetworkError`](#quando-usare-guardiianonetworkerror)
    - [Configurare un timeout per tentativo](#configurare-un-timeout-per-tentativo)
    - [Retry e idempotenza](#retry-e-idempotenza)
    - [Osservabilità e `correlationId`](#osservabilità-e-correlationid)

<a id="funzionalita"></a>
## Funzionalità

- Metodi SDK tipizzati per le API Guardiiano.
- Retry con backoff esponenziale e jitter per errori transitori.
- Plugin Fastify che espone `app.guardiiano`.
- Tipi TypeScript completi, inclusi type guard.

<a id="requisiti"></a>
## Requisiti

- Node.js con `fetch` disponibile (consigliato Node 18+).
- Fastify `4.x - 5.x` per il plugin.

<a id="installazione"></a>
## Installazione

Installa le dipendenze nel tuo progetto come di consueto.

<a id="superficie-api"></a>
## Superficie API

L'SDK si crea con `createGuardiianoSDK(baseUrl, options?)` e ritorna un oggetto che implementa l'interfaccia `GuardiianoSDKApi`.

<a id="tipi"></a>
### Tipi

```ts
export interface DataSubject<T = unknown> {
  id: string;
  dsToken: string;
  data: T;
  createdAt: string;
  updatedAt: string;
}
```

```ts
export interface Action<M = unknown> {
  userId: string;
  actionType: string;
  timestamp: string;
  payload: M;
}
```

<a id="type-guard"></a>
### Type Guard

`isDataSubject(obj)` è un validatore runtime e type guard TypeScript. Verifica che il valore abbia la forma attesa e che i campi richiesti siano del tipo corretto.

<a id="errori-export-dedicato"></a>
### Errori (export dedicato)

Gli errori sono esportati sia dal package principale sia dall'entrypoint dedicato:

```ts
import { GuardiianoSDKError, GuardiianoNetworkError } from "guardiiano-sdk/errors";
```

<a id="interfaccia-guardiianosdkapi"></a>
### Interfaccia GuardiianoSDKApi

```ts
export interface GuardiianoSDKApi {
  postAction<M>(params: { action: Action<M>; withRetry?: boolean }): Promise<void>;
  identifyDataSubject<T>(params: {
    username: string;
    data: T;
    withRetry?: boolean;
  }): Promise<DataSubject<T>>;
  getDataSubject<T = unknown>(params: { token: string; withRetry?: boolean }): Promise<DataSubject<T>>;
  getMetrics<T = unknown>(params?: { withRetry?: boolean }): Promise<T>;
}
```

<a id="factory"></a>
### Factory

```ts
createGuardiianoSDK(baseUrl: string, options?: RetryOptions): GuardiianoSDKApi
```

Il `baseUrl` viene normalizzato rimuovendo lo slash finale.

<a id="retry"></a>
## Retry

Il retry viene eseguito solo per:

- Codici HTTP in allowlist.
- Errori di rete (es. problemi di connessione, DNS, socket).

Per un approfondimento sul jitter backoff, vedi la sezione dedicata in Appendice:
- [Approfondimento: Retry esponenziale con Jitter](#approfondimento-retry-esponenziale-con-jitter)

Per default, l'allowlist è:

- 408
- 429
- 500
- 502
- 503
- 504

Non vengono effettuati retry per errori applicativi come `404` o `422`.

<a id="configurazione-retry"></a>
### Configurazione Retry

```ts
export interface RetryOptions {
  withRetry?: boolean;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  jitterMs?: number;
  retryableStatusCodes?: number[];
}
```

La configurazione è disponibile sia sulla factory sia sul plugin Fastify.

**Descrizione parametri (con default):**
- `withRetry` (default `true`): abilita o disabilita globalmente il retry per l'SDK (il retry effettivo richiede anche `withRetry` per singola chiamata).
- `maxRetries` (default `3`): numero massimo di tentativi di retry per richiesta, esclusa la prima chiamata.
- `baseDelayMs` (default `200`): ritardo base in millisecondi per il backoff esponenziale.
- `maxDelayMs` (default `2000`): limite massimo in millisecondi per il ritardo tra i tentativi.
- `backoffFactor` (default `2`): moltiplicatore del backoff esponenziale (es. `2` raddoppia il delay a ogni retry).
- `jitterMs` (default `200`): componente casuale in millisecondi aggiunta al delay per evitare thundering herd.
- `retryableStatusCodes` (default `[408, 429, 500, 502, 503, 504]`): lista di status HTTP per cui il retry è consentito (oltre agli errori di rete).

<a id="formula-backoff"></a>
### Formula Backoff

Il ritardo per il tentativo `attempt` è calcolato come:

```ts
delay = min(maxDelayMs, baseDelayMs * backoffFactor ** attempt + random(0..jitterMs))
```

<a id="abilitazione-retry-a-doppio-livello"></a>
### Abilitazione Retry a Doppio Livello

Il retry è abilitato solo quando **entrambi** i livelli sono `true`:

- `withRetry` globale (nelle `RetryOptions`)
- `withRetry` per singola chiamata

Questo permette di disabilitare il retry per singole operazioni anche se l'SDK è configurato per usarlo.

<a id="esempi-di-utilizzo-sdk"></a>
## Esempi di utilizzo (SDK)

<a id="creazione-sdk"></a>
### Creazione SDK

```ts
import { createGuardiianoSDK } from "guardiiano-sdk";

const sdk = createGuardiianoSDK("https://api.guardiiano.example", {
  withRetry: true,
  maxRetries: 4,
  baseDelayMs: 250,
  maxDelayMs: 3000,
  backoffFactor: 2,
  jitterMs: 150,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
});
```

<a id="creazione-sdk-con-parametri-di-default"></a>
### Creazione SDK con parametri di default

```ts
import { createGuardiianoSDK } from "guardiiano-sdk";

const sdk = createGuardiianoSDK("https://api.guardiiano.example");
```

<a id="identify-data-subject"></a>
### Identify Data Subject

```ts
interface Candidate {
  firstName: string;
  lastName: string;
  email: string;
  phone: number;
}

// Un DataSubject può essere identificato con qualsiasi tipo di dato.
// In questo esempio, Candidate è il tipo che identifica i DataSubject "Candidate".
const subject = await sdk.identifyDataSubject<Candidate>({
  username: "jane.doe",
  data: {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: 123456789,
  },
});
```

<a id="disabilitare-retry-per-una-singola-chiamata"></a>
### Disabilitare Retry per una singola chiamata

```ts
const subject = await sdk.getDataSubject<Candidate>({
  token: "019c2836-4bb6-7066-a174-b1123f21af08",
  withRetry: false,
});
```

<a id="post-di-unazione"></a>
### Post di un'azione

```ts
await sdk.postAction({
  action: {
    userId: "user-1",
    actionType: "candidate.created",
    timestamp: new Date().toISOString(),
    payload: { source: "web" },
  },
  withRetry: true,
});
```

<a id="metriche"></a>
### Metriche

```ts
const metrics = await sdk.getMetrics<{ total: number }>({ withRetry: true });
```

<a id="plugin-fastify"></a>
## Plugin Fastify

Il plugin decora Fastify con `guardiiano` ed espone la stessa API dell'SDK.

<a id="registrazione-plugin"></a>
### Registrazione Plugin

```ts
import Fastify from "fastify";
import guardiianoSdkPlugin from "guardiiano-sdk";

const app = Fastify({ logger: true });

app.register(guardiianoSdkPlugin, {
  baseUrl: "https://api.guardiiano.example",
  retry: {
    withRetry: true,
    maxRetries: 3,
    baseDelayMs: 200,
    maxDelayMs: 2000,
    backoffFactor: 2,
    jitterMs: 150,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },
});
```

<a id="esempio-route-con-type-guard"></a>
### Esempio route con type guard

```ts
import Fastify from "fastify";
import guardiianoSdkPlugin, { isDataSubject } from "guardiiano-sdk";

interface Candidate {
  firstName: string;
  lastName: string;
  phone: number;
  email: string;
  sourceId: number;
  figureId: number;
  birthday: string;
  gender: string;
}

const app = Fastify({ logger: true });

app.register(guardiianoSdkPlugin, { baseUrl: "https://api.guardiiano.example" });

app.get("/candidates/:token", async (request) => {
  const { token } = request.params as { token: string };
  const result = await app.guardiiano.getDataSubject<Candidate>({ token });

  if (isDataSubject(result)) {
    app.log.info({ data: result.data }, "received data subject");
  }

  return result;
});
```

<a id="esempio-examplets-200-ok-e-404"></a>
### Esempio `example.ts` (200 OK e 404)

Invocando `GET /candidates/:token` dell'esempio in `example.ts`, ecco due risposte reali:

**404 Not Found (token inesistente)**

```json
{
  "error": "Candidate not found",
  "code": "ERR_HTTP",
  "details": {
    "code": 404,
    "error": "Not Found",
    "message": "Data Subject not foundddddddd"
  },
  "headers": {
    "content-length": "75",
    "content-type": "application/json",
    "date": "Wed, 04 Feb 2026 13:20:23 GMT"
  }
}
```

**200 OK (token esistente)**

```json
{
  "id": "cb0e9eb1-8068-43d8-a794-ab5eb400aa18",
  "dsToken": "019c2836-4bb6-7066-a174-b1123f21af08",
  "data": {
    "email": "foo@bar.com",
    "name": "Foo",
    "phone": "3450086843",
    "surname": "Bar",
    "username": "foo@bar.com"
  },
  "createdAt": "2026-02-04T11:32:52.919104+01:00",
  "updatedAt": "2026-02-04T11:32:52.919104+01:00"
}
```

<a id="esempio-route-senza-retry-per-singola-chiamata"></a>
### Esempio route senza retry per singola chiamata

```ts
import Fastify from "fastify";
import guardiianoSdkPlugin from "guardiiano-sdk";

const app = Fastify({ logger: true });

app.register(guardiianoSdkPlugin, { baseUrl: "https://api.guardiiano.example" });

app.get("/candidates/:token/no-retry", async (request) => {
  const { token } = request.params as { token: string };
  return app.guardiiano.getDataSubject<Candidate>({ token, withRetry: false });
});
```

<a id="esempio-gestione-errori-con-trycatch"></a>
### Esempio gestione errori con try/catch

```ts
import Fastify from "fastify";
import guardiianoSdkPlugin from "guardiiano-sdk";

const app = Fastify({ logger: true });

app.register(guardiianoSdkPlugin, { baseUrl: "https://api.guardiiano.example" });

app.get("/metrics", async () => {
  try {
    return await app.guardiiano.getMetrics<{ total: number }>({ withRetry: true });
  } catch (error) {
    app.log.error(error, "failed to fetch metrics");
    return { total: 0 };
  }
});
```

<a id="esempio-gestione-errori-con-controllo-status"></a>
### Esempio gestione errori con controllo status

```ts
import Fastify from "fastify";
import guardiianoSdkPlugin from "guardiiano-sdk";
import { GuardiianoSDKError, GuardiianoNetworkError } from "guardiiano-sdk/errors";

const app = Fastify({ logger: true });

app.register(guardiianoSdkPlugin, { baseUrl: "https://api.guardiiano.example" });

app.get("/candidates/:token/safe", async (request, reply) => {
  const { token } = request.params as { token: string };
  try {
    return await app.guardiiano.getDataSubject<Candidate>({ token });
  } catch (error) {
    if (error instanceof GuardiianoSDKError && error.status === 404) {
      reply.code(404);
      return {
        error: "Candidate not found",
        details: error.responseBody,
        requestId: error.requestId,
        correlationId: error.correlationId,
      };
    }
    if (error instanceof GuardiianoNetworkError) {
      reply.code(503);
      return { error: "Network error", code: error.code };
    }
    reply.code(502);
    return {
      error: "Upstream error",
      code: error instanceof GuardiianoSDKError ? error.code : "ERR_UNKNOWN",
    };
  }
});
```

<a id="esempio-log-in-blocco-degli-header-di-tracing"></a>
### Esempio log in blocco degli header di tracing

```ts
import Fastify from "fastify";
import guardiianoSdkPlugin from "guardiiano-sdk";
import { GuardiianoSDKError } from "guardiiano-sdk/errors";

const app = Fastify({ logger: true });

app.register(guardiianoSdkPlugin, { baseUrl: "https://api.guardiiano.example" });

app.get("/candidates/:token/log-trace", async (request, reply) => {
  const { token } = request.params as { token: string };
  try {
    return await app.guardiiano.getDataSubject<Candidate>({ token });
  } catch (error) {
    if (error instanceof GuardiianoSDKError) {
      app.log.info({ trace: error.trace() }, "trace headers");
    }
    reply.code(502);
    return { error: "Upstream error" };
  }
});
```

<a id="esempio-con-validazione-schema-fastify"></a>
### Esempio con validazione schema Fastify

```ts
import Fastify from "fastify";
import guardiianoSdkPlugin from "guardiiano-sdk";
import { Static, Type } from "@sinclair/typebox";

const app = Fastify({ logger: true });

app.register(guardiianoSdkPlugin, { baseUrl: "https://api.guardiiano.example" });

const CandidateParams = Type.Object({
  token: Type.String(),
});

type CandidateParamsType = Static<typeof CandidateParams>;

app.get<{
  Params: CandidateParamsType;
}>(
  "/candidates/:token/validated",
  {
    schema: {
      params: CandidateParams,
    },
  },
  async (request) => {
    const { token } = request.params;
    return app.guardiiano.getDataSubject<Candidate>({ token });
  }
);
```

<a id="esempio-con-validazione-e-mapping-response"></a>
### Esempio con validazione e mapping response

```ts
import Fastify from "fastify";
import guardiianoSdkPlugin from "guardiiano-sdk";

const app = Fastify({ logger: true });

app.register(guardiianoSdkPlugin, { baseUrl: "https://api.guardiiano.example" });

app.get("/candidates/:token/min", async (request) => {
  const { token } = request.params as { token: string };
  const result = await app.guardiiano.getDataSubject<Candidate>({ token });
  return {
    id: result.id,
    token: result.dsToken,
    email: result.data.email,
  };
});
```

<a id="esempio-con-retry-globale-disabilitato-e-retry-per-chiamata"></a>
### Esempio con retry globale disabilitato e retry per chiamata

```ts
import { createGuardiianoSDK } from "guardiiano-sdk";

const sdk = createGuardiianoSDK("https://api.guardiiano.example", {
  withRetry: false,
});

await sdk.getMetrics({ withRetry: true }); // abilita il retry solo qui
```

<a id="esempio-con-allowlist-personalizzata-dei-retry"></a>
### Esempio con allowlist personalizzata dei retry

```ts
import { createGuardiianoSDK } from "guardiiano-sdk";

const sdk = createGuardiianoSDK("https://api.guardiiano.example", {
  retryableStatusCodes: [429, 503],
});
```

<a id="esempio-con-backoff-aggressivo"></a>
### Esempio con backoff aggressivo

```ts
import { createGuardiianoSDK } from "guardiiano-sdk";

const sdk = createGuardiianoSDK("https://api.guardiiano.example", {
  maxRetries: 5,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  backoffFactor: 3,
  jitterMs: 250,
});
```

<a id="esempio-di-utilizzo-calculatebackoffdelay"></a>
### Esempio di utilizzo `calculateBackoffDelay`

```ts
import { calculateBackoffDelay } from "guardiiano-sdk";

const delay = calculateBackoffDelay(2, 200, 2000, 2, 200);
console.log(`Delay calcolato: ${delay}ms`);
```

<a id="esempio-di-invio-action-con-payload-tipizzato"></a>
### Esempio di invio Action con payload tipizzato

```ts
import { createGuardiianoSDK } from "guardiiano-sdk";

const sdk = createGuardiianoSDK("https://api.guardiiano.example");

type ActionPayload = {
  source: "web" | "mobile";
  ip: string;
};

await sdk.postAction<ActionPayload>({
  action: {
    userId: "user-1",
    actionType: "candidate.created",
    timestamp: new Date().toISOString(),
    payload: { source: "web", ip: "127.0.0.1" },
  },
});
```

<a id="esempio-di-metrics-tipizzate"></a>
### Esempio di metrics tipizzate

```ts
import { createGuardiianoSDK } from "guardiiano-sdk";

const sdk = createGuardiianoSDK("https://api.guardiiano.example");

type Metrics = { total: number; bySource: Record<string, number> };

const metrics = await sdk.getMetrics<Metrics>({});
```

<a id="esempio-con-timeout-per-richiesta"></a>
### Esempio con timeout per richiesta

```ts
import { createGuardiianoSDK } from "guardiiano-sdk";

const sdk = createGuardiianoSDK("https://api.guardiiano.example");

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout exceeded")), timeoutMs)
    ),
  ]);

const result = await withTimeout(
  sdk.getDataSubject<Candidate>({ token: "019c2836-4bb6-7066-a174-b1123f21af08", withRetry: true }),
  1500
);
```

<a id="esempio-plugin-fastify-con-hook-onerror"></a>
### Esempio plugin Fastify con hook `onError`

```ts
import Fastify from "fastify";
import guardiianoSdkPlugin from "guardiiano-sdk";
import { GuardiianoSDKError, GuardiianoNetworkError } from "guardiiano-sdk/errors";

const app = Fastify({ logger: true });

app.register(guardiianoSdkPlugin, { baseUrl: "https://api.guardiiano.example" });

app.addHook("onError", async (request, reply, error) => {
  if (error instanceof GuardiianoSDKError) {
    request.log.error(
      {
        status: error.status,
        requestId: error.requestId,
        correlationId: error.correlationId,
      },
      "GuardiianoSDKError"
    );
  } else if (error instanceof GuardiianoNetworkError) {
    request.log.error({ code: error.code }, "GuardiianoNetworkError");
  }
});
```

<a id="esempio-logging-strutturato-con-pino"></a>
### Esempio logging strutturato con `pino`

```ts
import Fastify from "fastify";
import guardiianoSdkPlugin from "guardiiano-sdk";
import { GuardiianoSDKError } from "guardiiano-sdk/errors";

const logger = {
  level: "info",
  redact: ["req.headers.authorization"],
};

const app = Fastify({ logger });

app.register(guardiianoSdkPlugin, { baseUrl: "https://api.guardiiano.example" });

app.get("/candidates/:token/log", async (request) => {
  const { token } = request.params as { token: string };
  try {
    return await app.guardiiano.getDataSubject<Candidate>({ token });
  } catch (error) {
    if (error instanceof GuardiianoSDKError) {
      request.log.error(
        {
          code: error.code,
          status: error.status,
          requestId: error.requestId,
          correlationId: error.correlationId,
        },
        "SDK error"
      );
    }
    throw error;
  }
});
```

<a id="esempio-withretry-circuit-breaker"></a>
### Esempio `withRetry` + circuit breaker

```ts
import Fastify from "fastify";
import guardiianoSdkPlugin from "guardiiano-sdk";
import CircuitBreaker from "opossum";

const app = Fastify({ logger: true });

app.register(guardiianoSdkPlugin, { baseUrl: "https://api.guardiiano.example" });

const breaker = new CircuitBreaker(
  (token: string) => app.guardiiano.getDataSubject<Candidate>({ token, withRetry: false }),
  {
    timeout: 1500,
    errorThresholdPercentage: 50,
    resetTimeout: 5000,
  }
);

app.get("/candidates/:token/breaker", async (request, reply) => {
  const { token } = request.params as { token: string };
  try {
    return await breaker.fire(token);
  } catch (error) {
    reply.code(503);
    return { error: "Service temporarily unavailable" };
  }
});
```

<a id="esempio-timeout-retry-con-policy-separate-con-logging-e-stop-su-errori-non-transienti"></a>
### Esempio timeout + retry con policy separate (con logging e stop su errori non transienti)

```ts
import { createGuardiianoSDK } from "guardiiano-sdk";
import { GuardiianoSDKError } from "guardiiano-sdk/errors";

const sdk = createGuardiianoSDK("https://api.guardiiano.example", {
  withRetry: true, // retry interni SDK
  maxRetries: 2,
  baseDelayMs: 200,
  maxDelayMs: 1000,
});

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout exceeded")), timeoutMs)
    ),
  ]);

const perAttemptTimeoutMs = 1200;
const totalBudgetMs = 3500;
const start = Date.now();
const maxOuterRetries = 2; // retry esterni (policy separata)
const isNonTransient = (error: unknown) =>
  error instanceof GuardiianoSDKError && (error.status === 404 || error.status === 422);

const tryOnce = async (attempt: number) => {
  const ts = new Date().toISOString();
  console.log(`[retry] attempt=${attempt} ts=${ts}`);
  return withTimeout(
    sdk.getDataSubject<Candidate>({ token: "019c2836-4bb6-7066-a174-b1123f21af08", withRetry: true }),
    perAttemptTimeoutMs
  );
};

let lastError: unknown;
for (let attempt = 1; attempt <= maxOuterRetries + 1; attempt += 1) {
  try {
    if (Date.now() - start > totalBudgetMs) break;
    const result = await tryOnce(attempt);
    return result;
  } catch (error) {
    if (isNonTransient(error)) throw error;
    lastError = error;
  }
}

throw lastError;
```

<a id="avvio-server"></a>
### Avvio Server

```ts
const start = async () => {
  const port = Number(process.env.PORT ?? "3000");
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen({ port, host });
};

void start();
```

<a id="gestione-errori"></a>
## Gestione errori

L'SDK genera un errore quando riceve uno status non in allowlist o quando esaurisce i retry. Per gli errori HTTP viene lanciato `GuardiianoSDKError`, che include `responseBody`, `responseHeaders`, `requestId`, `correlationId` e gli header di tracing più comuni (se presenti): `traceparent`, `tracestate`, `baggage`, `x-amzn-trace-id`, `x-b3-traceid`, `x-b3-spanid`, `x-b3-parentspanid`, `x-b3-sampled`, `x-b3-flags`, `x-ot-span-context`. Per gli errori di rete viene lanciato `GuardiianoNetworkError` con `code` `ERR_NETWORK`.

<a id="note"></a>
## Note

- Se vuoi fare retry solo per metodi idempotenti, implementa un wrapper che filtri per HTTP method prima di chiamare l'SDK.
- Se il backend supporta idempotency keys, valutane l'uso per le `POST` che possono essere ritentate.

<a id="riepilogo-metodi"></a>
## Riepilogo metodi

| Metodo | Descrizione | Parametri |
| --- | --- | --- |
| `postAction` | Invia un evento/azione | `{ action, withRetry? }` |
| `identifyDataSubject` | Crea/identifica un data subject | `{ username, data, withRetry? }` |
| `getDataSubject` | Recupera un data subject | `{ token, withRetry? }` |
| `getMetrics` | Recupera metriche | `{ withRetry? }` |

<a id="common-pitfalls"></a>
## Common pitfalls

1. Retry su errori applicativi: evita di includere 4xx non transitori nella allowlist.
2. Retry su POST non idempotenti: abilitali solo se il backend gestisce deduplica o idempotency keys.
3. Timeout troppo basso: può mascherare un problema di rete e far fallire tutti i retry.
4. Logging dei trace headers: ricorda che potrebbero non essere presenti.

<a id="esempio-wrapper-per-retry-custom-per-method"></a>
## Esempio wrapper per retry custom per method

```ts
import { GuardiianoSDKApi } from "guardiiano-sdk";

const withMethodRetry = <T extends GuardiianoSDKApi>(sdk: T) => ({
  ...sdk,
  postAction: (params: Parameters<T["postAction"]>[0]) =>
    sdk.postAction({ ...params, withRetry: false }),
  identifyDataSubject: (params: Parameters<T["identifyDataSubject"]>[0]) =>
    sdk.identifyDataSubject({ ...params, withRetry: true }),
  getDataSubject: (params: Parameters<T["getDataSubject"]>[0]) =>
    sdk.getDataSubject({ ...params, withRetry: true }),
  getMetrics: (params?: Parameters<T["getMetrics"]>[0]) =>
    sdk.getMetrics({ ...(params ?? {}), withRetry: true }),
});
```

<a id="faq"></a>
<a id="appendice"></a>
## Appendice

<a id="approfondimento-retry-esponenziale-con-jitter"></a>
### Approfondimento: Retry esponenziale con Jitter

La strategia usata è un **retry esponenziale con jitter**:
- **Esponenziale**: il tempo di attesa cresce in modo esponenziale a ogni tentativo, così da dare al sistema il tempo di recuperare.
- **Jitter**: si aggiunge una componente casuale al delay per evitare che molte richieste ritentino nello stesso istante (thundering herd).

Perché questa tecnica:
- Riduce i picchi di carico concentrati sui servizi upstream.
- Minimizza il rischio di “sincronizzare” i retry di molti client.
- Migliora la probabilità di successo quando gli errori sono transitori.

In questo SDK il delay è calcolato con backoff esponenziale e jitter, e il retry avviene solo per codici allowlist o errori di rete, evitando errori applicativi (es. `404`).

Schema semplificato (esempio):

```
Tentativo 0: baseDelay = 200ms  -> delay ~ 200ms + jitter(0..200)
Tentativo 1: baseDelay = 200ms  -> delay ~ 400ms + jitter(0..200)
Tentativo 2: baseDelay = 200ms  -> delay ~ 800ms + jitter(0..200)
Tentativo 3: baseDelay = 200ms  -> delay ~ 1600ms + jitter(0..200)
```

Grafico ASCII (jitter illustrativo):

```
Delay (ms)
1600 |                              *    *   *
 800 |                 *   *   *  *
 400 |        *   *   *
 200 |  *  *  *
    0 +-----------------------------------------
        t0  t1  t2  t3  t4  t5  t6  t7  t8
```

Tabella numerica (esempio con `baseDelayMs=200`, `backoffFactor=2`, `jitterMs=200`):

| Tentativo | Delay base (ms) | Jitter (0..200) | Delay totale (ms) |
| --- | --- | --- | --- |
| 0 | 200 | 0..200 | 200..400 |
| 1 | 400 | 0..200 | 400..600 |
| 2 | 800 | 0..200 | 800..1000 |
| 3 | 1600 | 0..200 | 1600..1800 |

Nota: se `maxDelayMs` è impostato, la formula applicata è **prima il clamp, poi il jitter**:
`delay = min(maxDelayMs, baseDelayMs * backoffFactor ** attempt) + jitter(0..jitterMs)`
e infine il risultato viene nuovamente limitato a `maxDelayMs` (per evitare sforamenti).

Esempio con `maxDelayMs=1000`:

| Tentativo | Delay base (ms) | Jitter (0..200) | Delay totale (ms) |
| --- | --- | --- | --- |
| 0 | 200 | 0..200 | 200..400 |
| 1 | 400 | 0..200 | 400..600 |
| 2 | 800 | 0..200 | 800..1000 |
| 3 | 1600 -> 1000 | 0..200 | 1000..1200 |

Esempio con `backoffFactor=3`:

| Tentativo | Delay base (ms) | Jitter (0..200) | Delay totale (ms) |
| --- | --- | --- | --- |
| 0 | 200 | 0..200 | 200..400 |
| 1 | 600 | 0..200 | 600..800 |
| 2 | 1800 | 0..200 | 1800..2000 |

Spunti iniziali per approfondire il Jitter Backoff:
- [Exponential Backoff And Jitter](https://aws.amazon.com/it/blogs/architecture/exponential-backoff-and-jitter/) – descrive le varianti di jitter (Full, Equal, Decorrelated) e spiega perché il semplice backoff non basta.
- [Riprova la strategia nella v2 AWS SDK per JavaScript](https://docs.aws.amazon.com/it_it/sdk-for-javascript/v2/developer-guide/retry-strategy.html) – mostra come impostare i retry in AWS con JavaScript.
- [Timeouts, retries, and backoff with jitter](https://aws.amazon.com/it/builders-library/timeouts-retries-and-backoff-with-jitter/#Jitter) – approfondisce le motivazioni operative dei retry e l'uso del jitter in sistemi distribuiti.



<a id="configurazione-retry"></a>


<a id="disabilitare-il-retry-solo-per-una-chiamata"></a>
### Disabilitare il retry solo per una chiamata

Per disabilitare il retry su una singola chiamata, passa `withRetry: false` al metodo. Il retry viene applicato solo se **sia** il flag globale **sia** quello per chiamata sono `true`.

<a id="lettura-header-di-tracing"></a>
<a id="lettura-degli-header-di-tracing"></a>
### Lettura degli header di tracing

In caso di errore HTTP, usa `GuardiianoSDKError` e leggi `requestId`, `correlationId` e gli header di tracing (`traceparent`, `tracestate`, `baggage`, `x-amzn-trace-id`, `x-b3-*`, `x-ot-span-context`). Queste informazioni sono utili per correlare i log tra servizi.

<a id="quando-usare-guardiianonetworkerror"></a>
### Quando usare `GuardiianoNetworkError`

`GuardiianoNetworkError` viene lanciato quando il problema è di rete (socket, DNS, timeout a livello di rete). È utile per distinguere errori transitori di trasporto da errori applicativi HTTP.

<a id="configurare-timeout-per-tentativo"></a>
<a id="configurare-un-timeout-per-tentativo"></a>
### Configurare un timeout per tentativo

Per evitare retry troppo lenti, applica un timeout per singolo tentativo (es. `Promise.race`) è un budget complessivo per la richiesta, come mostrato negli esempi. Questo previene la propagazione di latenza eccessiva verso i chiamanti.

<a id="retry-e-idempotenza"></a>
### Retry e idempotenza

Per operazioni non idempotenti (es. `POST`), abilita il retry solo se il backend gestisce deduplica o idempotency keys. In caso contrario, preferisci `withRetry: false` per quelle operazioni.

<a id="osservabilita-e-correlationid"></a>
### Osservabilità e `correlationId`

Quando disponibile, logga `correlationId` insieme a `requestId` per collegare l'intero flusso distribuito. Questo semplifica debugging e analisi delle performance.
