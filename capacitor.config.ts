import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alrajhi.accounting',
  appName: 'الراجحي للمحاسبة',
  webDir: './',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4f46e5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
    }
  }
};

export default config;
