// vite.config.mts
import Components from "file:///C:/Users/Hassan.Akbar/Documents/VsCode/metalake/frontend/node_modules/.pnpm/unplugin-vue-components@0.27.5_@babel+parser@7.26.3_rollup@4.29.1_vue@3.5.13_typescript@5.6.3_/node_modules/unplugin-vue-components/dist/vite.js";
import Vue from "file:///C:/Users/Hassan.Akbar/Documents/VsCode/metalake/frontend/node_modules/.pnpm/@vitejs+plugin-vue@5.2.1_vite@5.4.11_@types+node@22.10.2_sass-embedded@1.83.0_sass@1.77.8__vue@3.5.13_typescript@5.6.3_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import Vuetify, { transformAssetUrls } from "file:///C:/Users/Hassan.Akbar/Documents/VsCode/metalake/frontend/node_modules/.pnpm/vite-plugin-vuetify@2.0.4_vite@5.4.11_@types+node@22.10.2_sass-embedded@1.83.0_sass@1.77.8__v_nfxoz7a4bxhjdvosoowacxyeyq/node_modules/vite-plugin-vuetify/dist/index.mjs";
import ViteFonts from "file:///C:/Users/Hassan.Akbar/Documents/VsCode/metalake/frontend/node_modules/.pnpm/unplugin-fonts@1.3.1_vite@5.4.11_@types+node@22.10.2_sass-embedded@1.83.0_sass@1.77.8_/node_modules/unplugin-fonts/dist/vite.mjs";
import VueRouter from "file:///C:/Users/Hassan.Akbar/Documents/VsCode/metalake/frontend/node_modules/.pnpm/unplugin-vue-router@0.10.9_rollup@4.29.1_vue-router@4.5.0_vue@3.5.13_typescript@5.6.3___vue@3.5.13_typescript@5.6.3_/node_modules/unplugin-vue-router/dist/vite.js";
import { defineConfig } from "file:///C:/Users/Hassan.Akbar/Documents/VsCode/metalake/frontend/node_modules/.pnpm/vite@5.4.11_@types+node@22.10.2_sass-embedded@1.83.0_sass@1.77.8/node_modules/vite/dist/node/index.js";
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/Hassan.Akbar/Documents/VsCode/metalake/frontend/vite.config.mts";
var vite_config_default = defineConfig({
  plugins: [
    VueRouter(),
    Vue({
      template: { transformAssetUrls }
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: "src/styles/settings.scss"
      }
    }),
    Components(),
    ViteFonts({
      google: {
        families: [{
          name: "Roboto",
          styles: "wght@100;300;400;500;700;900"
        }]
      }
    })
  ],
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    },
    extensions: [
      ".js",
      ".json",
      ".jsx",
      ".mjs",
      ".ts",
      ".tsx",
      ".vue"
    ]
  },
  server: {
    port: 3e3,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: "modern-compiler"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcSGFzc2FuLkFrYmFyXFxcXERvY3VtZW50c1xcXFxWc0NvZGVcXFxcbWV0YWxha2VcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEhhc3Nhbi5Ba2JhclxcXFxEb2N1bWVudHNcXFxcVnNDb2RlXFxcXG1ldGFsYWtlXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvSGFzc2FuLkFrYmFyL0RvY3VtZW50cy9Wc0NvZGUvbWV0YWxha2UvZnJvbnRlbmQvdml0ZS5jb25maWcubXRzXCI7Ly8gUGx1Z2luc1xuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSdcbmltcG9ydCBWdWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IFZ1ZXRpZnksIHsgdHJhbnNmb3JtQXNzZXRVcmxzIH0gZnJvbSAndml0ZS1wbHVnaW4tdnVldGlmeSdcbmltcG9ydCBWaXRlRm9udHMgZnJvbSAndW5wbHVnaW4tZm9udHMvdml0ZSdcbmltcG9ydCBWdWVSb3V0ZXIgZnJvbSAndW5wbHVnaW4tdnVlLXJvdXRlci92aXRlJ1xuXG4vLyBVdGlsaXRpZXNcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCdcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBWdWVSb3V0ZXIoKSxcbiAgICBWdWUoe1xuICAgICAgdGVtcGxhdGU6IHsgdHJhbnNmb3JtQXNzZXRVcmxzIH0sXG4gICAgfSksXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3Z1ZXRpZnlqcy92dWV0aWZ5LWxvYWRlci90cmVlL21hc3Rlci9wYWNrYWdlcy92aXRlLXBsdWdpbiNyZWFkbWVcbiAgICBWdWV0aWZ5KHtcbiAgICAgIGF1dG9JbXBvcnQ6IHRydWUsXG4gICAgICBzdHlsZXM6IHtcbiAgICAgICAgY29uZmlnRmlsZTogJ3NyYy9zdHlsZXMvc2V0dGluZ3Muc2NzcycsXG4gICAgICB9LFxuICAgIH0pLFxuICAgIENvbXBvbmVudHMoKSxcbiAgICBWaXRlRm9udHMoe1xuICAgICAgZ29vZ2xlOiB7XG4gICAgICAgIGZhbWlsaWVzOiBbIHtcbiAgICAgICAgICBuYW1lOiAnUm9ib3RvJyxcbiAgICAgICAgICBzdHlsZXM6ICd3Z2h0QDEwMDszMDA7NDAwOzUwMDs3MDA7OTAwJyxcbiAgICAgICAgfV0sXG4gICAgICB9LFxuICAgIH0pLFxuICBdLFxuICBkZWZpbmU6IHsgJ3Byb2Nlc3MuZW52Jzoge30gfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICAgIGV4dGVuc2lvbnM6IFtcbiAgICAgICcuanMnLFxuICAgICAgJy5qc29uJyxcbiAgICAgICcuanN4JyxcbiAgICAgICcubWpzJyxcbiAgICAgICcudHMnLFxuICAgICAgJy50c3gnLFxuICAgICAgJy52dWUnLFxuICAgIF0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjUwMDAnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBjc3M6IHtcbiAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICBzYXNzOiB7XG4gICAgICAgIGFwaTogJ21vZGVybi1jb21waWxlcicsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sU0FBUztBQUNoQixPQUFPLFdBQVcsMEJBQTBCO0FBQzVDLE9BQU8sZUFBZTtBQUN0QixPQUFPLGVBQWU7QUFHdEIsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxlQUFlLFdBQVc7QUFUbU0sSUFBTSwyQ0FBMkM7QUFZdlIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsVUFBVTtBQUFBLElBQ1YsSUFBSTtBQUFBLE1BQ0YsVUFBVSxFQUFFLG1CQUFtQjtBQUFBLElBQ2pDLENBQUM7QUFBQTtBQUFBLElBRUQsUUFBUTtBQUFBLE1BQ04sWUFBWTtBQUFBLE1BQ1osUUFBUTtBQUFBLFFBQ04sWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELFdBQVc7QUFBQSxJQUNYLFVBQVU7QUFBQSxNQUNSLFFBQVE7QUFBQSxRQUNOLFVBQVUsQ0FBRTtBQUFBLFVBQ1YsTUFBTTtBQUFBLFVBQ04sUUFBUTtBQUFBLFFBQ1YsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxRQUFRLEVBQUUsZUFBZSxDQUFDLEVBQUU7QUFBQSxFQUM1QixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3REO0FBQUEsSUFDQSxZQUFZO0FBQUEsTUFDVjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsS0FBSztBQUFBLElBQ0gscUJBQXFCO0FBQUEsTUFDbkIsTUFBTTtBQUFBLFFBQ0osS0FBSztBQUFBLE1BQ1A7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
