import { useRef, useEffect } from 'react'

export default function useTelemetry() {
  const data = useRef({
    keystrokes: [], mouseSpeeds: [], clicks: 0, backspaces: 0,
    totalMouseDist: 0, lastMouse: null, lastKey: null,
    startTime: Date.now(), firstInteraction: null,
    hesitations: 0, lastKeystrokeTime: null,
    scrollDepth: 0, copyPasteDetected: false,
    mousePath: [], curveScore: 0,
  })

  useEffect(() => {
    const d = data.current

    const onKey = (e) => {
      const now = Date.now()
      if (!d.firstInteraction) d.firstInteraction = now
      if (d.lastKey) {
        const interval = now - d.lastKey
        d.keystrokes.push(interval)
        // Hesitation = pause > 500ms mid-typing
        if (interval > 500) d.hesitations++
      }
      d.lastKey = now
      d.lastKeystrokeTime = now
      if (e.key === 'Backspace') d.backspaces++
    }

    const onMouse = (e) => {
      if (d.lastMouse) {
        const dx = e.clientX - d.lastMouse.x
        const dy = e.clientY - d.lastMouse.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        const dt = (Date.now() - d.lastMouse.t) || 1
        d.totalMouseDist += dist
        d.mouseSpeeds.push((dist / dt) * 1000)
        d.mousePath.push({ x: e.clientX, y: e.clientY })
      }
      d.lastMouse = { x: e.clientX, y: e.clientY, t: Date.now() }
    }

    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight
      const total = document.documentElement.scrollHeight
      d.scrollDepth = Math.max(d.scrollDepth, scrolled / total)
    }

    const onPaste = (e) => { d.copyPasteDetected = true }
    const onClick = () => { d.clicks++ }

    document.addEventListener('keydown', onKey)
    document.addEventListener('mousemove', onMouse)
    document.addEventListener('scroll', onScroll)
    document.addEventListener('paste', onPaste)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousemove', onMouse)
      document.removeEventListener('scroll', onScroll)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('click', onClick)
    }
  }, [])

  const computeCurvature = (path) => {
    if (path.length < 3) return 0.5
    let totalCurve = 0, count = 0
    for (let i = 1; i < path.length - 1; i++) {
      const dx1 = path[i].x - path[i-1].x
      const dy1 = path[i].y - path[i-1].y
      const dx2 = path[i+1].x - path[i].x
      const dy2 = path[i+1].y - path[i].y
      const dot = dx1*dx2 + dy1*dy2
      const mag1 = Math.sqrt(dx1*dx1 + dy1*dy1) || 1
      const mag2 = Math.sqrt(dx2*dx2 + dy2*dy2) || 1
      const angle = Math.acos(Math.min(1, Math.max(-1, dot / (mag1*mag2))))
      totalCurve += angle
      count++
    }
    return Math.min(1, (totalCurve / Math.max(count, 1)) / Math.PI)
  }

  const computeVariance = (intervals) => {
    if (intervals.length < 2) return 0
    const mean = intervals.reduce((a, b) => a+b, 0) / intervals.length
    const variance = intervals.reduce((a, b) => a + (b-mean)**2, 0) / intervals.length
    return Math.sqrt(variance)
  }

  const getFeatures = () => {
    const d = data.current
    const elapsed = Math.max((Date.now() - d.startTime) / 1000, 1)
    const readingTime = d.firstInteraction
      ? (d.firstInteraction - d.startTime) / 1000
      : elapsed
    const intervals = d.keystrokes
    const avgInterval = intervals.length
      ? intervals.reduce((a,b) => a+b, 0) / intervals.length : 200
    const speeds = d.mouseSpeeds
    const avgMouseSpeed = speeds.length
      ? speeds.reduce((a,b) => a+b, 0) / speeds.length : 0
    const hour = new Date().getHours()

    return {
      typing_speed:            Math.round((intervals.length / elapsed) * 60),
      backspace_count:         d.backspaces,
      mouse_movement_speed:    Math.round(avgMouseSpeed),
      cursor_path_length:      Math.round(d.totalMouseDist),
      keystroke_interval:      Math.round(avgInterval),
      mouse_click_frequency:   parseFloat((d.clicks / elapsed).toFixed(2)),
      session_duration:        Math.round(elapsed),
      login_time:              parseFloat((hour + new Date().getMinutes()/60).toFixed(2)),
      unusual_login_time:      hour < 7 || hour > 23,
      keystroke_variance:      Math.round(computeVariance(intervals)),
      scroll_depth:            parseFloat(d.scrollDepth.toFixed(2)),
      copy_paste_detected:     d.copyPasteDetected,
      reading_time:            parseFloat(readingTime.toFixed(2)),
      hesitation_count:        d.hesitations,
      mouse_path_curvature:    parseFloat(computeCurvature(d.mousePath).toFixed(2)),
      // defaults (set by server/context in production)
      vpn_detected:            false,
      failed_login_attempts:   0,
      browser_fingerprint_risk:0.0,
      ip_address_risk:         0.0,
      geo_location_change:     false,
      device_change:           false,
      device_fingerprint:      navigator.userAgent.slice(0, 80),
    }
  }

  return { getFeatures }
}
