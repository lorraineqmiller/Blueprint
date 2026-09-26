import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Card, ImagePlaceholder } from '../components/ui'
import { useStore } from '../store'
import { isBackendEnabled } from '../lib/supabaseClient'

export default function FriendsList() {
  const nav = useNavigate()
  const people = useStore((s) => s.people)

  return (
    <Screen withNav={false}>
      <TopBar
        title="Friends"
        onBack={() => nav(-1)}
        right={
          isBackendEnabled ? (
            <button onClick={() => nav('/friends/find')} className="eyebrow text-xs text-accent-600">
              Find Friends
            </button>
          ) : undefined
        }
      />
      <div className="px-5 py-5">
        <div className="space-y-2">
          {people.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 p-3">
              <ImagePlaceholder className="h-12 w-12 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{p.name}</div>
                <div className="truncate text-xs text-neutral-600">
                  {p.handle} · {p.school}
                </div>
              </div>
            </Card>
          ))}
          {people.length === 0 && (
            <p className="text-sm text-neutral-500">
              No friends yet.{' '}
              {isBackendEnabled ? (
                <button onClick={() => nav('/friends/find')} className="text-accent-600 underline">
                  Find some
                </button>
              ) : null}
            </p>
          )}
        </div>
      </div>
    </Screen>
  )
}
