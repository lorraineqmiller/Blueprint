import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Dropdown } from './ui'
import { geocodeAddress } from '../lib/geocode'
import type { Location, OffCampusAddress } from '../types'

export interface LocationValue extends Location {
  offCampusAddress: OffCampusAddress | null
}

const OFF_CAMPUS = '__off_campus__'

// Residence-hall dropdown (grouped Barnard / Columbia, from the buildings
// table) plus an off-campus option that geocodes a typed address. The
// address itself stays private — friends only ever see "Off campus" and a
// rounded walking distance.
//
// Locked until you've verified a school email: the building list is your
// community's, so there's nothing to pick from before then.
export function LocationPicker({ value, onChange }: { value: LocationValue; onChange: (v: LocationValue) => void }) {
  const nav = useNavigate()
  const communityId = useStore((s) => s.user.communityId)
  const buildings = useStore((s) => s.buildings).filter((b) => b.communityId === communityId)
  const [addressDraft, setAddressDraft] = useState(value.offCampusAddress?.address ?? '')
  const [lookup, setLookup] = useState<'idle' | 'looking' | 'not_found' | 'error'>('idle')

  // Alphabetical, so Barnard sits above Columbia.
  const schools = [...new Set(buildings.map((b) => b.school))].sort((a, b) => a.localeCompare(b))
  const selectValue = value.buildingId ?? (value.offCampus ? OFF_CAMPUS : '')

  async function findAddress() {
    if (!addressDraft.trim()) return
    setLookup('looking')
    try {
      const found = await geocodeAddress(addressDraft.trim())
      if (!found) {
        setLookup('not_found')
        return
      }
      setLookup('idle')
      setAddressDraft(found.address)
      onChange({ buildingId: null, offCampus: true, offCampusAddress: found })
    } catch {
      setLookup('error')
    }
  }

  if (!communityId) {
    return (
      <button
        onClick={() => nav('/verify-school')}
        className="w-full rounded-xl border border-dashed border-neutral-400 bg-white p-4 text-left"
      >
        <div className="text-sm font-semibold">Verify your school email first</div>
        <p className="text-xs text-neutral-600">Building options come from your school, so you can add this once you've joined.</p>
      </button>
    )
  }

  return (
    <div>
      <Dropdown
        value={selectValue}
        placeholder="Choose your building"
        onChange={(v) => {
          if (v === OFF_CAMPUS) onChange({ buildingId: null, offCampus: true, offCampusAddress: value.offCampusAddress })
          else onChange({ buildingId: v || null, offCampus: false, offCampusAddress: null })
        }}
        groups={[
          // Optional, so once something's picked there's a way back out.
          ...(selectValue ? [{ options: [{ value: '', label: 'Skip for now' }] }] : []),
          ...schools.map((school) => ({
            label: school,
            options: buildings.filter((b) => b.school === school).map((b) => ({ value: b.id, label: b.name })),
          })),
          { label: 'Elsewhere', options: [{ value: OFF_CAMPUS, label: 'Off campus — enter an address' }] },
        ]}
      />

      {value.offCampus && (
        <div className="mt-2">
          <div className="flex gap-2">
            <input
              value={addressDraft}
              onChange={(e) => {
                setAddressDraft(e.target.value)
                setLookup('idle')
              }}
              onKeyDown={(e) => e.key === 'Enter' && findAddress()}
              placeholder="e.g. 523 W 112th St"
              className="min-w-0 flex-1 rounded-xl border border-neutral-400 bg-white px-4 py-3 text-sm outline-none focus:border-accent-600"
            />
            <button
              onClick={findAddress}
              disabled={!addressDraft.trim() || lookup === 'looking'}
              className="eyebrow shrink-0 rounded-xl border border-accent-600 px-3 text-xs text-accent-600 disabled:border-neutral-300 disabled:text-neutral-400"
            >
              {lookup === 'looking' ? 'Finding…' : 'Find'}
            </button>
          </div>
          {value.offCampusAddress && lookup === 'idle' && addressDraft === value.offCampusAddress.address && (
            <p className="mt-1 text-xs text-accent-600">Found it. Only you can see this address.</p>
          )}
          {lookup === 'not_found' && <p className="mt-1 text-xs text-red-600">Couldn't find that address — try adding the street number.</p>}
          {lookup === 'error' && <p className="mt-1 text-xs text-red-600">Couldn't look that up right now. Try again.</p>}
        </div>
      )}
    </div>
  )
}

// Off campus without a found address can't be saved — there'd be nothing
// to measure distance from.
export function isLocationComplete(v: LocationValue): boolean {
  if (v.offCampus) return v.offCampusAddress !== null
  return true
}
