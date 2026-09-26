import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Splash from './screens/Splash'
import Join from './screens/Join'
import Login from './screens/Login'
import Onboarding from './screens/Onboarding'
import ProfileSetup from './screens/ProfileSetup'
import Home from './screens/Home'
import Closet from './screens/Closet'
import ItemDetail from './screens/ItemDetail'
import AddItem from './screens/AddItem'
import FriendsClosets from './screens/FriendsClosets'
import FindFriends from './screens/FindFriends'
import BorrowRequest from './screens/BorrowRequest'
import Borrows from './screens/Borrows'
import Chats from './screens/Chats'
import LiveVote from './screens/LiveVote'
import ConfirmedLook from './screens/ConfirmedLook'
import NewFitCheck from './screens/NewFitCheck'
import ClosetImpact from './screens/ClosetImpact'
import Profile from './screens/Profile'
import BlueprintPlus from './screens/BlueprintPlus'
import { useStore } from './store'
import { isBackendEnabled } from './lib/supabaseClient'

// Only meaningful when a real backend is configured — otherwise the store
// starts in authStatus 'authenticated' against local mock data and this is
// a pure passthrough, so nothing changes about the local demo.
function AuthGate({ children }: { children: ReactNode }) {
  const authStatus = useStore((s) => s.authStatus)
  if (!isBackendEnabled) return <>{children}</>
  if (authStatus === 'loading') {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-paper font-body text-sm text-neutral-600">
        Loading your Blueprint…
      </div>
    )
  }
  if (authStatus === 'anonymous') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const initAuth = useStore((s) => s.initAuth)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <div className="flex h-[100dvh] items-center justify-center overflow-hidden bg-[#e5e5e7]">
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/join" element={<Join />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route
          path="/home"
          element={
            <AuthGate>
              <Home />
            </AuthGate>
          }
        />
        <Route
          path="/closet"
          element={
            <AuthGate>
              <Closet />
            </AuthGate>
          }
        />
        <Route
          path="/closet/add"
          element={
            <AuthGate>
              <AddItem />
            </AuthGate>
          }
        />
        <Route
          path="/closet/:itemId"
          element={
            <AuthGate>
              <ItemDetail />
            </AuthGate>
          }
        />
        <Route
          path="/closets-near-me"
          element={
            <AuthGate>
              <FriendsClosets />
            </AuthGate>
          }
        />
        <Route
          path="/friends/find"
          element={
            <AuthGate>
              <FindFriends />
            </AuthGate>
          }
        />
        <Route
          path="/borrow/:itemId"
          element={
            <AuthGate>
              <BorrowRequest />
            </AuthGate>
          }
        />
        <Route
          path="/borrows"
          element={
            <AuthGate>
              <Borrows />
            </AuthGate>
          }
        />
        <Route
          path="/chats"
          element={
            <AuthGate>
              <Chats />
            </AuthGate>
          }
        />
        <Route
          path="/chats/new"
          element={
            <AuthGate>
              <NewFitCheck />
            </AuthGate>
          }
        />
        <Route
          path="/chats/:chatId"
          element={
            <AuthGate>
              <LiveVote />
            </AuthGate>
          }
        />
        <Route
          path="/chats/:chatId/confirmed"
          element={
            <AuthGate>
              <ConfirmedLook />
            </AuthGate>
          }
        />
        <Route
          path="/closet-impact"
          element={
            <AuthGate>
              <ClosetImpact />
            </AuthGate>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGate>
              <Profile />
            </AuthGate>
          }
        />
        <Route
          path="/plus"
          element={
            <AuthGate>
              <BlueprintPlus />
            </AuthGate>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
