import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "CodeBook 常识学习",
        short_name: "CodeBook",
        description: "有趣的常识学习类APP",
        theme_color: "#ffffff",
        icons: [
          {
            src: "logo.avif",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "logo.avif",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
