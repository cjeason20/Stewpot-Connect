import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.stewpot.connect',
  appName: 'Stewpot Connect',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Remove this 'url' line before building for production/app store.
    // Only uncomment it when doing live-reload development on a device:
    // url: 'http://YOUR_LOCAL_IP:3000',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2d6a2d',
      showSpinner: false,
    },
  },
};

export default config;
