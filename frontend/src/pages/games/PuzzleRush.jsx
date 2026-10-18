import React, { useEffect, useState, useCallback } from 'react'
import { useAuth }           from '../../context/AuthContext'
import { API_BASE }          from '../../api'
import { Card }              from '../../components/ui/card'
import toast                 from 'react-hot-toast'
import { ActionButton, EmptyState, PageFrame, PageHero, SectionHeader, StatCard } from '../../components/ui/page'

const STORAGE_KEY   = 'puzzleRushSolvedToday'
const TILE_ICONS    = ['AX', 'BY', 'CZ', 'DM', 'EX', 'FY', 'GZ']
const TILE_CLASSES  = [
  'bg-gradient-to-br from-pink-400 to-pink-600',
  'bg-gradient-to-br from-yellow-400 to-yellow-600',
  'bg-gradient-to-br from-green-400 to-green-600',
  'bg-gradient-to-br from-slate-400 to-slate-600',
  'bg-gradient-to-br from-purple-400 to-purple-600',
  'bg-gradient-to-br from-amber-400 to-amber-600',
  'bg-gradient-to-br from-lime-400 to-lime-600'
]
const REGION_COLORS = [
  '#ec4899', '#3b82f6', '#22c55e', '#eab308',
  '#a855f7', '#10b981', '#f59e0b', '#f97316'
]

const SLIDING_SOLUTION = [
  [1,2,3],
  [4,5,6],
  [7,8,0]
]

const boardEqual = (a, b) =>
  a.flat().every((v, i) => v === b.flat()[i])

