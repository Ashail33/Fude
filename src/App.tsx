import { lazy, Suspense, useEffect } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { T } from './components/ui'
import { dueItems, ensureQuests } from './engine/quests'
import { level, usePlayer } from './engine/store'
import { levelForXp, xpForLevel } from './engine/rewards'
import Title from './screens/Title'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { WeaveNotice } from './components/Weave'

const Home = lazy(() => import('./screens/Home'))
const RegionScreen = lazy(() => import('./screens/RegionScreen'))
const Play = lazy(() => import('./screens/Play'))
const Grimoire = lazy(() => import('./screens/Grimoire'))
const Wardrobe = lazy(() => import('./screens/Wardrobe'))
const SettingsScreen = lazy(() => import('./screens/Settings'))
const Tavern = lazy(() => import('./screens/Tavern'))
const Arcade = lazy(() => import('./screens/Arcade'))
const Hamlet = lazy(() => import('./screens/Hamlet'))
const StickNinja = lazy(() => import('./screens/StickNinja'))
const Overworld = lazy(() => import('./world/Overworld'))
const Battle = lazy(() => import('./battle/Battle'))

function BattleTest() {
  const { region } = useParams()
  const nav = useNavigate()
  return <Battle region={Number(region) || 1} onEnd={() => nav('/')} />
}

function TopBar() {
  const p = usePlayer()
  const lvl = level(p)
  const cur = xpForLevel(lvl)
  const nxt = xpForLevel(lvl + 1)
  return (
    <header className="topbar">
      <Link to="/" className="brand" aria-label="Home">
        <span className="jp" lang="ja">
          言葉の魔法
        </span>
        <span className="hide-xs">Kotoba no Maho</span>
      </Link>
      <div className="topbar-stats">
        <span className="chip" title={`${p.xp - cur} / ${nxt - cur} XP to next level`}>
          <T en="Lv" jp="レベル" /> {levelForXp(p.xp)}
          <span className="xp-mini">
            <span style={{ width: `${((p.xp - cur) / (nxt - cur)) * 100}%` }} />
          </span>
        </span>
        <span className="chip" title="Daily streak">
          🔥 {p.streak.count}
        </span>
        <span className="chip hide-sm" title="Spirit shards (ことだま)">
          💠 {p.shards}
        </span>
      </div>
    </header>
  )
}

function BottomNav() {
  const p = usePlayer()
  const due = dueItems(p).length
  return (
    <nav className="bottomnav" aria-label="Main">
      <NavLink to="/" end>
        <span className="ico">🗺️</span>
        <T en="World" jp="せかい" />
      </NavLink>
      <NavLink to="/journal">
        <span className="ico">📜</span>
        <T en="Journal" jp="ぼうけんのしょ" />
      </NavLink>
      <NavLink to="/grimoire">
        <span className="ico">
          📖{due > 0 && <span className="nav-badge">{due}</span>}
        </span>
        <T en="Grimoire" jp="まどうしょ" />
      </NavLink>
      <NavLink to="/tavern">
        <span className="ico">🍶</span>
        <T en="Tavern" jp="さかば" />
      </NavLink>
      <NavLink to="/arcade">
        <span className="ico">🎮</span>
        <T en="Games" jp="あそび" />
      </NavLink>
      <NavLink to="/wardrobe">
        <span className="ico">🧙</span>
        <T en="Mage" jp="まどうし" />
      </NavLink>
      <NavLink to="/settings">
        <span className="ico">⚙️</span>
        <T en="Settings" jp="せってい" />
      </NavLink>
    </nav>
  )
}

/** Show the title screen once per browser session, when the app opens on the world. */
const TITLE_ON_LAUNCH = (() => {
  try {
    if (sessionStorage.getItem('fude.titleShown')) return false
    sessionStorage.setItem('fude.titleShown', '1')
    return /^#?\/?$/.test(location.hash)
  } catch {
    return false
  }
})()
let titleShown = false

/** Shown while a screen's code loads: a clear message, not a lone sparkle on blue. */
function Loading() {
  return (
    <div className="loading app-loading" role="status">
      <span aria-hidden>✨</span>
      <small>
        <span lang="ja">よみこみちゅう…</span> Loading…
      </small>
    </div>
  )
}

export default function App() {
  const p = usePlayer()
  const loc = useLocation()
  const showTitle = TITLE_ON_LAUNCH && !titleShown
  if (loc.pathname === '/title') titleShown = true
  // Full-screen game views hide the web-app chrome.
  const fullscreen = loc.pathname === '/' || /^\/(play|world|battle-test|title)/.test(loc.pathname)

  useEffect(() => {
    if (p.onboarded) ensureQuests(p)
  }, [p])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [loc.pathname])

  const dev = /^\/(play|battle-test)/.test(loc.pathname)
  if (!p.onboarded && !dev && loc.pathname !== '/settings') return <Title />

  return (
    <div className={`app ${fullscreen ? 'in-game' : ''} ${loc.pathname.startsWith('/play') ? 'in-play' : ''}`}>
      {!fullscreen && <TopBar />}
      <WeaveNotice />
      <AppErrorBoundary key={loc.pathname}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={showTitle && loc.pathname === '/' ? <Navigate to="/title" replace /> : <Overworld />} />
            <Route path="/title" element={<Title />} />
            <Route path="/journal" element={<Home />} />
            <Route path="/region/:id" element={<RegionScreen />} />
            <Route path="/play/*" element={<Play key={loc.pathname} />} />
            <Route path="/grimoire" element={<Grimoire />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/tavern" element={<Tavern />} />
            <Route path="/arcade" element={<Arcade />} />
            <Route path="/hamlet" element={<Hamlet />} />
            <Route path="/stick-ninja" element={<StickNinja />} />
            <Route path="/world" element={<Navigate to="/" replace />} />
            <Route path="/battle-test/:region" element={<BattleTest />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
      {!fullscreen && <BottomNav />}
    </div>
  )
}
