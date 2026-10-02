import { useState, useEffect, useCallback, useRef } from 'react'

// Types
interface Signal {
  id: number
  cor: 'blue' | 'red'
  hora: string
  resultado?: 'green' | 'red' | 'gale' | 'pending'
  tentativa: number
  timestamp: number
}

interface Notification {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  timestamp: number
}

interface Stats {
  wins: number
  losses: number
  gales: number
  total: number
}

// Utility functions
const getHoraAtual = () => {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const getRandomEmoji = () => {
  const emojis = ['👁️', '🎯', '⚡', '🔥', '💎', '🌟']
  return emojis[Math.floor(Math.random() * emojis.length)]
}

const getRandomConfidence = () => {
  return Math.floor(Math.random() * 13) + 3
}

export default function App() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null)
  const [stats, setStats] = useState<Stats>({ wins: 0, losses: 0, gales: 0, total: 0 })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [autoMode, setAutoMode] = useState(false)
  const [autoInterval, setAutoInterval] = useState(30)
  const [countdown, setCountdown] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notifIdRef = useRef(0)
  const signalIdRef = useRef(0)

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Add notification
  const addNotification = useCallback((message: string, type: Notification['type']) => {
    const id = ++notifIdRef.current
    setNotifications(prev => [...prev.slice(-4), { id, message, type, timestamp: Date.now() }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 4000)
  }, [])

  // Generate signal
  const generateSignal = useCallback(() => {
    setIsAnalyzing(true)
    setShowResult(false)

    setTimeout(() => {
      const cor: 'blue' | 'red' = Math.random() > 0.5 ? 'blue' : 'red'
      const id = ++signalIdRef.current
      const signal: Signal = {
        id,
        cor,
        hora: getHoraAtual(),
        tentativa: 1,
        timestamp: Date.now(),
        resultado: 'pending'
      }

      setCurrentSignal(signal)
      setSignals(prev => [signal, ...prev].slice(0, 50))
      setIsAnalyzing(false)
      setShowResult(true)
      addNotification(`🎯 Novo sinal: ${cor === 'blue' ? '🔵 BLUE' : '🔴 RED'}`, 'info')
    }, 2000)
  }, [addNotification])

  // Auto mode
  useEffect(() => {
    if (autoMode) {
      setCountdown(autoInterval)
      generateSignal()

      autoTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            generateSignal()
            return autoInterval
          }
          return prev - 1
        })
      }, 1000)

      countdownRef.current = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    } else {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
      setCountdown(0)
    }

    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [autoMode, autoInterval, generateSignal])

  // Handle result
  const handleResult = (result: 'green' | 'red') => {
    if (!currentSignal) return

    if (result === 'green') {
      setStats(prev => ({
        ...prev,
        wins: prev.wins + 1,
        total: prev.total + 1
      }))
      setSignals(prev => prev.map(s =>
        s.id === currentSignal.id ? { ...s, resultado: 'green' } : s
      ))
      setStreak(prev => {
        const newStreak = prev + 1
        if (newStreak > bestStreak) setBestStreak(newStreak)
        return newStreak
      })
      addNotification('✅ GREEN! Vitória confirmada!', 'success')
      setShowResult(false)
    } else {
      // Red - check for gale
      if (currentSignal.tentativa <= 2) {
        setStats(prev => ({ ...prev, gales: prev.gales + 1 }))
        const newSignal: Signal = {
          ...currentSignal,
          id: ++signalIdRef.current,
          tentativa: currentSignal.tentativa + 1,
          resultado: 'pending',
          timestamp: Date.now(),
          hora: getHoraAtual()
        }
        setCurrentSignal(newSignal)
        setSignals(prev => [newSignal, ...prev].slice(0, 50))
        addNotification(`🔄 Gale ${currentSignal.tentativa}/2 - Nova entrada!`, 'warning')
      } else {
        setStats(prev => ({
          ...prev,
          losses: prev.losses + 1,
          total: prev.total + 1
        }))
        setSignals(prev => prev.map(s =>
          s.id === currentSignal.id ? { ...s, resultado: 'red' } : s
        ))
        setStreak(0)
        addNotification('❌ RED! Sinais esgotados.', 'error')
        setShowResult(false)
      }
    }
  }

  // Assertividade
  const assertividade = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : '0.0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#1a1040] text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`animate-slide-in glass-card rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 ${
              notif.type === 'success' ? 'border-green-500/30' :
              notif.type === 'error' ? 'border-red-500/30' :
              notif.type === 'warning' ? 'border-yellow-500/30' :
              'border-blue-500/30'
            }`}
          >
            <span className="text-lg">
              {notif.type === 'success' ? '✅' :
               notif.type === 'error' ? '❌' :
               notif.type === 'warning' ? '⚠️' : '🔔'}
            </span>
            <span className="text-sm font-medium">{notif.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-green-500/20">
                🤖
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Robô BAC BO
              </h1>
              <p className="text-xs text-gray-400">Sinais Inteligentes v2.0</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 glass-card rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-300">Online</span>
            </div>
            <div className="glass-card rounded-lg px-3 py-2">
              <span className="text-sm font-mono text-green-400">
                {currentTime.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Signal & Controls */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Current Signal Card */}
            <div className="glass-card rounded-2xl p-6 gradient-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-2xl">📡</span> Sinal Atual
                </h2>
                {autoMode && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400 font-medium">AUTO</span>
                  </div>
                )}
              </div>

              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin-slow mb-4"></div>
                  <p className="text-gray-400 animate-pulse">Analisando padrões...</p>
                  <div className="flex gap-1 mt-3">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      ></div>
                    ))}
                  </div>
                </div>
              ) : currentSignal ? (
                <div className="space-y-4">
                  {/* Signal Display */}
                  <div className={`rounded-xl p-6 text-center ${
                    currentSignal.cor === 'blue'
                      ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 animate-pulse-glow'
                      : 'bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-500/30 animate-pulse-glow-red'
                  }`}>
                    <div className="text-5xl mb-3">
                      {currentSignal.cor === 'blue' ? '🔵' : '🔴'}
                    </div>
                    <h3 className="text-2xl font-bold mb-1">
                      {currentSignal.cor === 'blue' ? 'BLUE' : 'RED'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {getRandomEmoji()} Entrada confirmada • {currentSignal.hora}
                    </p>
                    {currentSignal.tentativa > 1 && (
                      <div className="mt-2 inline-flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-3 py-1">
                        <span className="text-xs text-yellow-400">🔄 Gale {currentSignal.tentativa - 1}/2</span>
                      </div>
                    )}
                  </div>

                  {/* Protection Info */}
                  <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛡️</span>
                      <span className="text-sm text-gray-300">Proteção:</span>
                    </div>
                    <span className="font-medium">
                      {currentSignal.cor === 'blue' ? '🔴 Red' : '🔵 Blue'}
                    </span>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <span className="text-sm text-gray-300">Confiança:</span>
                    </div>
                    <span className="font-bold text-green-400">{getRandomConfidence()}%</span>
                  </div>

                  {/* Result Buttons */}
                  {showResult && (
                    <div className="flex gap-3 animate-fade-in-up">
                      <button
                        onClick={() => handleResult('green')}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/20 active:scale-95"
                      >
                        ✅ GREEN
                      </button>
                      <button
                        onClick={() => handleResult('red')}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-red-500/20 active:scale-95"
                      >
                        ❌ RED
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <span className="text-4xl mb-3">🎲</span>
                  <p>Clique em gerar sinal para começar</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Manual Generate */}
              <button
                onClick={generateSignal}
                disabled={isAnalyzing || autoMode}
                className="glass-card rounded-xl p-5 flex items-center gap-4 hover:bg-white/5 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Gerar Sinal</p>
                  <p className="text-xs text-gray-400">Entrada manual</p>
                </div>
              </button>

              {/* Auto Mode Toggle */}
              <div className="glass-card rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center text-2xl">
                  ⚡
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-white">Modo Automático</p>
                  <p className="text-xs text-gray-400">
                    {autoMode ? `Próximo em ${countdown}s` : 'Desativado'}
                  </p>
                </div>
                <button
                  onClick={() => setAutoMode(!autoMode)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                    autoMode ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                    autoMode ? 'left-8' : 'left-1'
                  }`}></div>
                </button>
              </div>
            </div>

            {/* Auto Interval */}
            {autoMode && (
              <div className="glass-card rounded-xl p-4 animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-300">⏱️ Intervalo entre sinais</span>
                  <span className="text-sm font-bold text-green-400">{autoInterval}s</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={autoInterval}
                  onChange={(e) => setAutoInterval(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10s</span>
                  <span>120s</span>
                </div>
              </div>
            )}

            {/* Signal History */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <span className="text-2xl">📋</span> Histórico de Sinais
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {signals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhum sinal gerado ainda</p>
                ) : (
                  signals.slice(0, 15).map(signal => (
                    <div
                      key={signal.id}
                      className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2.5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {signal.cor === 'blue' ? '🔵' : '🔴'}
                        </span>
                        <div>
                          <p className="text-sm font-medium">
                            {signal.cor === 'blue' ? 'Blue' : 'Red'}
                            {signal.tentativa > 1 && (
                              <span className="ml-2 text-xs text-yellow-400">G{signal.tentativa - 1}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{signal.hora}</p>
                        </div>
                      </div>
                      <div>
                        {signal.resultado === 'green' && (
                          <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">✅ WIN</span>
                        )}
                        {signal.resultado === 'red' && (
                          <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full">❌ LOSS</span>
                        )}
                        {signal.resultado === 'pending' && (
                          <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full animate-pulse">⏳ ATIVO</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            
            {/* Stats Card */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <span className="text-2xl">📊</span> Estatísticas
              </h2>
              
              {/* Assertividade */}
              <div className="text-center mb-6">
                <div className="relative w-32 h-32 mx-auto mb-3">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={Number(assertividade) >= 70 ? '#22c55e' : Number(assertividade) >= 50 ? '#eab308' : '#ef4444'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${Number(assertividade) * 2.51} 251`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <p className="text-2xl font-bold">{assertividade}%</p>
                      <p className="text-xs text-gray-400">Assertividade</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.wins}</p>
                  <p className="text-xs text-gray-400">✅ Wins</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
                  <p className="text-xs text-gray-400">❌ Losses</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{stats.gales}</p>
                  <p className="text-xs text-gray-400">🔄 Gales</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
                  <p className="text-xs text-gray-400">📊 Total</p>
                </div>
              </div>
            </div>

            {/* Streak */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <span className="text-2xl">🔥</span> Sequência
              </h2>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{streak}</p>
                  <p className="text-xs text-gray-400">Atual</p>
                </div>
                <div className="w-px h-12 bg-white/10"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">{bestStreak}</p>
                  <p className="text-xs text-gray-400">Melhor</p>
                </div>
              </div>
              {streak >= 3 && (
                <div className="mt-3 text-center">
                  <span className="text-xs bg-gradient-to-r from-green-500/20 to-yellow-500/20 border border-green-500/30 rounded-full px-3 py-1 text-green-400 animate-bounce-subtle inline-block">
                    🔥 Sequência quente!
                  </span>
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <span className="text-2xl">💡</span> Informações
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-green-400 mt-0.5">●</span>
                  <span className="text-gray-300">Entrada na cor indicada pelo sinal</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-yellow-400 mt-0.5">●</span>
                  <span className="text-gray-300">Até 2 gales (martingale) se perder</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-blue-400 mt-0.5">●</span>
                  <span className="text-gray-300">Proteção na cor oposta</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-purple-400 mt-0.5">●</span>
                  <span className="text-gray-300">Modo auto gera sinais automaticamente</span>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setStats({ wins: 0, losses: 0, gales: 0, total: 0 })
                setSignals([])
                setCurrentSignal(null)
                setStreak(0)
                setBestStreak(0)
                setShowResult(false)
                addNotification('🔄 Estatísticas resetadas', 'info')
              }}
              className="w-full glass-card rounded-xl p-3 text-sm text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>🗑️</span> Resetar Estatísticas
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            🤖 Robô BAC BO © 2024 - Sinais Inteligentes
          </p>
          <p className="text-xs text-gray-600">
            ⚠️ Jogue com responsabilidade. Resultados passados não garantem resultados futuros.
          </p>
        </div>
      </footer>
    </div>
  )
}
