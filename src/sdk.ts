import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { calculateBackoffDelay } from './backoff';
import { createGuardiianoGrpcSDK } from './grpc';
import { GuardiianoGRPCError, GuardiianoNetworkError, GuardiianoSDKError } from './errors';

export type UUID = string;
export type ISODateString = string;
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export interface RequestOptions {
  withRetry?: boolean;
}

export interface GuardiianoSDKOptions extends RetryOptions {
  headers?: HeadersInit;
  bearerToken?: string;
  apiKey?: string;
}

export interface GuardiianoGrpcSDKOptions extends RetryOptions {
  endpoint: string;
  protoPath?: string;
  bearerToken?: string;
  apiKey?: string;
  metadata?: Record<string, string>;
  insecure?: boolean;
}

export interface GuardiianoRestTransportConfig extends GuardiianoSDKOptions {
  transport: 'rest';
  baseUrl: string;
}

export interface GuardiianoGrpcTransportConfig extends GuardiianoGrpcSDKOptions {
  transport: 'grpc';
}

export type GuardiianoClientConfig = GuardiianoRestTransportConfig | GuardiianoGrpcTransportConfig;

export interface LegacyGuardiianoPluginOptions {
  baseUrl: string;
  retry?: GuardiianoSDKOptions;
}

export interface DataSubject<T extends object = JsonObject> {
  id: UUID;
  dsToken: UUID;
  subject_context_code: string;
  data: T;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface DataSubjectToken {
  id: UUID;
  dsToken: UUID;
}

export interface Action<M = unknown> {
  userId: string;
  actionType: string;
  timestamp?: ISODateString;
  metadata?: M;
}

export interface ActionAcceptedResponse {
  status: string;
  messageId: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  roles: string[];
}

export interface ConfirmEmailRequest {
  token: string;
  otp: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: string;
}

export interface CreateUserResponse {
  id: UUID;
  email: string;
  confirm_token: string;
  confirm_otp: string;
}

export interface UpdateUserRequest {
  password?: string;
  role?: string;
}

export interface User {
  id: UUID;
  email: string;
  email_confirmed: boolean;
  roles: string[];
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ListUsersQuery extends PaginationQuery {
  email?: string;
  role?: string;
  email_confirmed?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export type UserListResult = PaginatedResult<User>;

export interface AccountProfile extends User {}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface CreateApiKeyRequest {
  name: string;
  role: string;
}

export interface UpdateApiKeyRoleRequest {
  role: string;
}

export interface ApiKey {
  id: UUID;
  name: string;
  key_prefix: string;
  role: string;
  request_count: number;
  created_at: ISODateString;
  last_used_at?: ISODateString;
  revoked_at?: ISODateString;
}

export interface ApiKeySecretResponse extends ApiKey {
  api_key: string;
}

export interface DashboardKPIs {
  data_subject_total: number;
  data_subject_new_7d: number;
  audit_total: number;
  audit_24h: number;
  user_total: number;
  user_unconfirmed: number;
  api_key_total: number;
  api_key_active_total: number;
}

export interface DashboardAuditOperationDaily {
  day: string;
  created: number;
  updated: number;
  deleted: number;
  ridden: number;
}

export interface DashboardDailyComparison {
  day: string;
  data_subject_count: number;
  audit_count: number;
}

export interface DashboardApiKeyTop {
  name: string;
  key_prefix: string;
  request_count: number;
}

export interface DashboardRecentAudit {
  id: number;
  data_subject_id: string;
  operation: string;
  created_at: ISODateString;
  created_by: string;
}

export interface DashboardOverviewResponse {
  kpis: DashboardKPIs;
  audit_operations_daily: DashboardAuditOperationDaily[];
  daily_comparison: DashboardDailyComparison[];
  top_api_keys: DashboardApiKeyTop[];
  recent_audit_logs: DashboardRecentAudit[];
}

export interface PrivacyDashboardKPIs {
  consent_review_required: number;
  consent_events_30d: number;
  transitions_30d: number;
  purge_pending: number;
}

export interface PrivacyDashboardDaily {
  day: string;
  granted: number;
  revoked: number;
  review_required: number;
  transitions: number;
  purged: number;
}

export interface PrivacyDashboardContextStat {
  subject_context_code: string;
  data_subject_count: number;
}

export interface PrivacyDashboardPurgeTagStat {
  data_tag_code: string;
  pending_count: number;
  legal_hold_count: number;
}

export interface PrivacyDashboardResponse {
  kpis: PrivacyDashboardKPIs;
  daily_trend: PrivacyDashboardDaily[];
  context_distribution: PrivacyDashboardContextStat[];
  purge_by_tag: PrivacyDashboardPurgeTagStat[];
}

export interface CreateDataSubjectRequest<T extends object = JsonObject> {
  system_uid: string;
  subject_context_code?: string;
  data: T;
}

export interface UpdateDataSubjectRequest<T extends object = JsonObject> {
  data: T;
}

export interface UpdateDataSubjectSubjectContextRequest {
  subject_context_code: string;
}

export interface TransitionDataSubjectContextRequest {
  target_subject_context_code: string;
  reason?: string;
}

export interface TransitionDataSubjectContextResult {
  data_subject_id: UUID;
  ds_token: UUID;
  old_subject_context_code: string;
  new_subject_context_code: string;
  carried_over_tags: string[];
  required_new_tags: string[];
  obsolete_tags_queued: string[];
  consents_to_review: string[];
}

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}

export interface DataSubjectIndexFilter {
  name: string;
  value: string;
}

export interface SearchDataSubjectsRequest {
  dsToken?: string;
  subject_context_code?: string;
  indices?: DataSubjectIndexFilter[];
  limit?: number;
  offset?: number;
}

export interface RegistrationTagPayload<T extends object = JsonObject> {
  data_tag_code: string;
  data: T;
}

export interface ConsentSubmission {
  consent_definition_id: UUID;
  policy_rule_id?: UUID;
  granted: boolean;
}

export interface RegisterDataSubjectRequest {
  system_uid: string;
  subject_context_code?: string;
  tags: Array<RegistrationTagPayload>;
  consents?: ConsentSubmission[];
}

export interface DataSubjectTagValue<T extends object = JsonObject> {
  id: UUID;
  data_subject_id: UUID;
  data_tag_id: UUID;
  data_tag_code: string;
  data: T;
  created_at: ISODateString;
  updated_at: ISODateString;
  expires_at?: ISODateString;
  deleted_at?: ISODateString;
}

export interface DataSubjectConsent {
  id: UUID;
  data_subject_id: UUID;
  consent_definition_id: UUID;
  policy_rule_id: UUID;
  granted: boolean;
  source: string;
  review_required: boolean;
  review_reason?: string;
  review_marked_at?: ISODateString;
  granted_at?: ISODateString;
  revoked_at?: ISODateString;
  privacy_policy_id_snapshot?: UUID;
  consent_definition_snapshot?: JsonObject;
  policy_rule_snapshot?: JsonObject;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ConsentEventsQuery extends PaginationQuery {
  action?: string;
}

export interface DataSubjectConsentEvent {
  id: number;
  data_subject_id: UUID;
  consent_definition_id: UUID;
  policy_rule_id: UUID;
  action: string;
  reason?: string;
  metadata?: JsonObject;
  created_at: ISODateString;
}

export interface SubmitConsentsRequest {
  consents: ConsentSubmission[];
}

export interface AuditLog {
  id: number;
  data_subject_id?: UUID;
  operation: string;
  old_data?: JsonObject;
  new_data?: JsonObject;
  metadata?: JsonObject;
  created_at: ISODateString;
  created_by?: string;
}

export interface SubjectContext {
  id: UUID;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateSubjectContextRequest {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateSubjectContextRequest {
  code?: string;
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface DataTag {
  id: UUID;
  code: string;
  name: string;
  description?: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateDataTagRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateDataTagRequest {
  code?: string;
  name?: string;
  description?: string;
}

export interface PrivacyPolicy {
  id: UUID;
  code: string;
  version: number;
  title: string;
  content: string;
  is_active: boolean;
  published_at?: ISODateString;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreatePrivacyPolicyRequest {
  code: string;
  version?: number;
  title: string;
  content: string;
  is_active?: boolean;
  published_at?: ISODateString;
}

export interface UpdatePrivacyPolicyRequest {
  title?: string;
  content?: string;
  is_active?: boolean;
  published_at?: ISODateString;
}

export interface PolicyRule {
  id: UUID;
  subject_context_id: UUID;
  subject_context_code: string;
  data_tag_id: UUID;
  data_tag_code: string;
  privacy_policy_id: UUID;
  privacy_policy_code: string;
  privacy_policy_version: number;
  legal_basis: string;
  ui_mode: string;
  schema_mode: string;
  field_schema: JsonObject;
  retention_months: number;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  consent_text?: string;
  consent_definitions?: ConsentDefinition[];
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreatePolicyRuleRequest {
  subject_context_code: string;
  data_tag_code: string;
  privacy_policy_id: UUID;
  legal_basis: string;
  ui_mode: string;
  schema_mode: string;
  field_schema?: JsonObject;
  retention_months: number;
  is_required: boolean;
  is_active?: boolean;
  display_order?: number;
  consent_text?: string;
}

export interface UpdatePolicyRuleRequest {
  privacy_policy_id?: UUID;
  legal_basis?: string;
  ui_mode?: string;
  schema_mode?: string;
  field_schema?: JsonObject;
  retention_months?: number;
  is_required?: boolean;
  is_active?: boolean;
  display_order?: number;
  consent_text?: string;
}

export interface ConsentDefinition {
  id: UUID;
  policy_rule_id: UUID;
  subject_context_code: string;
  data_tag_code: string;
  code: string;
  name: string;
  legal_basis: string;
  ui_mode: string;
  consent_text: string;
  is_active: boolean;
  display_order: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateConsentDefinitionRequest {
  policy_rule_id: UUID;
  code: string;
  name: string;
  legal_basis: string;
  ui_mode: string;
  consent_text?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateConsentDefinitionRequest {
  code?: string;
  name?: string;
  legal_basis?: string;
  ui_mode?: string;
  consent_text?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface MetadataSchemaResponse {
  subject_context: SubjectContext;
  master_policy?: PrivacyPolicy;
  privacy_policies: PrivacyPolicy[];
  rules: PolicyRule[];
}

export interface PurgeQueueItem {
  id: UUID;
  data_subject_id: UUID;
  data_subject_tag_value_id: UUID;
  policy_rule_id?: UUID;
  data_tag_code: string;
  status: string;
  scheduled_at: ISODateString;
  reviewed_at?: ISODateString;
  reviewed_by?: string;
  reason?: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface PurgeQueueListQuery extends PaginationQuery {
  status?: string;
  data_tag_code?: string;
}

export interface ReviewPurgeQueueRequest {
  reason?: string;
}

export interface UploadFileParams {
  file: Blob | File | Uint8Array | ArrayBuffer;
  filename?: string;
  contentType?: string;
  withRetry?: boolean;
}

export interface UploadFileResponse {
  id: string;
}

export interface GuardiianoSDKApi {
  readonly transport: 'rest';
  setBearerToken(token?: string): void;
  setApiKey(apiKey?: string): void;
  setDefaultHeader(name: string, value?: string): void;
  clearDefaultHeaders(): void;

  login(params: { email: string; password: string; withRetry?: boolean }): Promise<LoginResponse>;
  refreshAuth(params: { refresh_token: string; withRetry?: boolean }): Promise<LoginResponse>;
  confirmEmail(params: ConfirmEmailRequest & RequestOptions): Promise<void>;
  createUser(params: CreateUserRequest & RequestOptions): Promise<CreateUserResponse>;
  listUsers(params?: ListUsersQuery & RequestOptions): Promise<UserListResult>;
  getAccount(params?: RequestOptions): Promise<AccountProfile>;
  changeMyPassword(params: ChangePasswordRequest & RequestOptions): Promise<void>;
  updateUser(params: { id: UUID } & UpdateUserRequest & RequestOptions): Promise<void>;
  deleteUser(params: { id: UUID } & RequestOptions): Promise<void>;

  createApiKey(params: CreateApiKeyRequest & RequestOptions): Promise<ApiKeySecretResponse>;
  listApiKeys(params?: RequestOptions): Promise<ApiKey[]>;
  updateApiKeyRole(params: { id: UUID } & UpdateApiKeyRoleRequest & RequestOptions): Promise<void>;
  regenerateApiKey(params: { id: UUID } & RequestOptions): Promise<ApiKeySecretResponse>;
  deleteApiKey(params: { id: UUID } & RequestOptions): Promise<void>;

  postAction<M>(params: { action: Action<M>; withRetry?: boolean }): Promise<ActionAcceptedResponse>;
  getDashboardOverview(params?: RequestOptions): Promise<DashboardOverviewResponse>;
  getPrivacyDashboard(params?: RequestOptions): Promise<PrivacyDashboardResponse>;

  identifyDataSubject<T extends object = JsonObject>(
    params: CreateDataSubjectRequest<T> & RequestOptions,
  ): Promise<DataSubjectToken>;
  registerDataSubject<T extends object = JsonObject>(
    params: RegisterDataSubjectRequest & RequestOptions,
  ): Promise<DataSubject<T>>;
  updateDataSubject<T extends object = JsonObject>(
    params: { id: UUID } & UpdateDataSubjectRequest<T> & RequestOptions,
  ): Promise<DataSubject<T>>;
  deleteDataSubject(params: { id: UUID } & RequestOptions): Promise<void>;
  updateDataSubjectSubjectContext<T extends object = JsonObject>(
    params: { id: UUID } & UpdateDataSubjectSubjectContextRequest & RequestOptions,
  ): Promise<DataSubject<T>>;
  transitionDataSubjectContext(
    params: { id: UUID } & TransitionDataSubjectContextRequest & RequestOptions,
  ): Promise<TransitionDataSubjectContextResult>;
  previewTransitionDataSubjectContext(
    params: { id: UUID } & TransitionDataSubjectContextRequest & RequestOptions,
  ): Promise<TransitionDataSubjectContextResult>;
  listDataSubjects<T extends object = JsonObject>(
    params?: PaginationQuery & RequestOptions,
  ): Promise<PaginatedResult<DataSubject<T>>>;
  searchDataSubjects<T extends object = JsonObject>(
    params: SearchDataSubjectsRequest & RequestOptions,
  ): Promise<PaginatedResult<DataSubject<T>>>;
  listDataSubjectIndexFields(params?: RequestOptions): Promise<string[]>;
  getDataSubject<T extends object = JsonObject>(
    params: { token: string; withRetry?: boolean },
  ): Promise<DataSubject<T>>;
  getDataSubjectTagValues<T extends object = JsonObject>(
    params: { token: string; withRetry?: boolean },
  ): Promise<Array<DataSubjectTagValue<T>>>;
  searchDataSubjectByIndex<T extends object = JsonObject>(
    params: { index: string; value: string; withRetry?: boolean },
  ): Promise<Array<DataSubject<T>>>;

  listDataSubjectConsents(params: { token: string; withRetry?: boolean }): Promise<DataSubjectConsent[]>;
  listDataSubjectConsentEvents(
    params: { token: string } & ConsentEventsQuery & RequestOptions,
  ): Promise<DataSubjectConsentEvent[]>;
  submitDataSubjectConsents(params: { token: string } & SubmitConsentsRequest & RequestOptions): Promise<DataSubjectConsent[]>;

  getMetrics<T = unknown>(params?: RequestOptions): Promise<T>;
  uploadFile(params: UploadFileParams): Promise<UploadFileResponse>;
  listAuditLogs(params?: PaginationQuery & RequestOptions): Promise<AuditLog[]>;
  listAuditLogsByDataSubjectId(params: { dataSubjectId: UUID } & PaginationQuery & RequestOptions): Promise<AuditLog[]>;

  createSubjectContext(params: CreateSubjectContextRequest & RequestOptions): Promise<SubjectContext>;
  listSubjectContexts(params?: RequestOptions): Promise<SubjectContext[]>;
  getSubjectContext(params: { id: UUID } & RequestOptions): Promise<SubjectContext>;
  updateSubjectContext(params: { id: UUID } & UpdateSubjectContextRequest & RequestOptions): Promise<SubjectContext>;
  deleteSubjectContext(params: { id: UUID } & RequestOptions): Promise<void>;

  createDataTag(params: CreateDataTagRequest & RequestOptions): Promise<DataTag>;
  listDataTags(params?: RequestOptions): Promise<DataTag[]>;
  getDataTag(params: { id: UUID } & RequestOptions): Promise<DataTag>;
  updateDataTag(params: { id: UUID } & UpdateDataTagRequest & RequestOptions): Promise<DataTag>;
  deleteDataTag(params: { id: UUID } & RequestOptions): Promise<void>;

  createPrivacyPolicy(params: CreatePrivacyPolicyRequest & RequestOptions): Promise<PrivacyPolicy>;
  listPrivacyPolicies(params?: RequestOptions): Promise<PrivacyPolicy[]>;
  getPrivacyPolicy(params: { id: UUID } & RequestOptions): Promise<PrivacyPolicy>;
  updatePrivacyPolicy(params: { id: UUID } & UpdatePrivacyPolicyRequest & RequestOptions): Promise<PrivacyPolicy>;
  deletePrivacyPolicy(params: { id: UUID } & RequestOptions): Promise<void>;

  createPolicyRule(params: CreatePolicyRuleRequest & RequestOptions): Promise<PolicyRule>;
  listPolicyRules(params?: RequestOptions): Promise<PolicyRule[]>;
  getPolicyRule(params: { id: UUID } & RequestOptions): Promise<PolicyRule>;
  updatePolicyRule(params: { id: UUID } & UpdatePolicyRuleRequest & RequestOptions): Promise<PolicyRule>;
  deletePolicyRule(params: { id: UUID } & RequestOptions): Promise<void>;

  createConsentDefinition(params: CreateConsentDefinitionRequest & RequestOptions): Promise<ConsentDefinition>;
  listConsentDefinitions(params?: RequestOptions): Promise<ConsentDefinition[]>;
  getConsentDefinition(params: { id: UUID } & RequestOptions): Promise<ConsentDefinition>;
  updateConsentDefinition(
    params: { id: UUID } & UpdateConsentDefinitionRequest & RequestOptions,
  ): Promise<ConsentDefinition>;
  deleteConsentDefinition(params: { id: UUID } & RequestOptions): Promise<void>;

  getMetadataSchema(params: { context: string } & RequestOptions): Promise<MetadataSchemaResponse>;

  listPurgeQueue(params?: PurgeQueueListQuery & RequestOptions): Promise<PurgeQueueItem[]>;
  approvePurgeQueueItem(params: { id: UUID } & ReviewPurgeQueueRequest & RequestOptions): Promise<void>;
  legalHoldPurgeQueueItem(params: { id: UUID } & ReviewPurgeQueueRequest & RequestOptions): Promise<void>;
  rejectPurgeQueueItem(params: { id: UUID } & ReviewPurgeQueueRequest & RequestOptions): Promise<void>;
}

export type GuardiianoRestSDKApi = GuardiianoSDKApi;

type GuardiianoGrpcMethodNames =
  | 'setBearerToken'
  | 'setApiKey'
  | 'identifyDataSubject'
  | 'registerDataSubject'
  | 'updateDataSubject'
  | 'deleteDataSubject'
  | 'updateDataSubjectSubjectContext'
  | 'transitionDataSubjectContext'
  | 'previewTransitionDataSubjectContext'
  | 'listDataSubjects'
  | 'searchDataSubjects'
  | 'listDataSubjectIndexFields'
  | 'getDataSubject'
  | 'getDataSubjectTagValues'
  | 'searchDataSubjectByIndex'
  | 'listDataSubjectConsents'
  | 'listDataSubjectConsentEvents'
  | 'submitDataSubjectConsents'
  | 'createSubjectContext'
  | 'listSubjectContexts'
  | 'getSubjectContext'
  | 'updateSubjectContext'
  | 'deleteSubjectContext'
  | 'createDataTag'
  | 'listDataTags'
  | 'getDataTag'
  | 'updateDataTag'
  | 'deleteDataTag'
  | 'createPrivacyPolicy'
  | 'listPrivacyPolicies'
  | 'getPrivacyPolicy'
  | 'updatePrivacyPolicy'
  | 'deletePrivacyPolicy'
  | 'createPolicyRule'
  | 'listPolicyRules'
  | 'getPolicyRule'
  | 'updatePolicyRule'
  | 'deletePolicyRule'
  | 'createConsentDefinition'
  | 'listConsentDefinitions'
  | 'getConsentDefinition'
  | 'updateConsentDefinition'
  | 'deleteConsentDefinition'
  | 'getMetadataSchema'
  | 'listPurgeQueue'
  | 'approvePurgeQueueItem'
  | 'legalHoldPurgeQueueItem'
  | 'rejectPurgeQueueItem';

export interface GuardiianoGrpcSDKApi extends Pick<GuardiianoSDKApi, GuardiianoGrpcMethodNames> {
  readonly transport: 'grpc';
  setDefaultMetadata(name: string, value?: string): void;
  clearDefaultMetadata(): void;
  close(): void;
}

export interface RetryOptions {
  withRetry?: boolean;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  jitterMs?: number;
  retryableStatusCodes?: number[];
}

interface RetryConfig {
  withRetry: boolean;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitterMs: number;
  retryableStatusCodes: Set<number>;
}

type QueryValue = string | number | boolean | null | undefined;

interface InternalRequestOptions {
  method: string;
  headers?: HeadersInit;
  body?: BodyInit;
  parseAs?: 'json' | 'void';
  contentType?: string | false;
}

export { GuardiianoGRPCError, GuardiianoNetworkError, GuardiianoSDKError };

export function isDataSubject(obj: unknown): obj is DataSubject {
  if (typeof obj !== 'object' || obj === null) return false;

  const record = obj as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.dsToken === 'string' &&
    typeof record.subject_context_code === 'string' &&
    typeof record.data === 'object' &&
    record.data !== null &&
    typeof record.created_at === 'string' &&
    typeof record.updated_at === 'string'
  );
}

export function createGuardiianoRestSDK(baseUrl: string, options: GuardiianoSDKOptions = {}): GuardiianoRestSDKApi {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const retryConfig: RetryConfig = {
    withRetry: options.withRetry ?? true,
    maxRetries: options.maxRetries ?? 3,
    baseDelayMs: options.baseDelayMs ?? 200,
    maxDelayMs: options.maxDelayMs ?? 2000,
    backoffFactor: options.backoffFactor ?? 2,
    jitterMs: options.jitterMs ?? options.baseDelayMs ?? 200,
    retryableStatusCodes: new Set(options.retryableStatusCodes ?? [408, 429, 500, 502, 503, 504]),
  };

  const defaultHeaders = new Headers(options.headers);
  if (options.bearerToken) {
    defaultHeaders.set('Authorization', `Bearer ${options.bearerToken}`);
  }
  if (options.apiKey) {
    defaultHeaders.set('X-Guardiiano-API-Key', options.apiKey);
  }

  async function sleepWithBackoff(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number,
    backoffFactor: number,
    jitterMs: number,
  ): Promise<void> {
    const delay = calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs, backoffFactor, jitterMs);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  function isNetworkError(error: unknown): boolean {
    return error instanceof TypeError;
  }

  async function parseErrorBody(response: Response): Promise<unknown> {
    try {
      const text = await response.text();
      if (!text) return undefined;
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return text;
      }
    } catch {
      return undefined;
    }
  }

  function parseHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  function getRequestId(response: Response): string | undefined {
    return response.headers.get('x-request-id') ?? response.headers.get('x-requestid') ?? undefined;
  }

  function getCorrelationId(response: Response): string | undefined {
    return response.headers.get('x-correlation-id') ?? response.headers.get('x-correlationid') ?? undefined;
  }

  function getTraceHeaders(response: Response) {
    return {
      traceparent: response.headers.get('traceparent') ?? undefined,
      tracestate: response.headers.get('tracestate') ?? undefined,
      baggage: response.headers.get('baggage') ?? undefined,
      xAmznTraceId: response.headers.get('x-amzn-trace-id') ?? undefined,
      xB3TraceId: response.headers.get('x-b3-traceid') ?? undefined,
      xB3SpanId: response.headers.get('x-b3-spanid') ?? undefined,
      xB3ParentSpanId: response.headers.get('x-b3-parentspanid') ?? undefined,
      xB3Sampled: response.headers.get('x-b3-sampled') ?? undefined,
      xB3Flags: response.headers.get('x-b3-flags') ?? undefined,
      xOtSpanContext: response.headers.get('x-ot-span-context') ?? undefined,
    };
  }

  function buildHeaders(headers?: HeadersInit, contentType: string | false = 'application/json'): Headers {
    const merged = new Headers(defaultHeaders);
    if (contentType !== false && !merged.has('Content-Type')) {
      merged.set('Content-Type', contentType);
    }
    if (headers) {
      const extra = new Headers(headers);
      extra.forEach((value, key) => {
        merged.set(key, value);
      });
    }
    return merged;
  }

  async function request<T>(
    path: string,
    options: InternalRequestOptions,
    withRetry: boolean,
  ): Promise<T> {
    const { maxRetries, baseDelayMs, maxDelayMs, backoffFactor, jitterMs, retryableStatusCodes } = retryConfig;
    const canRetry = retryConfig.withRetry && withRetry;

    for (let attempt = 0; attempt <= (canRetry ? maxRetries : 0); attempt += 1) {
      try {
        const response = await fetch(`${normalizedBaseUrl}${path}`, {
          method: options.method,
          headers: buildHeaders(options.headers, options.contentType),
          body: options.body,
        });

        if (!response.ok) {
          const responseBody = await parseErrorBody(response);
          const responseHeaders = parseHeaders(response);
          const requestId = getRequestId(response);
          const correlationId = getCorrelationId(response);
          const traceHeaders = getTraceHeaders(response);
          const shouldRetry = retryableStatusCodes.has(response.status);

          if (canRetry && shouldRetry && attempt < maxRetries) {
            await sleepWithBackoff(attempt, baseDelayMs, maxDelayMs, backoffFactor, jitterMs);
            continue;
          }

          throw new GuardiianoSDKError(
            response.status,
            response.statusText,
            responseBody,
            responseHeaders,
            requestId,
            correlationId,
            traceHeaders.traceparent,
            traceHeaders.tracestate,
            traceHeaders.baggage,
            traceHeaders.xAmznTraceId,
            traceHeaders.xB3TraceId,
            traceHeaders.xB3SpanId,
            traceHeaders.xB3ParentSpanId,
            traceHeaders.xB3Sampled,
            traceHeaders.xB3Flags,
            traceHeaders.xOtSpanContext,
          );
        }

        if (response.status === 204 || options.parseAs === 'void') {
          return undefined as T;
        }

        const text = await response.text();
        if (!text) {
          return undefined as T;
        }

        return JSON.parse(text) as T;
      } catch (error) {
        if (isNetworkError(error)) {
          const networkError = new GuardiianoNetworkError(error instanceof Error ? error.message : 'Network error');
          if (!canRetry || attempt >= maxRetries) {
            throw networkError;
          }
          await sleepWithBackoff(attempt, baseDelayMs, maxDelayMs, backoffFactor, jitterMs);
          continue;
        }

        if (!canRetry || attempt >= maxRetries) {
          throw error;
        }

        await sleepWithBackoff(attempt, baseDelayMs, maxDelayMs, backoffFactor, jitterMs);
      }
    }

    throw new Error('Unexpected error: retry loop exited without returning.');
  }

  function encodePathSegment(value: string): string {
    return encodeURIComponent(value);
  }

  function toQueryString(params: Record<string, QueryValue>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      search.set(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : '';
  }

  function toJsonBody(body: unknown): string {
    return JSON.stringify(body);
  }

  function toBlob(file: UploadFileParams['file'], contentType?: string): Blob {
    if (file instanceof Blob) {
      return file;
    }
    if (file instanceof ArrayBuffer) {
      return new Blob([file], { type: contentType });
    }
    const bytes = new Uint8Array(file.byteLength);
    bytes.set(file);
    return new Blob([bytes], { type: contentType });
  }

  async function reviewPurgeQueueItem(
    action: 'approve' | 'legal-hold' | 'reject',
    params: { id: UUID } & ReviewPurgeQueueRequest & RequestOptions,
  ): Promise<void> {
    const { id, reason, withRetry = false } = params;
    await request<void>(
      `/purge-queue/${encodePathSegment(id)}/${action}`,
      {
        method: 'POST',
        body: reason ? toJsonBody({ reason }) : undefined,
        parseAs: 'void',
      },
      withRetry,
    );
  }

  return {
    transport: 'rest' as const,
    setBearerToken(token?: string) {
      if (!token) {
        defaultHeaders.delete('Authorization');
        return;
      }
      defaultHeaders.set('Authorization', `Bearer ${token}`);
    },

    setApiKey(apiKey?: string) {
      if (!apiKey) {
        defaultHeaders.delete('X-Guardiiano-API-Key');
        return;
      }
      defaultHeaders.set('X-Guardiiano-API-Key', apiKey);
    },

    setDefaultHeader(name: string, value?: string) {
      if (value === undefined) {
        defaultHeaders.delete(name);
        return;
      }
      defaultHeaders.set(name, value);
    },

    clearDefaultHeaders() {
      const authorization = defaultHeaders.get('Authorization');
      const apiKey = defaultHeaders.get('X-Guardiiano-API-Key');
      defaultHeaders.forEach((_value, key) => {
        defaultHeaders.delete(key);
      });
      if (authorization) {
        defaultHeaders.set('Authorization', authorization);
      }
      if (apiKey) {
        defaultHeaders.set('X-Guardiiano-API-Key', apiKey);
      }
    },

    async login({ email, password, withRetry = false }) {
      return request<LoginResponse>(
        '/auth/login',
        {
          method: 'POST',
          body: toJsonBody({ email, password }),
        },
        withRetry,
      );
    },

    async refreshAuth({ refresh_token, withRetry = false }) {
      return request<LoginResponse>(
        '/auth/refresh',
        {
          method: 'POST',
          body: toJsonBody({ refresh_token }),
        },
        withRetry,
      );
    },

    async confirmEmail({ token, otp, withRetry = false }) {
      await request<void>(
        '/auth/confirm-email',
        {
          method: 'POST',
          body: toJsonBody({ token, otp }),
          parseAs: 'void',
        },
        withRetry,
      );
    },

    async createUser({ withRetry = false, ...payload }) {
      return request<CreateUserResponse>(
        '/auth/users',
        {
          method: 'POST',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async listUsers({ limit, offset, email, role, email_confirmed, withRetry = true }: ListUsersQuery & RequestOptions = {}) {
      return request<UserListResult>(
        `/auth/users${toQueryString({ limit, offset, email, role, email_confirmed })}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async getAccount({ withRetry = true }: RequestOptions = {}) {
      return request<AccountProfile>('/auth/account', { method: 'GET' }, withRetry);
    },

    async changeMyPassword({ current_password, new_password, withRetry = false }) {
      await request<void>(
        '/auth/account/change-password',
        {
          method: 'POST',
          body: toJsonBody({ current_password, new_password }),
          parseAs: 'void',
        },
        withRetry,
      );
    },

    async updateUser({ id, password, role, withRetry = false }) {
      await request<void>(
        `/auth/users/${encodePathSegment(id)}`,
        {
          method: 'PATCH',
          body: toJsonBody({ password, role }),
          parseAs: 'void',
        },
        withRetry,
      );
    },

    async deleteUser({ id, withRetry = false }) {
      await request<void>(
        `/auth/users/${encodePathSegment(id)}`,
        {
          method: 'DELETE',
          parseAs: 'void',
        },
        withRetry,
      );
    },

    async createApiKey({ withRetry = false, ...payload }) {
      return request<ApiKeySecretResponse>(
        '/auth/api-keys',
        {
          method: 'POST',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async listApiKeys({ withRetry = true }: RequestOptions = {}) {
      return request<ApiKey[]>('/auth/api-keys', { method: 'GET' }, withRetry);
    },

    async updateApiKeyRole({ id, role, withRetry = false }) {
      await request<void>(
        `/auth/api-keys/${encodePathSegment(id)}/role`,
        {
          method: 'PATCH',
          body: toJsonBody({ role }),
          parseAs: 'void',
        },
        withRetry,
      );
    },

    async regenerateApiKey({ id, withRetry = false }) {
      return request<ApiKeySecretResponse>(
        `/auth/api-keys/${encodePathSegment(id)}/regenerate`,
        { method: 'POST' },
        withRetry,
      );
    },

    async deleteApiKey({ id, withRetry = false }) {
      await request<void>(
        `/auth/api-keys/${encodePathSegment(id)}`,
        {
          method: 'DELETE',
          parseAs: 'void',
        },
        withRetry,
      );
    },

    async postAction<M>({ action, withRetry = true }: { action: Action<M>; withRetry?: boolean }) {
      return request<ActionAcceptedResponse>(
        '/actions',
        {
          method: 'POST',
          body: toJsonBody(action),
        },
        withRetry,
      );
    },

    async getDashboardOverview({ withRetry = true }: RequestOptions = {}) {
      return request<DashboardOverviewResponse>('/dashboard/overview', { method: 'GET' }, withRetry);
    },

    async getPrivacyDashboard({ withRetry = true }: RequestOptions = {}) {
      return request<PrivacyDashboardResponse>('/dashboard/privacy', { method: 'GET' }, withRetry);
    },

    async identifyDataSubject<T extends object = JsonObject>({
      system_uid,
      subject_context_code,
      data,
      withRetry = false,
    }: CreateDataSubjectRequest<T> & RequestOptions) {
      return request<DataSubjectToken>(
        '/data-subjects',
        {
          method: 'POST',
          body: toJsonBody({ system_uid, subject_context_code, data }),
        },
        withRetry,
      );
    },

    async registerDataSubject<T extends object = JsonObject>(
      { withRetry = false, ...payload }: RegisterDataSubjectRequest & RequestOptions,
    ) {
      return request<DataSubject<T>>(
        '/vault/registrations',
        {
          method: 'POST',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async updateDataSubject<T extends object = JsonObject>(
      { id, data, withRetry = false }: { id: UUID } & UpdateDataSubjectRequest<T> & RequestOptions,
    ) {
      return request<DataSubject<T>>(
        `/data-subjects/${encodePathSegment(id)}`,
        {
          method: 'PATCH',
          body: toJsonBody({ data }),
        },
        withRetry,
      );
    },

    async deleteDataSubject({ id, withRetry = false }) {
      await request<void>(
        `/data-subjects/${encodePathSegment(id)}`,
        {
          method: 'DELETE',
          parseAs: 'void',
        },
        withRetry,
      );
    },

    async updateDataSubjectSubjectContext<T extends object = JsonObject>({
      id,
      subject_context_code,
      withRetry = false,
    }: { id: UUID } & UpdateDataSubjectSubjectContextRequest & RequestOptions) {
      return request<DataSubject<T>>(
        `/data-subjects/${encodePathSegment(id)}/subject-context`,
        {
          method: 'PATCH',
          body: toJsonBody({ subject_context_code }),
        },
        withRetry,
      );
    },

    async transitionDataSubjectContext({ id, target_subject_context_code, reason, withRetry = false }) {
      return request<TransitionDataSubjectContextResult>(
        `/data-subjects/${encodePathSegment(id)}/transition-context`,
        {
          method: 'POST',
          body: toJsonBody({ target_subject_context_code, reason }),
        },
        withRetry,
      );
    },

    async previewTransitionDataSubjectContext({ id, target_subject_context_code, reason, withRetry = false }) {
      return request<TransitionDataSubjectContextResult>(
        `/data-subjects/${encodePathSegment(id)}/transition-context/preview`,
        {
          method: 'POST',
          body: toJsonBody({ target_subject_context_code, reason }),
        },
        withRetry,
      );
    },

    async listDataSubjects<T extends object = JsonObject>(
      { limit, offset, withRetry = true }: PaginationQuery & RequestOptions = {},
    ) {
      return request<PaginatedResult<DataSubject<T>>>(
        `/data-subjects${toQueryString({ limit, offset })}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async searchDataSubjects<T extends object = JsonObject>(
      { withRetry = true, ...payload }: SearchDataSubjectsRequest & RequestOptions,
    ) {
      return request<PaginatedResult<DataSubject<T>>>(
        '/data-subjects/search',
        {
          method: 'POST',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async listDataSubjectIndexFields({ withRetry = true }: RequestOptions = {}) {
      return request<string[]>('/data-subjects/index-fields', { method: 'GET' }, withRetry);
    },

    async getDataSubject<T extends object = JsonObject>({ token, withRetry = true }: { token: string; withRetry?: boolean }) {
      return request<DataSubject<T>>(
        `/data-subjects/${encodePathSegment(token)}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async getDataSubjectTagValues<T extends object = JsonObject>(
      { token, withRetry = true }: { token: string; withRetry?: boolean },
    ) {
      return request<Array<DataSubjectTagValue<T>>>(
        `/data-subjects/${encodePathSegment(token)}/tags`,
        { method: 'GET' },
        withRetry,
      );
    },

    async searchDataSubjectByIndex<T extends object = JsonObject>(
      { index, value, withRetry = true }: { index: string; value: string; withRetry?: boolean },
    ) {
      return request<Array<DataSubject<T>>>(
        `/data-subjects/${encodePathSegment(index)}/${encodePathSegment(value)}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async listDataSubjectConsents({ token, withRetry = true }) {
      return request<DataSubjectConsent[]>(
        `/data-subjects/${encodePathSegment(token)}/consents`,
        { method: 'GET' },
        withRetry,
      );
    },

    async listDataSubjectConsentEvents({ token, action, limit, offset, withRetry = true }) {
      return request<DataSubjectConsentEvent[]>(
        `/data-subjects/${encodePathSegment(token)}/consent-events${toQueryString({ action, limit, offset })}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async submitDataSubjectConsents({ token, consents, withRetry = false }) {
      return request<DataSubjectConsent[]>(
        `/data-subjects/${encodePathSegment(token)}/consents`,
        {
          method: 'PUT',
          body: toJsonBody({ consents }),
        },
        withRetry,
      );
    },

    async getMetrics<T = unknown>({ withRetry = true }: RequestOptions = {}) {
      return request<T>('/metrics', { method: 'GET' }, withRetry);
    },

    async uploadFile({ file, filename = 'upload.bin', contentType, withRetry = false }) {
      const formData = new FormData();
      formData.append('file', toBlob(file, contentType), filename);

      return request<UploadFileResponse>(
        '/upload',
        {
          method: 'POST',
          body: formData,
          contentType: false,
        },
        withRetry,
      );
    },

    async listAuditLogs({ limit, offset, withRetry = true }: PaginationQuery & RequestOptions = {}) {
      return request<AuditLog[]>(
        `/audit-logs${toQueryString({ limit, offset })}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async listAuditLogsByDataSubjectId({ dataSubjectId, limit, offset, withRetry = true }) {
      return request<AuditLog[]>(
        `/audit-logs/${encodePathSegment(dataSubjectId)}${toQueryString({ limit, offset })}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async createSubjectContext({ withRetry = false, ...payload }) {
      return request<SubjectContext>(
        '/subject-contexts',
        {
          method: 'POST',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async listSubjectContexts({ withRetry = true }: RequestOptions = {}) {
      return request<SubjectContext[]>('/subject-contexts', { method: 'GET' }, withRetry);
    },

    async getSubjectContext({ id, withRetry = true }) {
      return request<SubjectContext>(
        `/subject-contexts/${encodePathSegment(id)}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async updateSubjectContext({ id, withRetry = false, ...payload }) {
      return request<SubjectContext>(
        `/subject-contexts/${encodePathSegment(id)}`,
        {
          method: 'PATCH',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async deleteSubjectContext({ id, withRetry = false }) {
      await request<void>(
        `/subject-contexts/${encodePathSegment(id)}`,
        {
          method: 'DELETE',
          parseAs: 'void',
        },
        withRetry,
      );
    },

    async createDataTag({ withRetry = false, ...payload }) {
      return request<DataTag>(
        '/data-tags',
        {
          method: 'POST',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async listDataTags({ withRetry = true }: RequestOptions = {}) {
      return request<DataTag[]>('/data-tags', { method: 'GET' }, withRetry);
    },

    async getDataTag({ id, withRetry = true }) {
      return request<DataTag>(
        `/data-tags/${encodePathSegment(id)}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async updateDataTag({ id, withRetry = false, ...payload }) {
      return request<DataTag>(
        `/data-tags/${encodePathSegment(id)}`,
        {
          method: 'PATCH',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async deleteDataTag({ id, withRetry = false }) {
      await request<void>(
        `/data-tags/${encodePathSegment(id)}`,
        {
          method: 'DELETE',
          parseAs: 'void',
        },
        withRetry,
      );
    },

    async createPrivacyPolicy({ withRetry = false, ...payload }) {
      return request<PrivacyPolicy>(
        '/privacy-policies',
        {
          method: 'POST',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async listPrivacyPolicies({ withRetry = true }: RequestOptions = {}) {
      return request<PrivacyPolicy[]>('/privacy-policies', { method: 'GET' }, withRetry);
    },

    async getPrivacyPolicy({ id, withRetry = true }) {
      return request<PrivacyPolicy>(
        `/privacy-policies/${encodePathSegment(id)}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async updatePrivacyPolicy({ id, withRetry = false, ...payload }) {
      return request<PrivacyPolicy>(
        `/privacy-policies/${encodePathSegment(id)}`,
        {
          method: 'PATCH',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async deletePrivacyPolicy({ id, withRetry = false }) {
      await request<void>(
        `/privacy-policies/${encodePathSegment(id)}`,
        {
          method: 'DELETE',
          parseAs: 'void',
        },
        withRetry,
      );
    },

    async createPolicyRule({ withRetry = false, ...payload }) {
      return request<PolicyRule>(
        '/policy-rules',
        {
          method: 'POST',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async listPolicyRules({ withRetry = true }: RequestOptions = {}) {
      return request<PolicyRule[]>('/policy-rules', { method: 'GET' }, withRetry);
    },

    async getPolicyRule({ id, withRetry = true }) {
      return request<PolicyRule>(
        `/policy-rules/${encodePathSegment(id)}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async updatePolicyRule({ id, withRetry = false, ...payload }) {
      return request<PolicyRule>(
        `/policy-rules/${encodePathSegment(id)}`,
        {
          method: 'PATCH',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async deletePolicyRule({ id, withRetry = false }) {
      await request<void>(
        `/policy-rules/${encodePathSegment(id)}`,
        {
          method: 'DELETE',
          parseAs: 'void',
        },
        withRetry,
      );
    },

    async createConsentDefinition({ withRetry = false, ...payload }) {
      return request<ConsentDefinition>(
        '/consent-definitions',
        {
          method: 'POST',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async listConsentDefinitions({ withRetry = true }: RequestOptions = {}) {
      return request<ConsentDefinition[]>('/consent-definitions', { method: 'GET' }, withRetry);
    },

    async getConsentDefinition({ id, withRetry = true }) {
      return request<ConsentDefinition>(
        `/consent-definitions/${encodePathSegment(id)}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async updateConsentDefinition({ id, withRetry = false, ...payload }) {
      return request<ConsentDefinition>(
        `/consent-definitions/${encodePathSegment(id)}`,
        {
          method: 'PATCH',
          body: toJsonBody(payload),
        },
        withRetry,
      );
    },

    async deleteConsentDefinition({ id, withRetry = false }) {
      await request<void>(
        `/consent-definitions/${encodePathSegment(id)}`,
        {
          method: 'DELETE',
          parseAs: 'void',
        },
        withRetry,
      );
    },

    async getMetadataSchema({ context, withRetry = true }) {
      return request<MetadataSchemaResponse>(
        `/metadata/schema/${encodePathSegment(context)}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async listPurgeQueue({ status, data_tag_code, limit, offset, withRetry = true }: PurgeQueueListQuery & RequestOptions = {}) {
      return request<PurgeQueueItem[]>(
        `/purge-queue${toQueryString({ status, data_tag_code, limit, offset })}`,
        { method: 'GET' },
        withRetry,
      );
    },

    async approvePurgeQueueItem(params) {
      await reviewPurgeQueueItem('approve', params);
    },

    async legalHoldPurgeQueueItem(params) {
      await reviewPurgeQueueItem('legal-hold', params);
    },

    async rejectPurgeQueueItem(params) {
      await reviewPurgeQueueItem('reject', params);
    },
  };
}

export function createGuardiianoSDK(baseUrl: string, options?: GuardiianoSDKOptions): GuardiianoRestSDKApi;
export function createGuardiianoSDK(config: GuardiianoRestTransportConfig): GuardiianoRestSDKApi;
export function createGuardiianoSDK(config: GuardiianoGrpcTransportConfig): GuardiianoGrpcSDKApi;
export function createGuardiianoSDK(
  baseUrlOrConfig: string | GuardiianoClientConfig,
  options: GuardiianoSDKOptions = {},
): GuardiianoRestSDKApi | GuardiianoGrpcSDKApi {
  if (typeof baseUrlOrConfig === 'string') {
    return createGuardiianoRestSDK(baseUrlOrConfig, options);
  }

  if (baseUrlOrConfig.transport === 'grpc') {
    return createGuardiianoGrpcSDK(baseUrlOrConfig);
  }

  return createGuardiianoRestSDK(baseUrlOrConfig.baseUrl, baseUrlOrConfig);
}

declare module 'fastify' {
  interface FastifyInstance {
    guardiiano: GuardiianoRestSDKApi | GuardiianoGrpcSDKApi;
  }
}

export type GuardiianoPluginOptions =
  | LegacyGuardiianoPluginOptions
  | GuardiianoRestTransportConfig
  | GuardiianoGrpcTransportConfig;

async function guardiianoSdkPlugin(fastify: FastifyInstance, options: GuardiianoPluginOptions) {
  let sdk: GuardiianoRestSDKApi | GuardiianoGrpcSDKApi;

  if ('transport' in options) {
    if (options.transport === 'grpc') {
      sdk = createGuardiianoSDK(options);
    } else {
      sdk = createGuardiianoSDK(options);
    }
  } else {
    sdk = createGuardiianoRestSDK(options.baseUrl, options.retry);
  }

  fastify.decorate('guardiiano', sdk as never);
}

export default fp(guardiianoSdkPlugin, {
  name: 'guardiiano-sdk',
  fastify: '4.x - 5.x',
});
