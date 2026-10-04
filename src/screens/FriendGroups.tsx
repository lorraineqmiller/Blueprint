import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Avatar, Card } from '../components/ui'
import { GroupForm } from '../components/GroupForm'
import { groupName } from '../lib/fitChecks'
import { useStore } from '../store'

export function FriendGroups() {
  const nav = useNavigate()
  const groups = useStore((s) => s.friendGroups)
  const people = useStore((s) => s.people)

  return (
    <Screen withNav={false}>
      <TopBar title="Your Groups" onBack={() => nav(-1)} />
      <div className="px-5 py-5">
        <p className="text-sm text-neutral-600">
          Friends you regularly ask for outfit advice. Pick a group when you start a fit check. Only you can see your groups.
        </p>
        <div className="mt-4 space-y-2">
          {groups.map((g) => (
            <button key={g.id} onClick={() => nav(`/fit-checks/groups/${g.id}`)} className="block w-full text-left">
              <Card className="flex items-center gap-3 p-3">
                <div className="flex -space-x-2">
                  {g.memberIds.slice(0, 3).map((id) => {
                    const p = people.find((x) => x.id === id)
                    return <Avatar key={id} src={p?.avatarUrl} name={p?.name ?? '?'} className="h-8 w-8 ring-2 ring-white" />
                  })}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{groupName(g, people)}</div>
                  <div className="text-xs text-neutral-600">
                    {g.memberIds.length} friend{g.memberIds.length === 1 ? '' : 's'}
                  </div>
                </div>
                <span className="text-neutral-400">›</span>
              </Card>
            </button>
          ))}
        </div>
        <button
          onClick={() => nav('/fit-checks/groups/new')}
          className="eyebrow mt-3 block w-full rounded-md border border-dashed border-neutral-400 py-4 text-center text-sm text-accent-600"
        >
          + New group
        </button>
      </div>
    </Screen>
  )
}

export function GroupEditor() {
  const nav = useNavigate()
  const { groupId } = useParams()
  const group = useStore((s) => s.friendGroups.find((g) => g.id === groupId))
  const saveFriendGroup = useStore((s) => s.saveFriendGroup)
  const deleteFriendGroup = useStore((s) => s.deleteFriendGroup)
  const isNew = !groupId

  if (!isNew && !group) return null

  return (
    <Screen withNav={false}>
      <TopBar title={isNew ? 'New Group' : 'Edit Group'} onBack={() => nav(-1)} />
      <div className="px-5 py-5">
        <GroupForm
          initial={group}
          onSave={(g) => {
            saveFriendGroup({ id: group?.id, ...g })
            nav(-1)
          }}
        />
        {group && (
          <button
            onClick={() => {
              deleteFriendGroup(group.id)
              nav(-1)
            }}
            className="eyebrow mt-3 w-full py-2 text-center text-xs tracking-wide text-red-600"
          >
            Delete group
          </button>
        )}
      </div>
    </Screen>
  )
}
