import { useState } from 'react'
import { LandingPage } from './components/LandingPage'
import { MainExplorer } from './components/MainExplorer'

function App() {
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  return (
    <>
      {!isDataLoaded ? (
        <LandingPage onLoadComplete={() => setIsDataLoaded(true)} />
      ) : (
        <MainExplorer />
      )}
    </>
  )
}

export default App
