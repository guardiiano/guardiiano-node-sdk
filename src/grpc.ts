import * as grpc from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import googleProtoFiles from 'google-proto-files';
import { fileURLToPath } from 'node:url';
import {
  calculateBackoffDelay,
} from './backoff';
import { GuardiianoGRPCError } from './errors';
import type {
  ConsentDefinition,
  CreateConsentDefinitionRequest,
  CreateDataSubjectRequest,
  CreateDataTagRequest,
  CreatePolicyRuleRequest,
  CreatePrivacyPolicyRequest,
  CreateSubjectContextRequest,
  DataSubject,
  DataSubjectConsent,
  DataSubjectConsentEvent,
  DataSubjectTagValue,
  DataSubjectToken,
  DataTag,
  GuardiianoGrpcSDKApi,
  GuardiianoGrpcTransportConfig,
  JsonObject,
  MetadataSchemaResponse,
  PaginatedResult,
  PolicyRule,
  PrivacyPolicy,
  PurgeQueueItem,
  RegisterDataSubjectRequest,
  RequestOptions,
  ReviewPurgeQueueRequest,
  SearchDataSubjectsRequest,
  SubjectContext,
  SubmitConsentsRequest,
  TransitionDataSubjectContextRequest,
  TransitionDataSubjectContextResult,
  UpdateConsentDefinitionRequest,
  UpdateDataSubjectRequest,
  UpdateDataSubjectSubjectContextRequest,
  UpdateDataTagRequest,
  UpdatePolicyRuleRequest,
  UpdatePrivacyPolicyRequest,
  UpdateSubjectContextRequest,
  UUID,
} from './sdk';

type TimestampLike =
  | string
  | Date
  | {
      seconds?: string | number;
      nanos?: number;
    }
  | null
  | undefined;

type GrpcRetryConfig = {
  withRetry: boolean;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitterMs: number;
  retryableStatusCodes: Set<number>;
};

type DynamicGrpcClient = grpc.Client & Record<string, unknown>;

type ProtoPackage = {
  guardiiano?: {
    v1?: {
      VaultService?: grpc.ServiceClientConstructor;
    };
  };
};

const DEFAULT_PROTO_PATH = fileURLToPath(new URL('../proto/v1/vault.proto', import.meta.url));

function normalizeTimestamp(value: TimestampLike): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();

  const seconds = typeof value.seconds === 'string' ? Number(value.seconds) : (value.seconds ?? 0);
  const nanos = value.nanos ?? 0;
  if (!Number.isFinite(seconds)) return undefined;
  const millis = seconds * 1000 + Math.floor(nanos / 1_000_000);
  return new Date(millis).toISOString();
}

function normalizeJsonObject(value: unknown): JsonObject | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }
  return value as JsonObject;
}

function mapDataSubject<T extends object = JsonObject>(value: Record<string, unknown>): DataSubject<T> {
  return {
    id: String(value.id ?? ''),
    dsToken: String(value.ds_token ?? value.dsToken ?? ''),
    subject_context_code: String(value.subject_context_code ?? ''),
    data: ((normalizeJsonObject(value.data) ?? {}) as unknown) as T,
    created_at: normalizeTimestamp(value.created_at as TimestampLike) ?? '',
    updated_at: normalizeTimestamp(value.updated_at as TimestampLike) ?? '',
  };
}

function mapDataSubjectToken(value: Record<string, unknown>): DataSubjectToken {
  return {
    id: String(value.id ?? ''),
    dsToken: String(value.ds_token ?? value.dsToken ?? ''),
  };
}

function mapPaginatedDataSubjects<T extends object = JsonObject>(value: Record<string, unknown>): PaginatedResult<DataSubject<T>> {
  const items = Array.isArray(value.items) ? value.items.map((item) => mapDataSubject<T>(item as Record<string, unknown>)) : [];
  return {
    items,
    total: Number(value.total ?? 0),
    limit: Number(value.limit ?? 0),
    offset: Number(value.offset ?? 0),
  };
}

