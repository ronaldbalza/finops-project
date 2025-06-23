module.exports = {
  // Build output directory
  buildOutput: "dist",
  
  // Build command
  buildCommand: "npm run build",
  
  // Root directory of your source code
  // Cloudflare Pages will look for package.json, yarn.lock, or pnpm-lock.yaml in this directory
  rootDirectory: "dashboard-app/frontend",
  
  // The directory to serve static assets from (if different from buildOutput)
  publicPath: "public",
  
  // Framework preset (Vite in this case)
  framework: "vite",
  
  // Environment variables
  environmentVariables: {
    NODE_VERSION: "18"
  },
  
  // Build settings
  build: {
    command: "npm run build",
    environment: {
      NODE_VERSION: "18"
    }
  },
  
  // Routes configuration
  routes: [
    { src: "/api/*", func: "api" },
    { src: "/*", dest: "/index.html" }
  ]
} 