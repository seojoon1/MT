import { useEffect, useState } from 'react'
import { Play, Square } from 'lucide-react'
import { ttsService } from '../../services/ttsService'

type Props = {
  text: string
  lang: 'ko' | 'lo'
  className?: string
}

export default function TtsControls({ text, lang, className }: Props) {
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    let raf = 0
    const poll = () => {
      setSpeaking(ttsService.isSpeaking())
      raf = window.requestAnimationFrame(poll)
    }
    raf = window.requestAnimationFrame(poll)
    return () => window.cancelAnimationFrame(raf)
  }, [])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!text) return
    if (speaking) {
      ttsService.cancel()
      setSpeaking(false)
    } else {
      ttsService.speak(text, lang)
      setSpeaking(true)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={className ?? 'inline-flex items-center justify-center rounded-md bg-white/90 p-1 shadow-sm'}
      aria-label={speaking ? 'Stop TTS' : 'Play TTS'}
    >
      {speaking ? <Square className="h-4 w-4 text-slate-600" /> : <Play className="h-4 w-4 text-slate-600" />}
    </button>
  )
}
