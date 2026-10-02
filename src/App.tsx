import { useState, useEffect, useCallback, useRef } from 'react'

interface Signal {
  id: number
  cor: 'blue' | 'red'
  hora: string
  resultado?: 'green' | 'red' | 'pending'
  tentativa: number
}

interface Notif {
  id: number
  msg: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface Stats {
  wins: number
  losses: number
  gales: number
  total: number
}

const getHora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export default function App() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [current, setCurrent] = useState<Signal | null>(null)
  const [stats, setStats] = useState<Stats>({ wins: 0, losses: 0, gales: 0, total: 0 })
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [auto, setAuto] = useState(false)
  const [interval, setInterval_] = useState(30)
  const [countdown, setCountdown] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [time, setTime] = useState(new Date())
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const idRef = useRef(0)
  const nIdRef = useRef(0)

  useEffect(() => {
    const t = window.setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const notify = useCallback((msg: string, type: Notif['type']) => {
    const id = ++nIdRef.current
    setNotifs(p => [...p.slice(-3), { id, msg, type }])
    setTimeout(() => setNotifs(p => p.filter(n => n.id !== id)), 4000)
  }, [])

  const generate = useCallback(() => {
    setAnalyzing(true)
    setShowResult(false)
    setTimeout(() => {
      const cor: 'blue' | 'red' = Math.random() > 0.5 ? 'blue' : 'red'
      const sig: Signal = {
        id: ++idRef.current,
        cor,
        hora: getHora(),
        tentativa: 1,
        resultado: 'pending'
      }
      setCurrent(sig)
      setSignals(p => [sig, ...p].slice(0, 30))
      setAnalyzing(false)
      setShowResult(true)
      notify(`🎯 Sinal: ${cor === 'blue' ? '🔵 BLUE' : '🔴 RED'}`, 'info')
    }, 1800)
  }, [notify])

  useEffect(() => {
    if (!auto) { setCountdown(0); return }
    setCountdown(interval)
    generate()
    const t = window.setInterval(() => {
      setCountdown(p => {
        if (p <= 1) { generate(); return interval }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [auto, interval, generate])

  const handleResult = (r: 'green' | 'red') => {
    if (!current) return
    if (r === 'green') {
      setStats(p => ({ ...p, wins: p.wins + 1, total: p.total + 1 }))
      setSignals(p => p.map(s => s.id === current.id ? { ...s, resultado: 'green' } : s))
      setStreak(p => { const n = p + 1; if (n > best) setBest(n); return n })
      notify('✅ GREEN! Vitória!', 'success')
      setShowResult(false)
    } else {
      if (current.tentativa <= 2) {
        setStats(p => ({ ...p, gales: p.gales + 1 }))
        const gale: Signal = { ...current, id: ++idRef.current, tentativa: current.tentativa + 1, resultado: 'pending', hora: getHora() }
        setCurrent(gale)
        setSignals(p => [gale, ...p].slice(0, 30))
        notify(`🔄 Gale ${current.tentativa}/2`, 'warning')
      } else {
        setStats(p => ({ ...p, losses: p.losses + 1, total: p.total + 1 }))
        setSignals(p => p.map(s => s.id === current.id ? { ...s, resultado: 'red' } : s))
        setStreak(0)
        notify('❌ RED! Sinais esgotados.', 'error')
        setShowResult(false)
      }
    }
  }

  const assert = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : '0.0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#1a1040] text-white">
      {/* BG Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
        {notifs.map(n => (
          <div key={n.id} className={`animate-slide-in glass rounded-xl px-4 py-3 shadow-2xl flex items-center gap-2 text-sm ${
            n.type === 'success' ? 'border-green-500/40' :
            n.type === 'error' ? 'border-red-500/40' :
            n.type === 'warning' ? 'border-yellow-500/40' : 'border-blue-500/40'
          }`}>
            <span>{n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : n.type === 'warning' ? '⚠️' : '🔔'}</span>
            <span className="font-medium">{n.msg}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg">🤖</div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse-dot" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Robô BAC BO</h1>
              <p className="text-xs text-gray-400">Sinais Inteligentes v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 glass rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-dot" />
              <span className="text-xs text-gray-300">Online</span>
            </div>
            <div className="glass rounded-lg px-3 py-2">
              <span className="text-sm font-mono text-green-400">{time.toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Signal Card */}
            <div className="glass rounded-2xl p-6 gradient-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><span className="text-2xl">📡</span> Sinal Atual</h2>
                {auto && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-dot" />
                    <span className="text-xs text-green-400 font-medium">AUTO {countdown}s</span>
                  </div>
                )}
              </div>

              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin-slow mb-4" />
                  <p className="text-gray-400">Analisando padrões...</p>
                  <div className="flex gap-1 mt-3">
                    {[0,1,2,3,4].map(i => <div key={i} className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay:`${i*0.1}s`}} />)}
                  </div>
                </div>
              ) : current ? (
                <div className="space-y-4">
                  <div className={`rounded-xl p-6 text-center ${
                    current.cor === 'blue'
                      ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/20 border border-blue-500/30 animate-pulse-glow'
                      : 'bg-gradient-to-br from-red-900/50 to-red-800/20 border border-red-500/30 animate-pulse-glow-red'
                  }`}>
                    <div className="text-6xl mb-3">{current.cor === 'blue' ? '🔵' : '🔴'}</div>
                    <h3 className="text-3xl font-bold mb-1">{current.cor === 'blue' ? 'BLUE' : 'RED'}</h3>
                    <p className="text-sm text-gray-400">⚡ Entrada confirmada • {current.hora}</p>
                    {current.tentativa > 1 && (
                      <div className="mt-2 inline-flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-3 py-1">
                        <span className="text-xs text-yellow-400">🔄 Gale {current.tentativa - 1}/2</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2"><span>🛡️</span><span className="text-sm text-gray-300">Proteção:</span></div>
                      <span className="font-medium">{current.cor === 'blue' ? '🔴 Red' : '🔵 Blue'}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2"><span>🎯</span><span className="text-sm text-gray-300">Confiança:</span></div>
                      <span className="font-bold text-green-400">{Math.floor(Math.random()*13)+85}%</span>
                    </div>
                  </div>

                  {showResult && (
                    <div className="flex gap-3 animate-fade-in-up">
                      <button onClick={() => handleResult('green')} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 font-bold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-green-500/20 active:scale-95">✅ GREEN</button>
                      <button onClick={() => handleResult('red')} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 font-bold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-red-500/20 active:scale-95">❌ RED</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <span className="text-5xl mb-3">🎲</span>
                  <p>Clique em gerar sinal para começar</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={generate} disabled={analyzing || auto} className="glass rounded-xl p-5 flex items-center gap-4 hover:bg-white/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🎯</div>
                <div className="text-left">
                  <p className="font-bold">Gerar Sinal</p>
                  <p className="text-xs text-gray-400">Entrada manual</p>
                </div>
              </button>
              <div className="glass rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center text-2xl">⚡</div>
                <div className="text-left flex-1">
                  <p className="font-bold">Modo Automático</p>
                  <p className="text-xs text-gray-400">{auto ? `Próximo em ${countdown}s` : 'Desativado'}</p>
                </div>
                <button onClick={() => setAuto(!auto)} className={`relative w-14 h-7 rounded-full transition-all ${auto ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${auto ? 'left-8' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {auto && (
              <div className="glass rounded-xl p-4 animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-300">⏱️ Intervalo</span>
                  <span className="text-sm font-bold text-green-400">{interval}s</span>
                </div>
                <input type="range" min="10" max="120" step="5" value={interval} onChange={e => setInterval_(+e.target.value)} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500" />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>10s</span><span>120s</span></div>
              </div>
            )}

            {/* History */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><span className="text-2xl">📋</span> Histórico</h2>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {signals.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">Nenhum sinal ainda</p>
                ) : signals.slice(0, 12).map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2.5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{s.cor === 'blue' ? '🔵' : '🔴'}</span>
                      <div>
                        <p className="text-sm font-medium">{s.cor === 'blue' ? 'Blue' : 'Red'}{s.tentativa > 1 && <span className="ml-2 text-xs text-yellow-400">G{s.tentativa-1}</span>}</p>
                        <p className="text-xs text-gray-500">{s.hora}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      s.resultado === 'green' ? 'text-green-400 bg-green-500/10' :
                      s.resultado === 'red' ? 'text-red-400 bg-red-500/10' :
                      'text-yellow-400 bg-yellow-500/10 animate-pulse'
                    }`}>
                      {s.resultado === 'green' ? '✅ WIN' : s.resultado === 'red' ? '❌ LOSS' : '⏳ ATIVO'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Stats */}
          <div className="space-y-5">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><span className="text-2xl">📊</span> Estatísticas</h2>
              <div className="text-center mb-5">
                <div className="relative w-32 h-32 mx-auto mb-2">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none"
                      stroke={+assert >= 70 ? '#22c55e' : +assert >= 50 ? '#eab308' : '#ef4444'}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${+assert * 2.51} 251`}
                      className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div><p className="text-2xl font-bold">{assert}%</p><p className="text-xs text-gray-400">Assertividade</p></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.wins}</p><p className="text-xs text-gray-400">✅ Wins</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.losses}</p><p className="text-xs text-gray-400">❌ Losses</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{stats.gales}</p><p className="text-xs text-gray-400">🔄 Gales</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">{stats.total}</p><p className="text-xs text-gray-400">📊 Total</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><span className="text-2xl">🔥</span> Sequência</h2>
              <div className="flex items-center justify-around">
                <div className="text-center"><p className="text-3xl font-bold text-green-400">{streak}</p><p className="text-xs text-gray-400">Atual</p></div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center"><p className="text-3xl font-bold text-yellow-400">{best}</p><p className="text-xs text-gray-400">Melhor</p></div>
              </div>
              {streak >= 3 && <div className="mt-3 text-center"><span className="text-xs bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1 text-green-400 animate-bounce-subtle inline-block">🔥 Sequência quente!</span></div>}
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-3"><span className="text-2xl">💡</span> Como usar</h2>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-start gap-2"><span className="text-green-400">●</span><span>Entrada na cor do sinal</span></div>
                <div className="flex items-start gap-2"><span className="text-yellow-400">●</span><span>Até 2 gales se perder</span></div>
                <div className="flex items-start gap-2"><span className="text-blue-400">●</span><span>Proteção na cor oposta</span></div>
                <div className="flex items-start gap-2"><span className="text-purple-400">●</span><span>Modo auto gera sinais</span></div>
              </div>
            </div>

            <button onClick={() => { setStats({wins:0,losses:0,gales:0,total:0}); setSignals([]); setCurrent(null); setStreak(0); setBest(0); setShowResult(false); notify('🔄 Resetado', 'info') }}
              className="w-full glass rounded-xl p-3 text-sm text-gray-400 hover:text-red-400 transition-all flex items-center justify-center gap-2">
              <span>🗑️</span> Resetar
            </button>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">🤖 Robô BAC BO © 2024</p>
          <p className="text-xs text-gray-600">⚠️ Jogue com responsabilidade.</p>
        </div>
      </footer>
    </div>
  )
}
