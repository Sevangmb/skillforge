/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Bundle optimization
  experimental: {
    optimizeCss: true,
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Ignore development files in production
    if (process.env.NODE_ENV === 'production') {
      config.ignoreWarnings = [
        { message: /Failed to parse source map/ },
        { message: /require.extensions is not supported by webpack/ },
        { message: /Can't resolve '@opentelemetry/ },
        { message: /Can't resolve '@genkit-ai\/firebase'/ },
      ];
    }
    
    return config;
  },
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;