function mapDataSubjectTagValue<T extends object = JsonObject>(value: Record<string, unknown>): DataSubjectTagValue<T> {
  return {
    id: String(value.id ?? ''),
    data_subject_id: String(value.data_subject_id ?? ''),
    data_tag_id: String(value.data_tag_id ?? ''),
    data_tag_code: String(value.data_tag_code ?? ''),
    data: ((normalizeJsonObject(value.data) ?? {}) as unknown) as T,
    created_at: normalizeTimestamp(value.created_at as TimestampLike) ?? '',
    updated_at: normalizeTimestamp(value.updated_at as TimestampLike) ?? '',
    expires_at: normalizeTimestamp(value.expires_at as TimestampLike),
    deleted_at: normalizeTimestamp(value.deleted_at as TimestampLike),
  };
}

function mapDataSubjectConsent(value: Record<string, unknown>): DataSubjectConsent {
  return {
    id: String(value.id ?? ''),
    data_subject_id: String(value.data_subject_id ?? ''),
    consent_definition_id: String(value.consent_definition_id ?? ''),
    policy_rule_id: String(value.policy_rule_id ?? ''),
    granted: Boolean(value.granted),
    source: String(value.source ?? ''),
    review_required: Boolean(value.review_required),
    review_reason: value.review_reason ? String(value.review_reason) : undefined,
    review_marked_at: normalizeTimestamp(value.review_marked_at as TimestampLike),
    granted_at: normalizeTimestamp(value.granted_at as TimestampLike),
    revoked_at: normalizeTimestamp(value.revoked_at as TimestampLike),
    privacy_policy_id_snapshot: value.privacy_policy_id_snapshot ? String(value.privacy_policy_id_snapshot) : undefined,
    consent_definition_snapshot: normalizeJsonObject(value.consent_definition_snapshot),
    policy_rule_snapshot: normalizeJsonObject(value.policy_rule_snapshot),
    created_at: normalizeTimestamp(value.created_at as TimestampLike) ?? '',
    updated_at: normalizeTimestamp(value.updated_at as TimestampLike) ?? '',
  };
}

function mapDataSubjectConsentEvent(value: Record<string, unknown>): DataSubjectConsentEvent {
  return {
    id: Number(value.id ?? 0),
    data_subject_id: String(value.data_subject_id ?? ''),
    consent_definition_id: String(value.consent_definition_id ?? ''),
    policy_rule_id: String(value.policy_rule_id ?? ''),
    action: String(value.action ?? ''),
    reason: value.reason ? String(value.reason) : undefined,
    metadata: normalizeJsonObject(value.metadata),
    created_at: normalizeTimestamp(value.created_at as TimestampLike) ?? '',
  };
}

function mapSubjectContext(value: Record<string, unknown>): SubjectContext {
  return {
    id: String(value.id ?? ''),
    code: String(value.code ?? ''),
    name: String(value.name ?? ''),
    description: value.description ? String(value.description) : undefined,
    is_active: Boolean(value.is_active),
    created_at: normalizeTimestamp(value.created_at as TimestampLike) ?? '',
    updated_at: normalizeTimestamp(value.updated_at as TimestampLike) ?? '',
  };
}

function mapDataTag(value: Record<string, unknown>): DataTag {
  return {
    id: String(value.id ?? ''),
    code: String(value.code ?? ''),
    name: String(value.name ?? ''),
    description: value.description ? String(value.description) : undefined,
    created_at: normalizeTimestamp(value.created_at as TimestampLike) ?? '',
    updated_at: normalizeTimestamp(value.updated_at as TimestampLike) ?? '',
  };
}

function mapPrivacyPolicy(value: Record<string, unknown>): PrivacyPolicy {
  return {
    id: String(value.id ?? ''),
    code: String(value.code ?? ''),
    version: Number(value.version ?? 0),
    title: String(value.title ?? ''),
    content: String(value.content ?? ''),
    is_active: Boolean(value.is_active),
    published_at: normalizeTimestamp(value.published_at as TimestampLike),
    created_at: normalizeTimestamp(value.created_at as TimestampLike) ?? '',
    updated_at: normalizeTimestamp(value.updated_at as TimestampLike) ?? '',
  };
}

function mapConsentDefinition(value: Record<string, unknown>): ConsentDefinition {
  return {
    id: String(value.id ?? ''),
    policy_rule_id: String(value.policy_rule_id ?? ''),
    subject_context_code: String(value.subject_context_code ?? ''),
    data_tag_code: String(value.data_tag_code ?? ''),
    code: String(value.code ?? ''),
    name: String(value.name ?? ''),
    legal_basis: String(value.legal_basis ?? ''),
    ui_mode: String(value.ui_mode ?? ''),
    consent_text: String(value.consent_text ?? ''),
    is_active: Boolean(value.is_active),
    display_order: Number(value.display_order ?? 0),
    created_at: normalizeTimestamp(value.created_at as TimestampLike) ?? '',
    updated_at: normalizeTimestamp(value.updated_at as TimestampLike) ?? '',
  };
}

