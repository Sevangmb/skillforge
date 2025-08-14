/** @type {import('next').NextConfig} */

const bundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

const nextConfig = {
  // Performance optimizations
  experimental: {
    // Enable modern output
    outputFileTracingIncludes: {
      '/api/skills': ['./src/lib/skills/**/*'],
      '/api/achievements': ['./src/lib/achievements/**/*'],
    },
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-tabs',
      '@radix-ui/react-dialog',
      'recharts'
    ],
    // Enable turbopack for development
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    }
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Image optimization
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
  },

  // Webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Split chunks more aggressively
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for React ecosystem
          react: {
            name: 'react-vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            priority: 40,
            reuseExistingChunk: true,
          },
          // UI library chunk
          ui: {
            name: 'ui-vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|framer-motion)[\\/]/,
            priority: 30,
            reuseExistingChunk: true,
          },
          // Firebase chunk
          firebase: {
            name: 'firebase-vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](firebase|@genkit-ai)[\\/]/,
            priority: 25,
            reuseExistingChunk: true,
          },
          // Charts chunk
          charts: {
            name: 'charts-vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
            priority: 20,
            reuseExistingChunk: true,
          },
          // Common vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            minChunks: 1,
            reuseExistingChunk: true,
          },
        },
      };

      // Minimize bundle size
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // Tree shaking for specific libraries
    config.resolve.alias = {
      ...config.resolve.alias,
      'lodash': 'lodash-es',
    };

    // Optimize imports
    config.module.rules.push({
      test: /\.tsx?$/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            plugins: [
              // Transform imports for better tree shaking
              ['import', { libraryName: 'lodash', libraryDirectory: '', camel2DashComponentName: false }, 'lodash'],
              ['import', { libraryName: '@radix-ui', transformToDefaultImport: false }],
            ]
          }
        }
      ],
    });

    return config;
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [];
  },

  // Performance budget warnings
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },

  // Development performance
  ...(process.env.NODE_ENV === 'development' && {
    // Disable source maps in development for faster builds
    productionBrowserSourceMaps: false,
  }),
};

module.exports = bundleAnalyzer(nextConfig);