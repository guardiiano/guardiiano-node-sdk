import Fastify from 'fastify';
import guardiianoApiPlugin, { GuardiianoNetworkError, GuardiianoSDKError, isDataSubject } from './sdk';

const app = Fastify({ logger: true });

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

app.register(guardiianoApiPlugin, { baseUrl: 'http://localhost:8081' });

app.get('/candidates/:token', async (request, reply) => {
  const { token } = request.params as { token: string };

  try {
    const result = await app.guardiiano.getDataSubject<Candidate>({ token });

    if (isDataSubject(result)) {
      app.log.info({ dataSubject: result.data }, 'result is a DataSubject');
    } else {
      app.log.info('result is not a DataSubject');
    }

    return result;
  } catch (error) {
    if (error instanceof GuardiianoSDKError && error.status === 404) {
      reply.code(404);
      return {
        error: 'Candidate not found',
        code: error.code,
        details: error.responseBody,
        headers: error.responseHeaders,
        requestId: error.requestId,
        correlationId: error.correlationId,
      };
    }
    if (error instanceof GuardiianoNetworkError) {
      reply.code(503);
      return { error: 'Network error', code: error.code };
    }
    reply.code(502);
    return { error: 'Upstream error' };
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT ?? '3000');
    const host = process.env.HOST ?? '0.0.0.0';

    await app.listen({ port, host });
    app.log.info(`Server running on ${host}:${port}`);
  } catch (error) {
    app.log.error(error, 'Failed to start server');
    process.exit(1);
  }
};

void start();