function mapPolicyRule(value: Record<string, unknown>): PolicyRule {
  const consentDefinitions = Array.isArray(value.consent_definitions)
    ? value.consent_definitions.map((item) => mapConsentDefinition(item as Record<string, unknown>))
    : undefined;

  return {
    id: String(value.id ?? ''),
    subject_context_id: String(value.subject_context_id ?? ''),
    subject_context_code: String(value.subject_context_code ?? ''),
    data_tag_id: String(value.data_tag_id ?? ''),
    data_tag_code: String(value.data_tag_code ?? ''),
    privacy_policy_id: String(value.privacy_policy_id ?? ''),
    privacy_policy_code: String(value.privacy_policy_code ?? ''),
    privacy_policy_version: Number(value.privacy_policy_version ?? 0),
    legal_basis: String(value.legal_basis ?? ''),
    ui_mode: String(value.ui_mode ?? ''),
    schema_mode: String(value.schema_mode ?? ''),
    field_schema: normalizeJsonObject(value.field_schema) ?? {},
    retention_months: Number(value.retention_months ?? 0),
    is_required: Boolean(value.is_required),
    is_active: Boolean(value.is_active),
    display_order: Number(value.display_order ?? 0),
    consent_text: value.consent_text ? String(value.consent_text) : undefined,
    consent_definitions: consentDefinitions,
    created_at: normalizeTimestamp(value.created_at as TimestampLike) ?? '',
    updated_at: normalizeTimestamp(value.updated_at as TimestampLike) ?? '',
  };
}

function mapMetadataSchema(value: Record<string, unknown>): MetadataSchemaResponse {
  return {
    subject_context: mapSubjectContext((value.subject_context ?? {}) as Record<string, unknown>),
    master_policy: value.master_policy ? mapPrivacyPolicy(value.master_policy as Record<string, unknown>) : undefined,
    privacy_policies: Array.isArray(value.privacy_policies)
      ? value.privacy_policies.map((item) => mapPrivacyPolicy(item as Record<string, unknown>))
      : [],
    rules: Array.isArray(value.rules) ? value.rules.map((item) => mapPolicyRule(item as Record<string, unknown>)) : [],
  };
}

function mapPurgeQueueItem(value: Record<string, unknown>): PurgeQueueItem {
  return {
    id: String(value.id ?? ''),
    data_subject_id: String(value.data_subject_id ?? ''),
    data_subject_tag_value_id: String(value.data_subject_tag_value_id ?? ''),
    policy_rule_id: value.policy_rule_id ? String(value.policy_rule_id) : undefined,
    data_tag_code: String(value.data_tag_code ?? ''),
    status: String(value.status ?? ''),
    scheduled_at: normalizeTimestamp(value.scheduled_at as TimestampLike) ?? '',
    reviewed_at: normalizeTimestamp(value.reviewed_at as TimestampLike),
    reviewed_by: value.reviewed_by ? String(value.reviewed_by) : undefined,
    reason: value.reason ? String(value.reason) : undefined,
    created_at: normalizeTimestamp(value.created_at as TimestampLike) ?? '',
    updated_at: normalizeTimestamp(value.updated_at as TimestampLike) ?? '',
  };
}

function toStringArrayRecord(metadata: grpc.Metadata): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const map = metadata.getMap();
  for (const [key, value] of Object.entries(map)) {
    out[key] = [String(value)];
  }
  return out;
}

function wrapOptionalString(value: string | undefined): { value: string } | undefined {
  return value === undefined ? undefined : { value };
}

function wrapOptionalBoolean(value: boolean | undefined): { value: boolean } | undefined {
  return value === undefined ? undefined : { value };
}

function wrapOptionalInt32(value: number | undefined): { value: number } | undefined {
  return value === undefined ? undefined : { value };
}

