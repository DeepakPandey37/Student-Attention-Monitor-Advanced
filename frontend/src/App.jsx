import { useState } from 'react'
import WelcomeScreen from './components/WelcomeScreen'
import MockTest      from './components/MockTest'
import ResultScreen  from './components/ResultScreen'


export default function App() {
  const [screen,      setScreen]      = useState('welcome')   
  const [studentName, setStudentName] = useState('')
  const [testResult,  setTestResult]  = useState(null)

  const handleStart = (name) => {
    setStudentName(name)
    setScreen('test')
  }

  const handleComplete = (result) => {
    setTestResult(result)
    setScreen('result')
  }

  const handleRetry = () => {
    setTestResult(null)
    setScreen('welcome')
  }

  return (
    <>
      {screen === 'welcome' && (
        <WelcomeScreen onStart={handleStart} />
      )}
      {screen === 'test' && (
        <MockTest
          studentName={studentName}
          onComplete={handleComplete}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          result={testResult}
          studentName={studentName}
          onRetry={handleRetry}
        />
      )}
    </>
  )
}
