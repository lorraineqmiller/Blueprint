import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Card, Eyebrow, Photo, PrimaryButton } from '../components/ui'
import { useStore } from '../store'
import type { Category } from '../types'

const categories: Category[] = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories']

function SourceRow({
  title,
  body,
  status,
  onClick,
}: {
  title: string
  body: string
  status: 'connected' | 'manual' | string
  onClick?: () => void
}) {
  return (
    <button onClick={onClick} className="block w-full text-left">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="font-heading text-base font-semibold uppercase">{title}</span>
          <span className="eyebrow text-[10px] text-accent-600">{status}</span>
        </div>
        <p className="mt-1 text-sm text-neutral-600">{body}</p>
      </Card>
    </button>
  )
}

export default function AddItem() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const connectShop = useStore((s) => s.connectShop)
  const connectGmail = useStore((s) => s.connectGmail)
  const addItem = useStore((s) => s.addItem)
  const uploadItemImage = useStore((s) => s.uploadItemImage)

  const [showManual, setShowManual] = useState(false)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState<Category>('Tops')
  const [size, setSize] = useState('')
  const [price, setPrice] = useState('')
  const [imported, setImported] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  if (showManual) {
    return (
      <Screen withNav={false} scroll={false}>
        <TopBar title="Add Item" onBack={() => setShowManual(false)} />
        <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            <div>
              <Eyebrow className="mb-1">Photo</Eyebrow>
              <button
                onClick={() => fileInput.current?.click()}
                className="relative block h-40 w-full overflow-hidden rounded-md border border-dashed border-neutral-400"
              >
                <Photo src={photoPreview} className="h-40 w-full" />
                {!photoPreview && (
                  <span className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
                    Tap to snap or choose a photo
                  </span>
                )}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setPhotoFile(file)
                    setPhotoPreview(URL.createObjectURL(file))
                  }
                }}
              />
            </div>
            <div>
              <Eyebrow className="mb-1">Item name</Eyebrow>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Black Leather Jacket"
                className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
              />
            </div>
            <div>
              <Eyebrow className="mb-1">Brand</Eyebrow>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="AllSaints"
                className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
              />
            </div>
            <div>
              <Eyebrow className="mb-2">Category</Eyebrow>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`eyebrow rounded-md border py-2 text-[11px] ${
                      category === c ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Eyebrow className="mb-1">Size</Eyebrow>
                <input
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="M"
                  className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
                />
              </div>
              <div className="flex-1">
                <Eyebrow className="mb-1">Price ($)</Eyebrow>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="120"
                  inputMode="decimal"
                  className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
                />
              </div>
            </div>
          </div>
          <PrimaryButton
            disabled={!name || !brand}
            onClick={() => {
              const id = addItem({
                name,
                brand,
                category,
                size: size || 'One size',
                color: 'Unspecified',
                priceDollars: Number(price) || 0,
                source: 'manual',
              })
              if (photoFile) uploadItemImage(id, photoFile)
              nav(`/closet/${id}`)
            }}
          >
            Add to closet
          </PrimaryButton>
        </div>
      </Screen>
    )
  }

  return (
    <Screen withNav={false}>
      <TopBar title="Add Item" onBack={() => nav(-1)} />
      <div className="px-5 py-5">
        <p className="text-sm text-neutral-600">
          Digitising a closet by hand is why closet apps die. Blueprint reads the receipts you already have.
        </p>
        <div className="mt-4 space-y-3">
          <SourceRow
            title="Shop Orders"
            body="Blueprint reads your order history and builds the piece card for you — brand, colour, price, date."
            status={user.hasConnectedShop ? 'connected' : imported === 'shop' ? 'connected' : 'connect'}
            onClick={() => {
              connectShop()
              setImported('shop')
            }}
          />
          <SourceRow
            title="Gmail Receipts"
            body="Depop, Vinted, Zara, resale confirmations. Six months back, in one sweep."
            status={user.hasConnectedGmail ? 'connected' : imported === 'gmail' ? 'connected' : 'connect'}
            onClick={() => {
              connectGmail()
              setImported('gmail')
            }}
          />
          <SourceRow
            title="Camera"
            body="For thrifted and handed-down pieces with no receipt. Snap it against any wall."
            status="manual"
            onClick={() => setShowManual(true)}
          />
        </div>
        {imported && (
          <div className="mt-4 rounded-md border border-accent-300 bg-accent-100 p-4 text-sm text-accent-700">
            Imported 1 new piece into your closet. Check My Closet to see it.
          </div>
        )}
      </div>
    </Screen>
  )
}