function toGrpcTimestamp(value: string | undefined): { seconds: number; nanos: number } | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  const ms = date.getTime();
  if (Number.isNaN(ms)) {
    return undefined;
  }
  const seconds = Math.floor(ms / 1000);
  const nanos = Math.floor((ms % 1000) * 1_000_000);
  return { seconds, nanos };
}

function normalizeGrpcError(error: grpc.ServiceError): GuardiianoGRPCError {
  return new GuardiianoGRPCError(error.code, error.message, {
    grpcStatus: grpc.status[error.code],
    details: error.details,
    metadata: error.metadata ? toStringArrayRecord(error.metadata) : undefined,
  });
}

function buildDefaultMetadata(options: GuardiianoGrpcTransportConfig): grpc.Metadata {
  const metadata = new grpc.Metadata();
  if (options.metadata) {
    for (const [key, value] of Object.entries(options.metadata)) {
      metadata.set(key, value);
    }
  }
  if (options.bearerToken) {
    metadata.set('authorization', `Bearer ${options.bearerToken}`);
  }
  if (options.apiKey) {
    metadata.set('x-guardiiano-api-key', options.apiKey);
  }
  return metadata;
}

function loadVaultClient(protoPath: string, endpoint: string, insecure: boolean): DynamicGrpcClient {
  const packageDefinition = loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: false,
    oneofs: true,
    includeDirs: [googleProtoFiles.getProtoPath()],
  });

  const descriptor = grpc.loadPackageDefinition(packageDefinition) as ProtoPackage;
  const VaultService = descriptor.guardiiano?.v1?.VaultService;
  if (!VaultService) {
    throw new Error('VaultService definition not found in gRPC proto');
  }

  const credentials = insecure ? grpc.credentials.createInsecure() : grpc.credentials.createSsl();
  return new VaultService(endpoint, credentials) as DynamicGrpcClient;
}

