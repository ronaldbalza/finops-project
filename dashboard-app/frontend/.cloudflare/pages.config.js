export default {
  // Build configuration
  build: {
    command: "npm run build",
    output: "dist",
    environment: {
      NODE_VERSION: "18"
    }
  },

  // Development configuration
  dev: {
    command: "npm run dev",
    port: 3000,
    framework: "vite"
  },

  // Routes configuration
  routes: [
    // Serve static assets from the public directory
    {
      pattern: "/assets/*",
      path: "/assets/*"
    },
    // Handle API requests
    {
      pattern: "/api/*",
      handler: "api"
    },
    // Serve index.html for all other routes (SPA)
    {
      pattern: "/*",
      handler: "index"
    }
  ],

  // Environment variables
  env: {
    VITE_API_URL: {
      development: "http://localhost:8787",
      production: "https://api.yourdomain.com"
    }
  }
} 