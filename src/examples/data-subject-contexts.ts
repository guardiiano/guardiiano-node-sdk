import {
  createGuardiianoSDK,
  DataSubject,
  GuardiianoNetworkError,
  GuardiianoSDKError,
} from '../sdk';

type CandidateData = {
  system_uid: string;
  email: string;
  first_name: string;
  last_name: string;
  application_stage: string;
};

type EmployeeData = {
  system_uid: string;
  email: string;
  first_name: string;
  last_name: string;
  department: string;
  employee_code: string;
};

function printDataSubjects<T extends object>(label: string, items: Array<DataSubject<T>>): void {
  console.log(`\n${label} (${items.length})`);

  for (const item of items) {
    console.log({
      id: item.id,
      dsToken: item.dsToken,
      subjectContextCode: item.subject_context_code,
      data: item.data,
      createdAt: item.created_at,
    });
  }
}

function logSdkError(step: string, error: unknown): void {
  console.error(`\n[${step}] request failed`);

  if (error instanceof GuardiianoSDKError) {
    console.error({
      type: 'GuardiianoSDKError',
      status: error.status,
      statusText: error.statusText,
      responseBody: error.responseBody,
      requestId: error.requestId,
      correlationId: error.correlationId,
      trace: error.trace(),
    });
    return;
  }

  if (error instanceof GuardiianoNetworkError) {
    console.error({
      type: 'GuardiianoNetworkError',
      message: error.message,
    });
    return;
  }

  if (error instanceof Error) {
    console.error({
      type: error.name,
      message: error.message,
      stack: error.stack,
    });
    return;
  }

  console.error({ type: 'UnknownError', error });
}

async function main(): Promise<void> {

  // REST
  // const sdk = createGuardiianoSDK('http://localhost:8080/api/v1', {
  //   apiKey: process.env.GUARDIIANO_API_KEY,
  //   bearerToken: process.env.GUARDIIANO_BEARER_TOKEN,
  // });

  // gRPC
  const sdk = createGuardiianoSDK({
    endpoint: 'localhost:9090',
    transport: 'grpc',
    apiKey: process.env.GUARDIIANO_API_KEY
  })

  const candidatePayload: CandidateData = {
    system_uid: `candidate-${Date.now()}`,
    email: 'candidate@example.com',
    first_name: 'Mario',
    last_name: 'Rossi',
    application_stage: 'INTERVIEW',
  };

  const employeePayload: EmployeeData = {
    system_uid: `employee-${Date.now()}`,
    email: 'employee@example.com',
    first_name: 'Giulia',
    last_name: 'Bianchi',
    department: 'Engineering',
    employee_code: 'EMP-001',
  };

  try {
    const createdCandidate = await sdk.identifyDataSubject<CandidateData>({
      system_uid: candidatePayload.system_uid,
      subject_context_code: 'CANDIDATE',
      data: candidatePayload,
    });

    console.log('Created candidate data subject token:', createdCandidate);
  } catch (error: unknown) {
    logSdkError('create candidate data subject', error);
  }

  try {
    const createdEmployee = await sdk.identifyDataSubject<EmployeeData>({
      system_uid: employeePayload.system_uid,
      subject_context_code: 'EMPLOYEE',
      data: employeePayload,
    });

    console.log('Created employee data subject token:', createdEmployee);
  } catch (error: unknown) {
    logSdkError('create employee data subject', error);
  }

  try {
    const candidateDataSubjects = await sdk.searchDataSubjects<CandidateData>({
      subject_context_code: 'CANDIDATE',
      limit: 50,
      offset: 0,
    });

    printDataSubjects<CandidateData>('Data Subjects CANDIDATE', candidateDataSubjects.items);
  } catch (error: unknown) {
    logSdkError('list candidate data subjects', error);
  }

  try {
    const employeeDataSubjects = await sdk.searchDataSubjects<EmployeeData>({
      subject_context_code: 'EMPLOYEE',
      limit: 50,
      offset: 0,
    });

    printDataSubjects<EmployeeData>('Data Subjects EMPLOYEE', employeeDataSubjects.items);
  } catch (error: unknown) {
    logSdkError('list employee data subjects', error);
  }
}

void main().catch((error: unknown) => {
  console.error('Example failed:', error);
  process.exitCode = 1;
});