export function createGuardiianoGrpcSDK(config: GuardiianoGrpcTransportConfig): GuardiianoGrpcSDKApi {
  const retryConfig: GrpcRetryConfig = {
    withRetry: config.withRetry ?? true,
    maxRetries: config.maxRetries ?? 3,
    baseDelayMs: config.baseDelayMs ?? 200,
    maxDelayMs: config.maxDelayMs ?? 2000,
    backoffFactor: config.backoffFactor ?? 2,
    jitterMs: config.jitterMs ?? config.baseDelayMs ?? 200,
    retryableStatusCodes: new Set(config.retryableStatusCodes ?? [
      grpc.status.DEADLINE_EXCEEDED,
      grpc.status.RESOURCE_EXHAUSTED,
      grpc.status.ABORTED,
      grpc.status.INTERNAL,
      grpc.status.UNAVAILABLE,
    ]),
  };

  const client = loadVaultClient(config.protoPath ?? DEFAULT_PROTO_PATH, config.endpoint, config.insecure ?? true);
  const defaultMetadata = buildDefaultMetadata(config);

  async function sleepWithBackoff(attempt: number): Promise<void> {
    const delay = calculateBackoffDelay(
      attempt,
      retryConfig.baseDelayMs,
      retryConfig.maxDelayMs,
      retryConfig.backoffFactor,
      retryConfig.jitterMs,
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  function getMetadata(): grpc.Metadata {
    const metadata = new grpc.Metadata();
    const values = defaultMetadata.getMap();
    for (const [key, value] of Object.entries(values)) {
      metadata.set(key, String(value));
    }
    return metadata;
  }

  async function unaryCall<TResponse>(
    method: string,
    request: Record<string, unknown>,
    withRetry: boolean,
  ): Promise<TResponse> {
    const canRetry = retryConfig.withRetry && withRetry;

    for (let attempt = 0; attempt <= (canRetry ? retryConfig.maxRetries : 0); attempt += 1) {
      try {
        const response = await new Promise<TResponse>((resolve, reject) => {
          const rpc = client[method] as (
            req: Record<string, unknown>,
            metadata: grpc.Metadata,
            callback: (error: grpc.ServiceError | null, response?: TResponse) => void,
          ) => void;

          if (typeof rpc !== 'function') {
            reject(new Error(`gRPC method ${method} is not available on VaultService`));
            return;
          }

          rpc.call(client, request, getMetadata(), (error, response) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(response as TResponse);
          });
        });

        return response;
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error) {
          const grpcError = normalizeGrpcError(error as grpc.ServiceError);
          if (!canRetry || attempt >= retryConfig.maxRetries || !retryConfig.retryableStatusCodes.has(grpcError.grpcCode)) {
            throw grpcError;
          }
          await sleepWithBackoff(attempt);
          continue;
        }

        if (!canRetry || attempt >= retryConfig.maxRetries) {
          throw error;
        }
        await sleepWithBackoff(attempt);
      }
    }

    throw new Error('Unexpected error: gRPC retry loop exited without returning.');
  }

  async function reviewPurgeQueueItem(
    method: 'ApprovePurgeQueueItem' | 'LegalHoldPurgeQueueItem' | 'RejectPurgeQueueItem',
    params: { id: UUID } & ReviewPurgeQueueRequest & RequestOptions,
  ): Promise<void> {
    await unaryCall(method, { id: params.id, reason: params.reason ?? '' }, params.withRetry ?? false);
  }

  return {
    transport: 'grpc',

    setBearerToken(token?: string) {
      if (!token) {
        defaultMetadata.remove('authorization');
        return;
      }
      defaultMetadata.set('authorization', `Bearer ${token}`);
    },

    setApiKey(apiKey?: string) {
      if (!apiKey) {
        defaultMetadata.remove('x-guardiiano-api-key');
        return;
      }
      defaultMetadata.set('x-guardiiano-api-key', apiKey);
    },

    setDefaultMetadata(name: string, value?: string) {
      if (value === undefined) {
        defaultMetadata.remove(name);
        return;
      }
      defaultMetadata.set(name, value);
    },

    clearDefaultMetadata() {
      for (const key of Object.keys(defaultMetadata.getMap())) {
        defaultMetadata.remove(key);
      }
    },

    close() {
      client.close();
    },

    async identifyDataSubject<T extends object = JsonObject>(params: CreateDataSubjectRequest<T> & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'CreateDataSubject',
        {
          system_uid: params.system_uid,
          subject_context_code: params.subject_context_code ?? '',
          data: params.data,
        },
        params.withRetry ?? false,
      );
      return mapDataSubjectToken(response);
    },

    async registerDataSubject<T extends object = JsonObject>(params: RegisterDataSubjectRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'RegisterDataSubject',
        params as unknown as Record<string, unknown>,
        params.withRetry ?? false,
      );
      return mapDataSubject<T>(response);
    },

    async updateDataSubject<T extends object = JsonObject>(params: { id: UUID } & UpdateDataSubjectRequest<T> & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'UpdateDataSubject',
        { id: params.id, data: params.data },
        params.withRetry ?? false,
      );
      return mapDataSubject<T>(response);
    },

    async deleteDataSubject(params: { id: UUID } & RequestOptions) {
      await unaryCall('DeleteDataSubject', { id: params.id }, params.withRetry ?? false);
    },

    async updateDataSubjectSubjectContext<T extends object = JsonObject>(
      params: { id: UUID } & UpdateDataSubjectSubjectContextRequest & RequestOptions,
    ) {
      const response = await unaryCall<Record<string, unknown>>(
        'UpdateDataSubjectSubjectContext',
        { id: params.id, subject_context_code: params.subject_context_code },
        params.withRetry ?? false,
      );
      return mapDataSubject<T>(response);
    },

    async transitionDataSubjectContext(params: { id: UUID } & TransitionDataSubjectContextRequest & RequestOptions) {
      return unaryCall<TransitionDataSubjectContextResult>(
        'TransitionDataSubjectContext',
        {
          id: params.id,
          target_subject_context_code: params.target_subject_context_code,
          reason: params.reason ?? '',
        },
        params.withRetry ?? false,
      );
    },

    async previewTransitionDataSubjectContext(params: { id: UUID } & TransitionDataSubjectContextRequest & RequestOptions) {
      return unaryCall<TransitionDataSubjectContextResult>(
        'PreviewDataSubjectContextTransition',
        {
          id: params.id,
          target_subject_context_code: params.target_subject_context_code,
          reason: params.reason ?? '',
        },
        params.withRetry ?? false,
      );
    },

    async listDataSubjects<T extends object = JsonObject>(params: RequestOptions & { limit?: number; offset?: number } = {}) {
      const response = await unaryCall<Record<string, unknown>>(
        'ListDataSubjects',
        { limit: params.limit ?? 0, offset: params.offset ?? 0 },
        params.withRetry ?? true,
      );
      return mapPaginatedDataSubjects<T>(response);
    },

    async searchDataSubjects<T extends object = JsonObject>(params: SearchDataSubjectsRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'SearchDataSubjects',
        {
          ds_token: params.dsToken ?? '',
          subject_context_code: params.subject_context_code ?? '',
          indices: params.indices ?? [],
          limit: params.limit ?? 0,
          offset: params.offset ?? 0,
        },
        params.withRetry ?? true,
      );
      return mapPaginatedDataSubjects<T>(response);
    },

    async listDataSubjectIndexFields(params: RequestOptions = {}) {
      const response = await unaryCall<Record<string, unknown>>('ListBlindIndexFields', {}, params.withRetry ?? true);
      return Array.isArray(response.items) ? response.items.map((item) => String(item)) : [];
    },

    async getDataSubject<T extends object = JsonObject>(params: { token: string; withRetry?: boolean }) {
      const response = await unaryCall<Record<string, unknown>>(
        'GetDataSubjectByToken',
        { token: params.token },
        params.withRetry ?? true,
      );
      return mapDataSubject<T>(response);
    },

    async getDataSubjectTagValues<T extends object = JsonObject>(params: { token: string; withRetry?: boolean }) {
      const response = await unaryCall<Record<string, unknown>>(
        'GetDataSubjectTagValues',
        { token: params.token },
        params.withRetry ?? true,
      );
      return Array.isArray(response.items)
        ? response.items.map((item) => mapDataSubjectTagValue<T>(item as Record<string, unknown>))
        : [];
    },

    async searchDataSubjectByIndex<T extends object = JsonObject>(params: { index: string; value: string; withRetry?: boolean }) {
      const response = await unaryCall<Record<string, unknown>>(
        'SearchDataSubjectsByIndex',
        { index: params.index, value: params.value },
        params.withRetry ?? true,
      );
      return Array.isArray(response.items)
        ? response.items.map((item) => mapDataSubject<T>(item as Record<string, unknown>))
        : [];
    },

    async listDataSubjectConsents(params: { token: string; withRetry?: boolean }) {
      const response = await unaryCall<Record<string, unknown>>(
        'ListDataSubjectConsents',
        { token: params.token },
        params.withRetry ?? true,
      );
      return Array.isArray(response.items)
        ? response.items.map((item) => mapDataSubjectConsent(item as Record<string, unknown>))
        : [];
    },

    async listDataSubjectConsentEvents(params: { token: string; action?: string; limit?: number; offset?: number; withRetry?: boolean }) {
      const response = await unaryCall<Record<string, unknown>>(
        'ListDataSubjectConsentEvents',
        {
          token: params.token,
          action: params.action ?? '',
          limit: params.limit ?? 0,
          offset: params.offset ?? 0,
        },
        params.withRetry ?? true,
      );
      return Array.isArray(response.items)
        ? response.items.map((item) => mapDataSubjectConsentEvent(item as Record<string, unknown>))
        : [];
    },

    async submitDataSubjectConsents(params: { token: string } & SubmitConsentsRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'SubmitDataSubjectConsents',
        { token: params.token, consents: params.consents },
        params.withRetry ?? false,
      );
      return Array.isArray(response.items)
        ? response.items.map((item) => mapDataSubjectConsent(item as Record<string, unknown>))
        : [];
    },

    async createSubjectContext(params: CreateSubjectContextRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'CreateSubjectContext',
        {
          code: params.code,
          name: params.name,
          description: params.description ?? '',
          is_active: wrapOptionalBoolean(params.is_active),
        },
        params.withRetry ?? false,
      );
      return mapSubjectContext(response);
    },

    async listSubjectContexts(params: RequestOptions = {}) {
      const response = await unaryCall<Record<string, unknown>>('ListSubjectContexts', {}, params.withRetry ?? true);
      return Array.isArray(response.items) ? response.items.map((item) => mapSubjectContext(item as Record<string, unknown>)) : [];
    },

    async getSubjectContext(params: { id: UUID } & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>('GetSubjectContext', { id: params.id }, params.withRetry ?? true);
      return mapSubjectContext(response);
    },

    async updateSubjectContext(params: { id: UUID } & UpdateSubjectContextRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'UpdateSubjectContext',
        {
          id: params.id,
          code: wrapOptionalString(params.code),
          name: wrapOptionalString(params.name),
          description: wrapOptionalString(params.description),
          is_active: wrapOptionalBoolean(params.is_active),
        },
        params.withRetry ?? false,
      );
      return mapSubjectContext(response);
    },

    async deleteSubjectContext(params: { id: UUID } & RequestOptions) {
      await unaryCall('DeleteSubjectContext', { id: params.id }, params.withRetry ?? false);
    },

    async createDataTag(params: CreateDataTagRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>('CreateDataTag', params as unknown as Record<string, unknown>, params.withRetry ?? false);
      return mapDataTag(response);
    },

    async listDataTags(params: RequestOptions = {}) {
      const response = await unaryCall<Record<string, unknown>>('ListDataTags', {}, params.withRetry ?? true);
      return Array.isArray(response.items) ? response.items.map((item) => mapDataTag(item as Record<string, unknown>)) : [];
    },

    async getDataTag(params: { id: UUID } & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>('GetDataTag', { id: params.id }, params.withRetry ?? true);
      return mapDataTag(response);
    },

    async updateDataTag(params: { id: UUID } & UpdateDataTagRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'UpdateDataTag',
        {
          id: params.id,
          code: wrapOptionalString(params.code),
          name: wrapOptionalString(params.name),
          description: wrapOptionalString(params.description),
        },
        params.withRetry ?? false,
      );
      return mapDataTag(response);
    },

    async deleteDataTag(params: { id: UUID } & RequestOptions) {
      await unaryCall('DeleteDataTag', { id: params.id }, params.withRetry ?? false);
    },

    async createPrivacyPolicy(params: CreatePrivacyPolicyRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'CreatePrivacyPolicy',
        {
          code: params.code,
          version: params.version ?? 0,
          title: params.title,
          content: params.content,
          is_active: wrapOptionalBoolean(params.is_active),
          published_at: toGrpcTimestamp(params.published_at),
        },
        params.withRetry ?? false,
      );
      return mapPrivacyPolicy(response);
    },

    async listPrivacyPolicies(params: RequestOptions = {}) {
      const response = await unaryCall<Record<string, unknown>>('ListPrivacyPolicies', {}, params.withRetry ?? true);
      return Array.isArray(response.items) ? response.items.map((item) => mapPrivacyPolicy(item as Record<string, unknown>)) : [];
    },

    async getPrivacyPolicy(params: { id: UUID } & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>('GetPrivacyPolicy', { id: params.id }, params.withRetry ?? true);
      return mapPrivacyPolicy(response);
    },

    async updatePrivacyPolicy(params: { id: UUID } & UpdatePrivacyPolicyRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'UpdatePrivacyPolicy',
        {
          id: params.id,
          title: wrapOptionalString(params.title),
          content: wrapOptionalString(params.content),
          is_active: wrapOptionalBoolean(params.is_active),
          published_at: toGrpcTimestamp(params.published_at),
          clear_published_at: params.published_at === undefined ? false : false,
        },
        params.withRetry ?? false,
      );
      return mapPrivacyPolicy(response);
    },

    async deletePrivacyPolicy(params: { id: UUID } & RequestOptions) {
      await unaryCall('DeletePrivacyPolicy', { id: params.id }, params.withRetry ?? false);
    },

    async createPolicyRule(params: CreatePolicyRuleRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'CreatePolicyRule',
        {
          subject_context_code: params.subject_context_code,
          data_tag_code: params.data_tag_code,
          privacy_policy_id: params.privacy_policy_id,
          legal_basis: params.legal_basis,
          ui_mode: params.ui_mode,
          schema_mode: params.schema_mode,
          field_schema: params.field_schema ?? {},
          retention_months: params.retention_months,
          is_required: params.is_required,
          is_active: wrapOptionalBoolean(params.is_active),
          display_order: params.display_order ?? 0,
          consent_text: params.consent_text ?? '',
        },
        params.withRetry ?? false,
      );
      return mapPolicyRule(response);
    },

    async listPolicyRules(params: RequestOptions = {}) {
      const response = await unaryCall<Record<string, unknown>>('ListPolicyRules', {}, params.withRetry ?? true);
      return Array.isArray(response.items) ? response.items.map((item) => mapPolicyRule(item as Record<string, unknown>)) : [];
    },

    async getPolicyRule(params: { id: UUID } & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>('GetPolicyRule', { id: params.id }, params.withRetry ?? true);
      return mapPolicyRule(response);
    },

    async updatePolicyRule(params: { id: UUID } & UpdatePolicyRuleRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'UpdatePolicyRule',
        {
          id: params.id,
          privacy_policy_id: wrapOptionalString(params.privacy_policy_id),
          legal_basis: wrapOptionalString(params.legal_basis),
          ui_mode: wrapOptionalString(params.ui_mode),
          schema_mode: wrapOptionalString(params.schema_mode),
          field_schema: params.field_schema ?? {},
          has_field_schema: params.field_schema !== undefined,
          retention_months: wrapOptionalInt32(params.retention_months),
          is_required: wrapOptionalBoolean(params.is_required),
          is_active: wrapOptionalBoolean(params.is_active),
          display_order: wrapOptionalInt32(params.display_order),
          consent_text: wrapOptionalString(params.consent_text),
        },
        params.withRetry ?? false,
      );
      return mapPolicyRule(response);
    },

    async deletePolicyRule(params: { id: UUID } & RequestOptions) {
      await unaryCall('DeletePolicyRule', { id: params.id }, params.withRetry ?? false);
    },

    async createConsentDefinition(params: CreateConsentDefinitionRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'CreateConsentDefinition',
        {
          policy_rule_id: params.policy_rule_id,
          code: params.code,
          name: params.name,
          legal_basis: params.legal_basis,
          ui_mode: params.ui_mode,
          consent_text: params.consent_text ?? '',
          is_active: wrapOptionalBoolean(params.is_active),
          display_order: params.display_order ?? 0,
        },
        params.withRetry ?? false,
      );
      return mapConsentDefinition(response);
    },

    async listConsentDefinitions(params: RequestOptions = {}) {
      const response = await unaryCall<Record<string, unknown>>('ListConsentDefinitions', {}, params.withRetry ?? true);
      return Array.isArray(response.items) ? response.items.map((item) => mapConsentDefinition(item as Record<string, unknown>)) : [];
    },

    async getConsentDefinition(params: { id: UUID } & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>('GetConsentDefinition', { id: params.id }, params.withRetry ?? true);
      return mapConsentDefinition(response);
    },

    async updateConsentDefinition(params: { id: UUID } & UpdateConsentDefinitionRequest & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'UpdateConsentDefinition',
        {
          id: params.id,
          code: wrapOptionalString(params.code),
          name: wrapOptionalString(params.name),
          legal_basis: wrapOptionalString(params.legal_basis),
          ui_mode: wrapOptionalString(params.ui_mode),
          consent_text: wrapOptionalString(params.consent_text),
          is_active: wrapOptionalBoolean(params.is_active),
          display_order: wrapOptionalInt32(params.display_order),
        },
        params.withRetry ?? false,
      );
      return mapConsentDefinition(response);
    },

    async deleteConsentDefinition(params: { id: UUID } & RequestOptions) {
      await unaryCall('DeleteConsentDefinition', { id: params.id }, params.withRetry ?? false);
    },

    async getMetadataSchema(params: { context: string } & RequestOptions) {
      const response = await unaryCall<Record<string, unknown>>(
        'GetMetadataSchema',
        { subject_context_code: params.context },
        params.withRetry ?? true,
      );
      return mapMetadataSchema(response);
    },

    async listPurgeQueue(params: RequestOptions & { status?: string; data_tag_code?: string; limit?: number; offset?: number } = {}) {
      const response = await unaryCall<Record<string, unknown>>(
        'ListPurgeQueue',
        {
          status: params.status ?? '',
          data_tag_code: params.data_tag_code ?? '',
          limit: params.limit ?? 0,
          offset: params.offset ?? 0,
        },
        params.withRetry ?? true,
      );
      return Array.isArray(response.items) ? response.items.map((item) => mapPurgeQueueItem(item as Record<string, unknown>)) : [];
    },

    async approvePurgeQueueItem(params) {
      await reviewPurgeQueueItem('ApprovePurgeQueueItem', params);
    },

    async legalHoldPurgeQueueItem(params) {
      await reviewPurgeQueueItem('LegalHoldPurgeQueueItem', params);
    },

    async rejectPurgeQueueItem(params) {
      await reviewPurgeQueueItem('RejectPurgeQueueItem', params);
    },
  };
}
