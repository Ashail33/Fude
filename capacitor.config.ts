import type { CapacitorConfig } from '@capacitor/cli'

/** The Android app: the built game (dist/) in a native shell. */
const config: CapacitorConfig = {
  appId: 'com.ashail.kotobanomaho',
  appName: '言葉の魔法',
  webDir: 'dist',
  backgroundColor: '#0f1024',
  android: {
    // keep the game's own key handling and full-screen canvas
    captureInput: true,
  },
}

export default config