function DailyPrompt({ game }) {
  const prompt = game.prompt || {}

  if (game.id === 'mini-queens') {
    const size = prompt.size || 5
    const locked = new Set((prompt.lockedQueens || []).map(q => `${q.row},${q.col}`))
    const missing = new Set(prompt.missingRows || [])
    return (
      <div>
        <div className="mb-2 text-xs text-white/50">Fill rows: {[...missing].join(', ')}</div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
          {Array.from({ length: size * size }, (_, index) => {
            const row = Math.floor(index / size)
            const col = index % size
            const queen = locked.has(`${row},${col}`)
            return (
              <div key={index} className={`flex aspect-square items-center justify-center rounded-lg border text-[10px] ${queen ? 'border-cyan-200/50  text-cyan-50' : missing.has(row) ? ' bg-white/[0.06]' : ' bg-black/20 text-white/25'}`}>
                {queen ? 'Q' : `${row},${col}`}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (game.id === 'knight-gap') {
    return (
      <div className="space-y-2">
        <div className="text-xs text-white/50">Hidden stop: #{prompt.hiddenIndex}</div>
        <div className="flex flex-wrap gap-2">
          {(prompt.path || []).map((cell, index) => (
            <span key={index} className="rounded-xl border border-white/10  px-3 py-2 text-xs text-white/75">
              {index + 1}: {cell ? `${cell.r},${cell.c}` : '?'}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (game.id === 'nonogram-row') {
    return (
      <div>
        <div className="mb-3 text-xs uppercase tracking-[0.22em] text-white/45">Clues: {(prompt.clues || []).join(' ') || '0'}</div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${prompt.length || 9}, minmax(0, 1fr))` }}>
          {Array.from({ length: prompt.length || 9 }, (_, index) => (
            <div key={index} className="aspect-square rounded-lg border border-white/10 bg-white/[0.06]" />
          ))}
        </div>
      </div>
    )
  }

  if (game.id === 'cipher-vault') {
    return (
      <div className="space-y-2">
        <div className="rounded-2xl border border-white/10  px-4 py-3 font-mono text-lg tracking-[0.22em] text-cyan-100">
          {prompt.cipherText}
        </div>
        <div className="text-xs text-white/50">Shift back by {prompt.shift}</div>
      </div>
    )
  }

  if (game.id === 'mine-clue') {
    const bombs = new Set(prompt.bombs || [])
    const size = prompt.size || 4
    return (
      <div>
        <div className="mb-2 text-xs text-white/50">Selected cell: {prompt.clueCell?.row},{prompt.clueCell?.col}</div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
          {Array.from({ length: size * size }, (_, index) => {
            const row = Math.floor(index / size)
            const col = index % size
            const bomb = bombs.has(`${row},${col}`)
            const selected = prompt.clueCell?.row === row && prompt.clueCell?.col === col
            return (
              <div key={index} className={`flex aspect-square items-center justify-center rounded-lg border text-xs ${selected ? 'border-amber-200/60 bg-amber-300/20 text-amber-50' : bomb ? 'border-rose-200/40  text-rose-100' : 'border-white/10 bg-black/20 text-white/35'}`}>
                {bomb ? 'M' : selected ? '?' : ''}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (game.id === 'circuit-endpoint') {
    return (
      <div className="space-y-2">
        <div className="text-xs text-white/50">Start: {prompt.start?.r},{prompt.start?.c}</div>
        <div className="flex flex-wrap gap-2">
          {(prompt.route || []).map((direction, index) => (
            <span key={`${direction}-${index}`} className="rounded-xl border border-white/10  px-3 py-2 text-xs capitalize text-white/75">
              {direction}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return <div className="text-sm text-white/60">Enter the answer shown by the puzzle.</div>
}

export default function PuzzleRush() {
  const { token } = useAuth()
  const [puzzles, setPuzzles] = useState([])
  const [wins,     setWins]   = useState(0)
  const [solved,   setSolved] = useState(new Set())
  const [streak, setStreak] = useState({ current: 0, best: 0, lastReward: 0 })
  const [dailySet, setDailySet] = useState({ dateKey: '', games: [] })
  const [dailyAnswers, setDailyAnswers] = useState({})

  useEffect(() => {
    fetch(`${API_BASE}/api/games/puzzle-rush`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setPuzzles(data.puzzles || [])
        setWins(data.wins       || 0)
        setSolved(new Set(data.solved || []))
        setStreak(data.streak || { current: 0, best: 0, lastReward: 0 })
      })
      .catch(console.error)

    fetch(`${API_BASE}/api/games/daily-arcade`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setDailySet({ dateKey: data.dateKey || '', games: data.games || [] }))
      .catch(console.error)

    const today = new Date().toISOString().slice(0,10)
    const raw   = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const { date, ids } = JSON.parse(raw)
      if (date === today) setSolved(new Set(ids))
      else localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, ids: [] }))
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, ids: [] }))
    }
  }, [token])

  const solveDailyChallenge = useCallback(async game => {
    try {
      const answer = dailyAnswers[game.id] || '';
      const payload = game.inputType === 'multi-index'
        ? String(answer).split(',').map(value => Number(value.trim())).filter(Number.isInteger)
        : answer;
      const res = await fetch(`${API_BASE}/api/games/daily-arcade/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ gameId: game.id, answer: payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Daily challenge failed');
      toast.success(`Daily solved! +${data.reward} coins`);
      setDailySet(current => ({
        ...current,
        games: current.games.map(entry => entry.id === game.id ? { ...entry, solved: true } : entry)
      }));
    } catch (err) {
      toast.error(err.message);
    }
  }, [dailyAnswers, token]);

  const markSolved = useCallback(async (id, answer) => {
    if (solved.has(id)) return

    setSolved(prev => {
      const next = new Set(prev)
      next.add(id)
      const today = new Date().toISOString().slice(0,10)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, ids: [...next] }))
      return next
    })

    try {
      const res = await fetch(`${API_BASE}/api/games/puzzle-rush`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify({ puzzleId: id, answer })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Incorrect')

      toast.success(data.streakBonus ? `Correct! +${data.reward} coins (${data.streakBonus} streak bonus)` : `Correct! +${data.reward} coins`)
      setWins(data.wins)
      setStreak(data.streak || streak)

    } catch (err) {
      setSolved(prev => {
        const next = new Set(prev)
        next.delete(id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          date: new Date().toISOString().slice(0,10),
          ids: [...next]
        }))
        return next
      })
      toast.error(err.message)
    }
  }, [token, solved, streak])

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_18%_5%,rgba(99,102,241,0.16),transparent_32%),radial-gradient(circle_at_88%_2%,rgba(236,72,153,0.11),transparent_32%),linear-gradient(180deg,#111827_0%,#09090b_55%,#020202_100%)]">
      <div className="mx-auto max-w-6xl">
        <PageHero
          title="Daily Puzzle Rush"
          description="A daily set of logic, memory, matching, and board puzzles. Solve what is available, then return after the daily reset."
          actions={(
            <>
              <StatCard label="Solved today" value={wins} tone="text-cyan-100" />
              <StatCard label="Daily streak" value={`${streak.current || 0} days`} tone="text-emerald-100" />
              <StatCard label="Best streak" value={`${streak.best || 0} days`} tone="text-amber-100" />
            </>
          )}
        />
        <div className="mb-6 rounded-[28px] border border-emerald-300/15 bg-emerald-300/10 p-4 text-sm text-emerald-50">
          First solve of the day earns a streak bonus. Current bonus value: {Math.min(1000, ((streak.current || 0) + 1) * 75).toLocaleString()} coins if your streak continues.
        </div>
        <section className="mb-10 rounded-[32px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl backdrop-blur-xl">
          <SectionHeader
            title="Daily challenge board"
            description="Short server-verified puzzles live here now, beside Puzzle Rush, so daily play stays in one place."
          />
          {dailySet.games.length === 0 ? (
            <EmptyState title="No daily challenges loaded" description="Refresh the page or check the game API health." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {dailySet.games.map(game => (
                <div key={game.id} className={`rounded-[24px] border p-4 ${game.solved ? 'border-emerald-300/25 bg-emerald-300/10' : 'border-white/10 bg-black/20'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white">{game.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-white/55">{game.description}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">{game.reward}</span>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/70">
                    <DailyPrompt game={game} />
                  </div>
                  {game.options ? (
                    <select
                      value={dailyAnswers[game.id] || ''}
                      onChange={e => setDailyAnswers(prev => ({ ...prev, [game.id]: e.target.value }))}
                      disabled={game.solved}
                      className="mt-3 w-full"
                    >
                      <option value="">Choose</option>
                      {game.options.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      value={dailyAnswers[game.id] || ''}
                      onChange={e => setDailyAnswers(prev => ({ ...prev, [game.id]: e.target.value }))}
                      disabled={game.solved}
                      className="mt-3 w-full"
                      placeholder={game.placeholder || 'Answer'}
                    />
                  )}
                  <ActionButton
                    type="button"
                    disabled={game.solved}
                    onClick={() => solveDailyChallenge(game)}
                    className="mt-3 w-full justify-center"
                  >
                    {game.solved ? 'Solved' : 'Submit'}
                  </ActionButton>
                </div>
              ))}
            </div>
          )}
        </section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {['sliding','memory','match-3'].map(type => {
            const p = puzzles.find(p => p.type === type)
            return p && !solved.has(p.id)
              ? <Puzzle key={type} puzzle={p} onSolve={markSolved}/>
              : <SolvedCard key={type} type={type}/>
          })}
        </div>
        <div className="mb-10">
          {(() => {
            const p = puzzles.find(p => p.type === 'logic-grid')
            return p && !solved.has(p.id)
              ? <Puzzle puzzle={p} onSolve={markSolved}/>
              : <SolvedCard type="logic-grid"/>
          })()}
        </div>
        <div>
          {(() => {
            const p = puzzles.find(p => p.type === 'n-queens')
            return p && !solved.has(p.id)
              ? <Puzzle puzzle={p} onSolve={markSolved}/>
              : <SolvedCard type="n-queens"/>
          })()}
        </div>
      </div>
    </PageFrame>
  )
}

const SolvedCard = ({ type }) => (
  <div className="border border-white/10 bg-white/[0.055] backdrop-blur-xl rounded-3xl min-h-[22rem]
                  flex flex-col items-center justify-center text-center">
    <h2 className="text-2xl font-bold capitalize">{type.replace('-',' ')}</h2>
    <p className="mt-3 text-sm opacity-70">Solved today</p>
  </div>
)

const Puzzle = ({ puzzle, onSolve }) => {
  switch (puzzle.type) {
    case 'match-3':    return <Match3   puzzle={puzzle} onSolve={onSolve}/>
    case 'sliding':    return <Sliding  puzzle={puzzle} onSolve={onSolve}/>
    case 'memory':     return <Memory   puzzle={puzzle} onSolve={onSolve}/>
    case 'logic-grid': return <Logic    puzzle={puzzle} onSolve={onSolve}/>
    case 'n-queens':   return <NQueens  puzzle={puzzle} onSolve={onSolve}/>
    default:           return null
  }
}

function Match3({ puzzle, onSolve }) {
  const target = 20
  const size = 5

  const [grid, setGrid] = useState([])
  const [count, setCount] = useState(0)
  const [sel, setSel] = useState(null)
  const [ready, setReady] = useState(false)
  const [animMap, setAnimMap] = useState({})
  const [invalidSwap, setInvalidSwap] = useState(null)
  const [reshuffling, setReshuffling] = useState(false)
  const [moves, setMoves] = useState([])
  const [refillIndex, setRefillIndex] = useState(0)
  const [scoreBurst, setScoreBurst] = useState(null)
  const [moveFlash, setMoveFlash] = useState(null)

  const hashSeed = useCallback(input => {
    let hash = 2166136261
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
  }, [])

  const deterministicTile = useCallback((refill, col, slot) =>
    hashSeed(`${puzzle.id}:tile:${refill}:${col}:${slot}`) % TILE_ICONS.length
  , [hashSeed, puzzle.id])

  const swap = useCallback((a, b, g) => {
    const newG = g.map(r => r.slice())
    const [r1, c1] = a, [r2, c2] = b
    ;[newG[r1][c1], newG[r2][c2]] = [newG[r2][c2], newG[r1][c1]]
    return newG
  }, [])

  const resolveMatches = useCallback(g => {
    const matched = Array.from({ length: size }, () => Array(size).fill(false))
    let found = 0

    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - 3; c++) {
        const v = g[r][c]
        if (v != null && v === g[r][c+1] && v === g[r][c+2]) {
          matched[r][c] = matched[r][c+1] = matched[r][c+2] = true
        }
      }
    }
    for (let c = 0; c < size; c++) {
      for (let r = 0; r <= size - 3; r++) {
        const v = g[r][c]
        if (v != null && v === g[r+1][c] && v === g[r+2][c]) {
          matched[r][c] = matched[r+1][c] = matched[r+2][c] = true
        }
      }
    }

    const newG = g.map((row, r) =>
      row.map((cell, c) => matched[r][c] ? null : cell)
    )
    matched.flat().forEach(m => m && found++)
    return { newG, found }
  }, [size])

  const applyGravity = useCallback((g, startRefill) => {
    const newG = Array.from({ length: size }, () => Array(size).fill(null))
    const anims = {}
    let nextRefill = startRefill
    for (let c = 0; c < size; c++) {
      let col = []
      for (let r = 0; r < size; r++) {
        if (g[r][c] != null) col.push(g[r][c])
      }
      const missing = size - col.length
      const additions = []
      for (let slot = 0; slot < missing; slot += 1) {
        additions.push(deterministicTile(nextRefill, c, slot))
        nextRefill += 1
      }
      col = [...additions, ...col]
      for (let r = 0; r < size; r++) {
        newG[r][c] = col[r]
        if (g[r][c] == null) anims[`${r}-${c}`] = 'fall-down'
      }
    }
    setAnimMap(anims)
    setTimeout(() => setAnimMap({}), 420)
    return { grid: newG, refillIndex: nextRefill }
  }, [deterministicTile, size])

  const hasAnyValidMoves = useCallback(g => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (c+1 < size && resolveMatches(swap([r,c],[r,c+1],g)).found>0) return true
        if (r+1 < size && resolveMatches(swap([r,c],[r+1,c],g)).found>0) return true
      }
    }
    return false
  }, [resolveMatches, size, swap])

  const generateDeterministicBoard = useCallback(round => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const board = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => hashSeed(`${puzzle.id}:board:${round}:${attempt}:${r}:${c}`) % TILE_ICONS.length)
      )
      if (hasAnyValidMoves(board)) return board
    }
    return Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => (r + c) % TILE_ICONS.length)
    )
  }, [hasAnyValidMoves, hashSeed, puzzle.id, size])

  const autoClearLoop = useCallback((board, startCount, startRefill) => {
    let g = board, cnt = startCount
    let refill = startRefill
    for (let pass = 0; pass < size * size; pass++) {
      const { newG, found } = resolveMatches(g)
      if (found === 0) break
      cnt += Math.floor(found/3)
      const gravity = applyGravity(newG, refill)
      g = gravity.grid
      refill = gravity.refillIndex
    }
    return { clearedGrid: g, updatedCount: cnt, refillIndex: refill }
  }, [applyGravity, resolveMatches, size])

  useEffect(() => {
    const initial = autoClearLoop(puzzle.question.grid, 0, 0)
    setGrid(initial.clearedGrid)
    setCount(initial.updatedCount)
    setRefillIndex(initial.refillIndex)
    setMoves([])
    setReady(initial.updatedCount >= target)
  }, [autoClearLoop, puzzle.question.grid, target])

  const handleClick = (r, c) => {
    if (ready || reshuffling) return
    if (!sel) return setSel([r,c])

    const [r1,c1] = sel
    if (Math.abs(r-r1)+Math.abs(c-c1) !== 1) return setSel([r,c])

    const g2 = swap([r,c],[r1,c1],grid)
    const { newG, found } = resolveMatches(g2)

    if (found === 0) {
      const dx = `${(c-c1)*16}px`, dy = `${(r-r1)*16}px`
      const key = `${r}-${c}`
      setInvalidSwap({ key, dx, dy })
      setTimeout(()=>setInvalidSwap(null),400)
      setSel(null)
      return
    }

    let newCount = count + Math.floor(found/3)
    const firstGravity = applyGravity(newG, refillIndex)
    const auto = autoClearLoop(firstGravity.grid, newCount, firstGravity.refillIndex)
    let g3 = auto.clearedGrid
    newCount = auto.updatedCount
    let nextRefill = auto.refillIndex
    const submittedMove = { from: { r, c }, to: { r: r1, c: c1 } }
    const nextMoves = [...moves, submittedMove]

    setMoves(nextMoves)
    setMoveFlash({ a: `${r}-${c}`, b: `${r1}-${c1}` })
    setScoreBurst(`+${Math.max(1, newCount - count)}`)
    setTimeout(() => setMoveFlash(null), 360)
    setTimeout(() => setScoreBurst(null), 700)

    if (!hasAnyValidMoves(g3) && newCount < target) {
      setReshuffling(true)
      setTimeout(()=>{
        const regen = generateDeterministicBoard(nextMoves.length - 1)
        const refresh = autoClearLoop(regen, newCount, nextRefill)
        setGrid(refresh.clearedGrid)
        setCount(refresh.updatedCount)
        setRefillIndex(refresh.refillIndex)
        setReady(refresh.updatedCount >= target)
        setReshuffling(false)
      },400)
    } else {
      setGrid(g3)
      setCount(newCount)
      setRefillIndex(nextRefill)
      setReady(newCount >= target)
    }

    setSel(null)
  }

  return (
    <Card title="Match-3" ready={ready} onSubmit={()=>onSolve(puzzle.id,{ moves })}>
      {reshuffling && (
        <div className="text-center text-indigo-200 text-sm font-medium mb-2 animate-pulse">
          No valid moves. Rebuilding the board...
        </div>
      )}
      <div className="relative grid grid-cols-5 gap-1 mx-auto mb-2">
        {scoreBurst && (
          <div className="pointer-events-none absolute -top-7 left-1/2 z-20 -translate-x-1/2 rounded-full border border-emerald-200/30 bg-emerald-400/20 px-3 py-1 text-sm font-black text-emerald-50 animate-match3-score">
            {scoreBurst}
          </div>
        )}
        {grid.map((row,r)=>
          row.map((tileId,c)=>{
            const id = `${r}-${c}`
            const isSel = sel && sel[0]===r && sel[1]===c
            const icon = TILE_ICONS[tileId]
            const cls = TILE_CLASSES[tileId]
            const style = invalidSwap?.key===id
              ? { '--dx': invalidSwap.dx, '--dy': invalidSwap.dy }
              : {}

            return (
              <div
                key={id}
                onClick={()=>handleClick(r,c)}
                className={`
                  w-12 h-12 md:w-14 md:h-14 flex items-center justify-center
                  rounded-xl shadow-md font-bold text-xl cursor-pointer
                  transition-all duration-200 ease-out
                  ${cls || 'bg-slate-800'}
                  ${isSel ? 'ring-4 ring-yellow-300' : ''}
                  ${animMap[id] || ''}
                  ${invalidSwap?.key===id ? 'invalid-swap' : ''}
                  ${moveFlash?.a===id || moveFlash?.b===id ? 'match3-swap-flash' : ''}
                `}
                style={style}
              >
                <span className="text-[0.72rem] font-black tracking-[0.18em] text-white drop-shadow">
                  {icon}
                </span>
              </div>
            )
          })
        )}
      </div>
      <p className="text-sm text-center text-indigo-300 font-medium">
        Matches: <span className="text-white font-bold">{count}</span> / {target}
      </p>
      <p className="mt-1 text-center text-xs text-white/45">
        Server-checkable moves: {moves.length}
      </p>
      {ready && (
        <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-center font-semibold text-emerald-100">
          Target reached. Submit to claim the reward.
        </div>
      )}
    </Card>
  )
}

function Sliding({ puzzle, onSolve }) {
  const { board:init } = puzzle.question
  const [board, setBoard] = useState(init)
  const [moves, setMoves] = useState([])
  const [ready, setReady] = useState(false)

  const click=(r,c)=>{
    if(ready) return
    let br,bc
    board.forEach((row,i)=>row.forEach((v,j)=>{ if(v===0){ br=i; bc=j }}))
    if(Math.abs(br-r)+Math.abs(bc-c)===1){
      const b2 = board.map(rw=>rw.slice())
      ;[b2[br][bc],b2[r][c]] = [b2[r][c],b2[br][bc]]
      setBoard(b2)
      const move = r < br ? 'up' : r > br ? 'down' : c < bc ? 'left' : 'right'
      setMoves(prev => [...prev, move])
      if(boardEqual(b2,SLIDING_SOLUTION)) setReady(true)
    }
  }

  return (
    <Card title="Sliding Tile" ready={ready} onSubmit={()=>onSolve(puzzle.id,{ moves })}>
      <div className="grid grid-cols-3 gap-2 mx-auto rounded-[24px] border border-white/10 bg-black/20 p-3">
        {board.flat().map((v,i)=>(
          <div
            key={i}
            onClick={()=>click(Math.floor(i/3),i%3)}
            className={`
              flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl border font-black shadow-lg transition hover:-translate-y-0.5
              ${v===0?'border-white/5 bg-white/5':'border-indigo-200/20 bg-indigo-400/20 text-indigo-50 hover:bg-indigo-400/30'}
            `}
          >{v||''}</div>
        ))}
      </div>
    </Card>
  )
}

function Memory({ puzzle, onSolve }) {
  const { board: sol } = puzzle.question
  const size = sol.length
  const [flip,  setFlip]  = useState([])
  const [match, setMatch] = useState([])
  const [pairs, setPairs] = useState([])
  const [ready, setReady] = useState(false)

  const click = i => {
    if (ready || flip.includes(i) || match.includes(i)) return
    const f2 = [...flip, i]
    setFlip(f2)
    if (f2.length === 2) {
      const [a,b] = f2
      if (sol.flat()[a] === sol.flat()[b]) {
        setMatch(m=>[...m,a,b])
        setPairs(p=>[...p,[a,b]])
        if (match.length + 2 === size*size) setReady(true)
      }
      setTimeout(()=>setFlip([]),700)
    }
  }

  return (
    <Card title="Memory Flip" ready={ready} onSubmit={()=>onSolve(puzzle.id,{ pairs })}>
      <div className="grid grid-cols-4 gap-2 mx-auto rounded-[24px] border border-white/10 bg-black/20 p-3">
        {sol.flat().map((v,i)=>(
          <div
            key={i}
            onClick={()=>click(i)}
            className={`
              flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border text-lg font-black transition
              ${(match.includes(i)||flip.includes(i))?'border-amber-200/40 bg-amber-300/25 text-amber-50 shadow-lg shadow-amber-900/20':'border-white/10  text-transparent '}
            `}
          >{(match.includes(i)||flip.includes(i)) && v}</div>
        ))}
      </div>
    </Card>
  )
}

export function Logic({ puzzle, onSolve }) {
  const { categories, clues } = puzzle.question
  const [A,B,C] = Object.values(categories)
  const [choice, setChoice] = useState({ AB: {}, AC: {} })

  const ready =
    Object.keys(choice.AB).length === A.length &&
    Object.keys(choice.AC).length === A.length

  const select = (type, a, val) => {
    setChoice(prev=>({
      ...prev,
      [type]: { ...prev[type], [a]: val }
    }))
  }

  return (
    <Card
      title="Logic Grid"
      ready={ready}
      onSubmit={()=>onSolve(puzzle.id, choice)}
      className="w-full max-w-[1600px] min-w-[900px]"
    >
      <div className="max-h-[18rem] overflow-y-auto mb-4 px-1">
        <ul className="list-disc list-inside text-sm space-y-1">
          {clues.map((c,i)=><li key={i}>{c}</li>)}
        </ul>
      </div>

      <div className="space-y-8 overflow-x-auto">
        <LogicTable
          title={`${Object.keys(categories)[0]} ⇄ ${Object.keys(categories)[1]}`}
          rowLabels={A}
          colLabels={B}
          selected={choice.AB}
          onSelect={(a,b)=>select('AB',a,b)}
        />
        <LogicTable
          title={`${Object.keys(categories)[0]} ⇄ ${Object.keys(categories)[2]}`}
          rowLabels={A}
          colLabels={C}
          selected={choice.AC}
          onSelect={(a,c)=>select('AC',a,c)}
        />
      </div>
    </Card>
  )
}

function LogicTable({ title, rowLabels, colLabels, selected, onSelect }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-1 text-indigo-300">{title}</h3>
      <div className="overflow-x-auto">
        <table className="table-fixed border-collapse w-full min-w-[600px] text-sm">
          <thead>
            <tr>
              <th className="w-24 text-left p-1"></th>
              {colLabels.map(col=>
                <th key={col} className="text-center p-1 whitespace-nowrap">{col}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map(row=>
              <tr key={row}>
                <td className="font-medium p-1 whitespace-nowrap">{row}</td>
                {colLabels.map(col=>
                  <td key={col} className="p-1 text-center">
                    <button
                      onClick={()=>onSelect(row,col)}
                      className={`w-8 h-8 rounded-full transition ${
                        selected[row]===col
                          ? 'bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-950/20'
                          : 'border border-white/10 bg-white/[0.08] text-white/45 hover:bg-emerald-300/25 hover:text-white'
                      }`}
                    >
                      {selected[row]===col?'✓':''}
                    </button>
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function NQueens({ puzzle, onSolve }) {
  const { initial = [], regions = [] } = puzzle.question
  const N       = 8

  const getPhase = (r,c, q,m) => {
    const key = `${r},${c}`
    if (initial[r] === c) return 'given'
    if (q.some(([qr,qc])=>qr===r&&qc===c)) return 'queen'
    if (m[key]) return 'mark'
    return 'empty'
  }

  const [queens, setQueens] = useState(() => {
    const q = []
    for (let r=0; r<N; r++){
      if (initial[r] >= 0) q.push([r, initial[r]])
    }
    return q
  })
  const [marks, setMarks]     = useState({})
  const isGiven = (r,c) => initial[r] === c

  const handleClick = (r,c) => {
    const key   = `${r},${c}`
    const phase = getPhase(r,c,queens,marks)
    if (phase === 'empty') {
      setMarks(m=>({ ...m, [key]: true }))
    } else if (phase === 'mark') {
      setMarks(m=>{
        const n = { ...m}
        delete n[key]
        return n
      })
      setQueens(q=>[...q,[r,c]])
    } else if (phase === 'queen') {
      if (!isGiven(r,c)) {
        setQueens(q=>q.filter(([qr,qc])=>!(qr===r&&qc===c)))
      }
    } else if (phase === 'given') {
      setMarks(m=>{
        const n = { ...m }
        if (n[key]) delete n[key]
        else n[key] = true
        return n
      })
    }
  }

  return (
    <Card
      title="8-Queens"
      ready={queens.length === N}
      onSubmit={()=>onSolve(puzzle.id, { positions: queens })}
      className="mx-auto w-full max-w-3xl"
    >
      <div className="mx-auto grid aspect-square w-full max-w-[500px] grid-cols-8 grid-rows-8 gap-[2px] rounded-[28px] border border-white/10 bg-black/30 p-2 shadow-2xl">
        {regions.flatMap((row,r)=>
          row.map((reg,c)=>{
            const key   = `${r},${c}`
            const phase = getPhase(r,c,queens,marks)
            const bg    = REGION_COLORS[reg % REGION_COLORS.length]
            return (
              <div
                key={key}
                onClick={()=>handleClick(r,c)}
                className={`
                  relative flex cursor-pointer select-none items-center justify-center rounded-lg
                  border  transition duration-150 ease-in-out hover:scale-[1.04] hover:ring-2 hover:ring-indigo-200/70
                  ${phase==='queen'||phase==='given'?'ring-2 ring-yellow-300':''}
                `}
                style={{ backgroundColor: `${bg}cc` }}
              >
                {(phase==='queen'||phase==='given') && (
                  <span className={`
                    text-3xl font-black
                    ${phase==='given'?'text-purple-400':'text-yellow-300'}
                  `}>♛</span>
                )}
                {phase==='mark' && (
                  <span className="text-3xl font-extrabold text-white drop-shadow-xs">
                    <span className="text-red-600">✕</span>
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>
      <p className="mt-4 text-center text-sm text-white/55">
        Place one queen in each row, column, and region. Tap once to mark, twice to place.
      </p>
    </Card>
  )
}
