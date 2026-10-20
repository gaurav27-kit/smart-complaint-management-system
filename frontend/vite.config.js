import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the function form of defineConfig to access `mode` and load env vars
// via Vite's official loadEnv() mechanism (Vite best practice).
// The empty string prefix "" loads ALL env variables (not just VITE_-prefixed),
// which is required for Docker Compose to pass VITE_BACKEND_URL into the config.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Resolve the backend proxy target:
  //   - Docker:    VITE_BACKEND_URL=http://backend:5000  (set in docker-compose.yml)
  //   - Local dev: falls back to http://127.0.0.1:5000   (unchanged behaviour)
  const backendTarget = env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      // Bind to 0.0.0.0 so the Vite dev server is reachable from:
      //   - the host machine (http://localhost:5173)
      //   - other containers on the Docker network
      // This does not change local-dev behaviour; browsers still access via localhost.
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
                return "vendor-react";
              }
              if (id.includes("recharts")) {
                return "vendor-charts";
              }
              if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("html-to-image")) {
                return "vendor-pdf";
              }
              if (id.includes("lucide-react") || id.includes("react-icons")) {
                return "vendor-icons";
              }
              return "vendor";
            }
          },
        },
      },
    },
  };
});