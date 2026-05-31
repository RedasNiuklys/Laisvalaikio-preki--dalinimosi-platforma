const mockHubConnection = {
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  off: jest.fn(),
  invoke: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue(undefined),
  state: 'Connected',
  onclose: jest.fn(),
  onreconnecting: jest.fn(),
  onreconnected: jest.fn(),
};

const mockBuilder = {
  withUrl: jest.fn().mockReturnThis(),
  withAutomaticReconnect: jest.fn().mockReturnThis(),
  configureLogging: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue(mockHubConnection),
};

module.exports = {
  HubConnectionBuilder: jest.fn().mockImplementation(() => mockBuilder),
  HubConnectionState: {
    Connected: 'Connected',
    Disconnected: 'Disconnected',
    Connecting: 'Connecting',
    Reconnecting: 'Reconnecting',
  },
  LogLevel: { None: 0, Critical: 1, Error: 2, Warning: 3, Information: 4, Debug: 5, Trace: 6 },
};
