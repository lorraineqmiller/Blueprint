import { Navigate, Route, Routes } from 'react-router-dom'
import Splash from './screens/Splash'
import Join from './screens/Join'
import Onboarding from './screens/Onboarding'
import ProfileSetup from './screens/ProfileSetup'
import Home from './screens/Home'
import Closet from './screens/Closet'
import ItemDetail from './screens/ItemDetail'
import AddItem from './screens/AddItem'
import FriendsClosets from './screens/FriendsClosets'
import BorrowRequest from './screens/BorrowRequest'
import Borrows from './screens/Borrows'
import Chats from './screens/Chats'
import LiveVote from './screens/LiveVote'
import ConfirmedLook from './screens/ConfirmedLook'
import NewFitCheck from './screens/NewFitCheck'
import ClosetImpact from './screens/ClosetImpact'
import Profile from './screens/Profile'
import BlueprintPlus from './screens/BlueprintPlus'

export default function App() {
  return (
    <div className="flex h-[100dvh] items-center justify-center overflow-hidden bg-[#e5e5e7]">
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/join" element={<Join />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/closet" element={<Closet />} />
        <Route path="/closet/add" element={<AddItem />} />
        <Route path="/closet/:itemId" element={<ItemDetail />} />
        <Route path="/closets-near-me" element={<FriendsClosets />} />
        <Route path="/borrow/:itemId" element={<BorrowRequest />} />
        <Route path="/borrows" element={<Borrows />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chats/new" element={<NewFitCheck />} />
        <Route path="/chats/:chatId" element={<LiveVote />} />
        <Route path="/chats/:chatId/confirmed" element={<ConfirmedLook />} />
        <Route path="/closet-impact" element={<ClosetImpact />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/plus" element={<BlueprintPlus />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
