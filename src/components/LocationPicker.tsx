import { useState } from 'react'
import { useStore } from '../store'
import { geocodeAddress } from '../lib/geocode'
import type { Location, OffCampusAddress } from '../types'

export interface LocationValue extends Location {
  offCampusAddress: OffCampusAddress | null
}

const OFF_CAMPUS = '__off_campus__'

// Residence-hall dropdown (grouped Columbia / Barnard, from the buildings
// table) plus an off-campus option that geocodes a typed address. The
// address itself stays private — friends only ever see "Off campus" and a
// rounded walking distance.
export function LocationPicker({ value, onChange }: { value: LocationValue; onChange: (v: LocationValue) => void }) {
  const buildings = useStore((s) => s.buildings)
  const [addressDraft, setAddressDraft] = useState(value.offCampusAddress?.address ?? '')
  const [lookup, setLookup] = useState<'idle' | 'looking' | 'not_found' | 'error'>('idle')

  const schools = [...new Set(buildings.map((b) => b.school))]
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

  return (
    <div>
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value
          if (v === OFF_CAMPUS) onChange({ buildingId: null, offCampus: true, offCampusAddress: value.offCampusAddress })
          else onChange({ buildingId: v || null, offCampus: false, offCampusAddress: null })
        }}
        className="w-full appearance-none rounded-md border border-neutral-400 bg-white bg-[length:12px] bg-[right_1rem_center] bg-no-repeat px-4 py-3 pr-10 outline-none focus:border-accent-600"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%231d1f20' stroke-width='1.5'/%3E%3C/svg%3E\")",
        }}
      >
        <option value="">Choose your building</option>
        {schools.map((school) => (
          <optgroup key={school} label={school}>
            {buildings
              .filter((b) => b.school === school)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </optgroup>
        ))}
        <optgroup label="Elsewhere">
          <option value={OFF_CAMPUS}>Off campus — enter an address</option>
        </optgroup>
      </select>

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
              className="min-w-0 flex-1 rounded-md border border-neutral-400 bg-white px-4 py-3 text-sm outline-none focus:border-accent-600"
            />
            <button
              onClick={findAddress}
              disabled={!addressDraft.trim() || lookup === 'looking'}
              className="eyebrow shrink-0 rounded-md border border-accent-600 px-3 text-xs text-accent-600 disabled:border-neutral-300 disabled:text-neutral-400"
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
