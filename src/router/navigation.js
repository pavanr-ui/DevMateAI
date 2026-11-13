/**
 * Single source of truth for app navigation.
 * The router, desktop sidebar, mobile tab bar and Tools page all read from
 * here, so adding a module means editing one list.
 */
import {
  Bug,
  Component,
  FolderGit2,
  FolderKanban,
  GraduationCap,
  History,
  House,
  LayoutDashboard,
  LayoutGrid,
  MessageSquareCode,
  ScanSearch,
  Settings,
  UserRound,
} from '@lucide/vue'

/** AI tools: shown in the sidebar and on the Tools page. */
export const tools = [
  {
    name: 'assistant',
    path: 'assistant',
    label: 'AI Assistant',
    icon: MessageSquareCode,
    description: 'Generate, explain and optimize code in any language.',
    phase: 4,
  },
  {
    name: 'reviewer',
    path: 'reviewer',
    label: 'Code Reviewer',
    icon: ScanSearch,
    description: 'Find bugs, performance issues and security risks.',
    phase: 5,
  },
  {
    name: 'bug-fixer',
    path: 'bug-fixer',
    label: 'Bug Fixer',
    icon: Bug,
    description: 'Paste code and an error; get the root cause and a fix.',
    phase: 5,
  },
  {
    name: 'component-generator',
    path: 'component-generator',
    label: 'Vue Generator',
    icon: Component,
    description: 'Generate Vue 3 components and composables.',
    phase: 6,
  },
  {
    name: 'learn',
    path: 'learn',
    label: 'Learn JavaScript',
    icon: GraduationCap,
    description: 'Concepts, examples, exercises and interview questions.',
    phase: 6,
  },
  {
    name: 'github',
    path: 'github',
    label: 'GitHub Analyzer',
    icon: FolderGit2,
    description: 'Review repository structure and source files.',
    phase: 7,
  },
]

export const dashboardItem = {
  name: 'dashboard',
  path: 'dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
}
export const historyItem = {
  name: 'history',
  path: 'history',
  label: 'History',
  icon: History,
  description: 'Search, rename and revisit past conversations.',
  phase: 8,
}
export const projectsItem = {
  name: 'projects',
  path: 'projects',
  label: 'Projects',
  icon: FolderKanban,
  description: 'Workspaces that give the AI context about what you build.',
}
export const settingsItem = {
  name: 'settings',
  path: 'settings',
  label: 'Settings',
  icon: Settings,
}

/** Desktop sidebar groups */
export const sidebarSections = [
  { label: null, items: [dashboardItem] },
  { label: 'AI Tools', items: tools },
  { label: 'Workspace', items: [projectsItem, historyItem] },
]

/** Mobile bottom tabs: max 5, the rest live on the Tools page */
export const mobileTabs = [
  { name: 'dashboard', label: 'Home', icon: House },
  { name: 'assistant', label: 'Assistant', icon: MessageSquareCode },
  { name: 'tools', label: 'Tools', icon: LayoutGrid, activeFor: tools.map((t) => t.name) },
  { name: 'history', label: 'History', icon: History },
  { name: 'settings', label: 'Profile', icon: UserRound },
]
