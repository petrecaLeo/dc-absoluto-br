"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
}

const PARTICLE_COUNT = 50
const COLORS = ["#0476f2", "#e62429", "#ffcc00", "#ffffff"]

function createParticle(width: number, height: number): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.5 + 0.1,
    color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#ffffff",
  }
}

export function useCopyright() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number | null = null
    let isActive = false
    let particles: Particle[] = []
    let observer: IntersectionObserver | null = null

    function resize() {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      sizeRef.current = { width, height }
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function init() {
      resize()
      const { width: w, height: h } = sizeRef.current
      particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(w, h))
    }

    function drawLine(p1: Particle, p2: Particle, distance: number) {
      if (!ctx) return
      const maxDist = 100
      if (distance > maxDist) return
      const alpha = (1 - distance / maxDist) * 0.15
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
    }

    function animate() {
      if (!isActive || !ctx || !canvas) return
      const { width: w, height: h } = sizeRef.current
      if (w === 0 || h === 0) return

      ctx.clearRect(0, 0, w, h)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (!p) continue
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()
        ctx.globalAlpha = 1

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          if (!p2) continue
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          drawLine(p, p2, dist)
        }
      }

      if (isActive) {
        animationId = requestAnimationFrame(animate)
      }
    }

    function start() {
      if (isActive) return
      isActive = true
      init()
      animationId = requestAnimationFrame(animate)
    }

    function stop() {
      isActive = false
      if (animationId !== null) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
    }

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (entry?.isIntersecting) {
            start()
          } else {
            stop()
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(canvas)
    } else {
      start()
    }

    window.addEventListener("resize", resize)

    return () => {
      stop()
      observer?.disconnect()
      window.removeEventListener("resize", resize)
    }
  }, [])

  return { canvasRef }
}
