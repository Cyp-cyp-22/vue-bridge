export default function resize() {
  const baseWidth = 1920
  const baseHeight = 1080
  const scale = Math.min(
    window.innerWidth / baseWidth,
    window.innerHeight / baseHeight
  )
  document.documentElement.style.fontSize = `${scale * 100}px`
}
window.addEventListener('resize', resize)
resize()