interface ParticleEffectProps {
  accentColor: string
}

const PARTICLE_COUNT = 240

function hash(i: number, offset: number) {
  let h = (i * 2654435761 + offset * 340573321) | 0
  h = (((h >> 16) ^ h) * 0x45d9f3b) | 0
  h = (((h >> 16) ^ h) * 0x45d9f3b) | 0
  return ((h >> 16) ^ h) & 0x7fff
}

function norm(i: number, offset: number) {
  return hash(i, offset) / 0x7fff
}

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  left: `${Math.round(norm(i, 0) * 10000) / 100}%`,
  bottom: `${Math.round(norm(i, 1) * 8000) / 100}%`,
  size: `${Math.round((1.5 + norm(i, 2) * 3) * 100) / 100}px`,
  opacity: Math.round((0.15 + norm(i, 3) * 0.55) * 100) / 100,
  duration: `${Math.round((2.5 + norm(i, 4) * 5) * 100) / 100}s`,
  delay: `${-Math.round(norm(i, 5) * 600) / 100}s`,
}))

export function ParticleEffect({ accentColor }: ParticleEffectProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 h-28 overflow-hidden opacity-70">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            backgroundColor: accentColor,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}
