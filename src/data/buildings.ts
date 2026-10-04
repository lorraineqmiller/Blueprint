// Columbia + Barnard undergraduate residence halls. This mirrors the
// `buildings` table seeded in supabase/migrations/0007 — the database copy
// is the source of truth once a backend is connected (the store replaces
// this list with whatever's in the table at sign-in), so adding a dorm
// later is a SQL insert, not an app release. This copy only exists so the
// local demo has the same dropdown.
//
// Coordinates are approximate building entrances (±50 m) — plenty for
// "N min walk", which is all they're used for. Double-check them against a
// map before relying on anything finer.

import { COLUMBIA_BARNARD } from './communities'

export interface Building {
  id: string
  communityId: string
  school: string // 'Columbia' | 'Barnard' — groups the dropdown
  name: string
  lat: number
  lng: number
}

export const BUILDINGS: Building[] = [
  // Columbia
  { id: 'carman', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'Carman Hall', lat: 40.80656, lng: -73.96416 },
  { id: 'john-jay', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'John Jay Hall', lat: 40.80614, lng: -73.96222 },
  { id: 'furnald', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'Furnald Hall', lat: 40.80737, lng: -73.96449 },
  { id: 'hartley', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'Hartley Hall', lat: 40.80655, lng: -73.96182 },
  { id: 'wallach', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'Wallach Hall', lat: 40.80688, lng: -73.96154 },
  { id: 'east-campus', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'East Campus', lat: 40.80747, lng: -73.95943 },
  { id: 'wien', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'Wien Hall', lat: 40.80574, lng: -73.96004 },
  { id: 'broadway', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'Broadway Hall', lat: 40.80585, lng: -73.96506 },
  { id: 'hogan', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'Hogan Hall', lat: 40.80637, lng: -73.96543 },
  { id: 'mcbain', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'McBain Hall', lat: 40.80557, lng: -73.96582 },
  { id: 'schapiro', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'Schapiro Hall', lat: 40.80746, lng: -73.96651 },
  { id: 'river', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'River Hall', lat: 40.80789, lng: -73.96754 },
  { id: 'watt', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'Watt Hall', lat: 40.80508, lng: -73.96506 },
  { id: 'woodbridge', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'Woodbridge Hall', lat: 40.80838, lng: -73.96833 },
  { id: 'ruggles', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'Ruggles Hall', lat: 40.80663, lng: -73.96646 },
  { id: 'harmony', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: 'Harmony Hall', lat: 40.80301, lng: -73.96348 },
  { id: '47-claremont', communityId: COLUMBIA_BARNARD, school: 'Columbia', name: '47 Claremont', lat: 40.81013, lng: -73.96351 },
  // Barnard
  { id: 'sulzberger', communityId: COLUMBIA_BARNARD, school: 'Barnard', name: 'Sulzberger Hall', lat: 40.80834, lng: -73.96405 },
  { id: 'brooks', communityId: COLUMBIA_BARNARD, school: 'Barnard', name: 'Brooks Hall', lat: 40.80815, lng: -73.96434 },
  { id: 'hewitt', communityId: COLUMBIA_BARNARD, school: 'Barnard', name: 'Hewitt Hall', lat: 40.80826, lng: -73.96458 },
  { id: 'reid', communityId: COLUMBIA_BARNARD, school: 'Barnard', name: 'Reid Hall', lat: 40.80802, lng: -73.96411 },
  { id: 'elliott', communityId: COLUMBIA_BARNARD, school: 'Barnard', name: 'Elliott Hall', lat: 40.81049, lng: -73.96328 },
  { id: 'plimpton', communityId: COLUMBIA_BARNARD, school: 'Barnard', name: 'Plimpton Hall', lat: 40.81061, lng: -73.95883 },
  { id: '600-w-116', communityId: COLUMBIA_BARNARD, school: 'Barnard', name: '600 West 116th', lat: 40.80795, lng: -73.96543 },
  { id: '616-w-116', communityId: COLUMBIA_BARNARD, school: 'Barnard', name: '616 West 116th', lat: 40.80818, lng: -73.96600 },
  { id: '620-w-116', communityId: COLUMBIA_BARNARD, school: 'Barnard', name: '620 West 116th', lat: 40.80829, lng: -73.96628 },
  { id: 'cathedral-gardens', communityId: COLUMBIA_BARNARD, school: 'Barnard', name: 'Cathedral Gardens', lat: 40.80143, lng: -73.95812 },
]
