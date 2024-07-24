import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      vue: '@vue/compat',
    }
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 2
          }
        }
      }
    }),
  ],

	server: {
		port: 8190,
		proxy: {
			"^/api": {
				target: "http://localhost:8191"
			},
      "^/login-callback": {
				target: "http://localhost:8191",
			},
    }
	},
})
