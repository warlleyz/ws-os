
import { useEffect, useState } from 'react'

import { appLifecycle } from './core/lifecycle'
import { Desktop } from './shell/Desktop'

import {
  loadPreferences,
  savePreferences,
  type Preferences,
} from './lib/preferences'

function App() {
  const [preferences] = useState<Preferences>(
    loadPreferences,
  )

  useEffect(() => {
    document.documentElement.dataset.theme =
      preferences.theme

    savePreferences(preferences)
  }, [preferences])

  function handleOpenApp(appId: string): string {
    return appLifecycle.open(appId)
  }

  return (
    <Desktop onOpenApp={handleOpenApp} />
  )
}

export default App
