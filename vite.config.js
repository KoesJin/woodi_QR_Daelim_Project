import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        allowedHosts: [
            '131d98fbea42.ngrok-free.app', // ngrok에서 발급받은 도메인
        ],
    },
});
