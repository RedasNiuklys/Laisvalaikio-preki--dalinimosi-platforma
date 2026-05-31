// ADMIN_USER_ID and ADMIN_USER_EMAIL are module-level constants read at import time.
// Each env-dependent test uses jest.isolateModules() to reload the module with the env var set.

const makeUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  ...overrides,
} as any);

function loadWithEnv(id?: string, email?: string) {
  let fn: (user: any) => boolean;
  jest.isolateModules(() => {
    if (id !== undefined) process.env.EXPO_PUBLIC_ADMIN_USER_ID = id;
    if (email !== undefined) process.env.EXPO_PUBLIC_ADMIN_USER_EMAIL = email;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    fn = require('@/src/utils/adminAccess').isSingleAdminUser;
    delete process.env.EXPO_PUBLIC_ADMIN_USER_ID;
    delete process.env.EXPO_PUBLIC_ADMIN_USER_EMAIL;
  });
  return fn!;
}

describe('isSingleAdminUser — no env vars set', () => {
  let isSingleAdminUser: (user: any) => boolean;

  beforeAll(() => {
    isSingleAdminUser = loadWithEnv();
  });

  it('returns false for null user', () => {
    expect(isSingleAdminUser(null)).toBe(false);
  });

  it('returns false for undefined user', () => {
    expect(isSingleAdminUser(undefined)).toBe(false);
  });

  it('returns false when neither env var is set', () => {
    expect(isSingleAdminUser(makeUser())).toBe(false);
  });
});

describe('isSingleAdminUser — ADMIN_USER_ID set', () => {
  it('returns true when id matches', () => {
    const fn = loadWithEnv('user-123');
    expect(fn(makeUser())).toBe(true);
  });

  it('returns false when id does not match', () => {
    const fn = loadWithEnv('other-id');
    expect(fn(makeUser())).toBe(false);
  });

  it('prefers id over email when both are set', () => {
    const fn = loadWithEnv('user-123', 'nobody@example.com');
    expect(fn(makeUser())).toBe(true);
  });
});

describe('isSingleAdminUser — ADMIN_USER_EMAIL set (no id)', () => {
  it('returns true when email matches (case-insensitive)', () => {
    const fn = loadWithEnv(undefined, 'ADMIN@EXAMPLE.COM');
    expect(fn(makeUser({ email: 'admin@example.com' }))).toBe(true);
  });

  it('returns false when email does not match', () => {
    const fn = loadWithEnv(undefined, 'other@example.com');
    expect(fn(makeUser())).toBe(false);
  });
});
