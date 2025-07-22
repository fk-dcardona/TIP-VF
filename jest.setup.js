// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js modules
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    reload: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    reload: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
    h4: ({ children, ...props }) => <h4 {...props}>{children}</h4>,
    h5: ({ children, ...props }) => <h5 {...props}>{children}</h5>,
    h6: ({ children, ...props }) => <h6 {...props}>{children}</h6>,
    ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    a: ({ children, ...props }) => <a {...props}>{children}</a>,
    img: ({ ...props }) => <img {...props} />,
    svg: ({ children, ...props }) => <svg {...props}>{children}</svg>,
    path: ({ ...props }) => <path {...props} />,
    circle: ({ ...props }) => <circle {...props} />,
    rect: ({ ...props }) => <rect {...props} />,
    g: ({ children, ...props }) => <g {...props}>{children}</g>,
    text: ({ children, ...props }) => <text {...props}>{children}</text>,
    tspan: ({ children, ...props }) => <tspan {...props}>{children}</tspan>,
    line: ({ ...props }) => <line {...props} />,
    polygon: ({ ...props }) => <polygon {...props} />,
    polyline: ({ ...props }) => <polyline {...props} />,
    ellipse: ({ ...props }) => <ellipse {...props} />,
    foreignObject: ({ children, ...props }) => <foreignObject {...props}>{children}</foreignObject>,
  },
  AnimatePresence: ({ children }) => children,
  useMotionValue: (initial) => ({ current: initial }),
  useTransform: (value, input, output) => ({ current: output }),
  useSpring: (value) => ({ current: value }),
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useInView: () => ({ ref: jest.fn(), inView: true }),
  useReducedMotion: () => false,
  useCycle: (...args) => [args[0], jest.fn()],
  useAnimationFrame: (callback) => {
    callback(0);
    return () => {};
  },
  useMotionValueEvent: jest.fn(),
  useScroll: () => ({
    scrollX: { current: 0 },
    scrollY: { current: 0 },
    scrollXProgress: { current: 0 },
    scrollYProgress: { current: 0 },
  }),
  useTransform: (value, input, output) => ({ current: output }),
  useMotionTemplate: (template) => template,
  useMotionValue: (initial) => ({ current: initial }),
  usePresence: () => [true, jest.fn()],
  useDragControls: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    block: jest.fn(),
    unblock: jest.fn(),
  }),
  usePanGesture: () => ({
    pan: { current: { x: 0, y: 0 } },
    panOffset: { current: { x: 0, y: 0 } },
    panVelocity: { current: { x: 0, y: 0 } },
  }),
  useTapGesture: () => ({
    tap: { current: { x: 0, y: 0 } },
    tapVelocity: { current: { x: 0, y: 0 } },
  }),
  useHoverGesture: () => ({
    hover: { current: false },
  }),
  useFocusGesture: () => ({
    focus: { current: false },
  }),
  useGesture: () => ({
    gesture: { current: {} },
  }),
}));

// Mock browser APIs
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ status: 'success', data: {} }),
    text: () => Promise.resolve('{}'),
  })
);

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000/api';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_dummy';
process.env.CLERK_SECRET_KEY = 'sk_test_dummy';