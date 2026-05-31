const React = require('react');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  setParams: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(false),
};

module.exports = {
  useRouter: () => mockRouter,
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  Link: ({ children, href, ...props }) =>
    React.createElement('a', { href, ...props }, children),
  router: mockRouter,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
  Slot: () => null,
  Redirect: () => null,
};
