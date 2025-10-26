// src/utils/dateUtils.js

export const formatTradableDate = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d)) return ''
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

export const isItemTradable = (isoString) => {
  if (!isoString) return true
  const t = Date.parse(isoString)
  if (!Number.isFinite(t)) return true
  return t <= Date.now()
}
