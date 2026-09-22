import type { ReactNode } from 'react'
import { ArrowLeft, FolderOpen, History, Home, RotateCcw } from 'lucide-react'
import type { WorkflowScreen } from '../../contracts'
import type { NavigationItem } from '../types'

const defaultNavigation: NavigationItem[] = [
  { screen: 'home', label: 'Home' },
  { screen: 'storage', label: 'Storage' },
  { screen: 'activity', label: 'Activity' },
]

const navigationIcons = {
  home: Home,
  storage: FolderOpen,
  activity: History,
}

export interface AppShellProps {
  children: ReactNode
  currentScreen: WorkflowScreen
  onNavigate: (screen: NavigationItem['screen']) => void
  onBack?: () => void
  onReset?: () => void
  title?: string
  navigation?: NavigationItem[]
}

export function AppShell({
  children,
  currentScreen,
  onNavigate,
  onBack,
  onReset,
  title = 'Storage Intelligence',
  navigation = defaultNavigation,
}: AppShellProps) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <div className="app-header__leading">
          {onBack ? (
            <button className="icon-button" type="button" onClick={onBack} aria-label="Go back">
              <ArrowLeft aria-hidden="true" />
            </button>
          ) : (
            <span className="app-mark" aria-hidden="true">SI</span>
          )}
          <div>
            <p className="app-title">{title}</p>
            <DemoModeLabel />
          </div>
        </div>
        {onReset && (
          <button className="quiet-button" type="button" onClick={onReset}>
            <RotateCcw aria-hidden="true" />
            Reset demo
          </button>
        )}
      </header>

      <main className="app-content" id="main-content">{children}</main>

      <nav className="app-navigation" aria-label="Primary navigation">
        {navigation.map((item) => {
          const Icon = navigationIcons[item.screen]
          const active = currentScreen === item.screen
          return (
            <button
              className="nav-item"
              type="button"
              key={item.screen}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(item.screen)}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export function DemoModeLabel() {
  return <span className="demo-label">Demo mode <span aria-hidden="true">·</span> Sample files</span>
}
