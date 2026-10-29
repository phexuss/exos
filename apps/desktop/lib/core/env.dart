/// Mock data and a fake engine: the design prototype (web build) and UI work.
const bool kMock = bool.fromEnvironment('EXOS_MOCK');

const String kApiBase = String.fromEnvironment('EXOS_API', defaultValue: 'https://exos-api.phexuss.dev/api');
