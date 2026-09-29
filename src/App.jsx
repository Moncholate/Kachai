import { useEffect, useState } from 'react'
import Host from './host/Host.jsx'
import Player from './player/Player.jsx'
import { Button, Logo } from './ui.jsx'

/* Ruteo por hash: GitHub Pages solo sirve index.html, así que #/host y
   #/play?pin=123456 nunca dan 404. */
function useHash() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const onChange = () => setHash(location.hash)
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  if (hash.startsWith('#/host')) return <Host />
  if (hash.startsWith('#/play')) {
    const pin = new URLSearchParams(hash.split('?')[1] || '').get('pin') || ''
    return <Player key={pin} initialPin={pin} />
  }
  return <Home />
}

function Home() {
  const [pin, setPin] = useState('')
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6 text-center">
        <div>
          <Logo className="text-6xl" />
          <p className="text-slate-500 mt-2">Answer questions like a pro</p>
        </div>
        <form className="rounded-3xl bg-white border border-slate-200 p-6 flex flex-col gap-3"
          onSubmit={(e) => { e.preventDefault(); location.hash = `#/play?pin=${pin}` }}>
          <input inputMode="numeric" maxLength={6} placeholder="Game PIN" value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-2xl font-black tracking-widest focus:border-[#0F6FD6] outline-none" />
          <Button disabled={pin.length !== 6} className="text-lg">Enter</Button>
        </form>
        <a href="#/host" className="text-slate-500 underline underline-offset-4 hover:text-slate-800">
          Soy profesor/a · crear una sala
        </a>
      </div>
    </div>
  )
}
