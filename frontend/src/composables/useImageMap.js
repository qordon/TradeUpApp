import { ref } from 'vue'
import axios from 'axios'

const imageMap = ref({})
const isLoaded = ref(false)

const IMAGE_MAP_KEY = 'csgo_image_map'
const CACHE_TIME_KEY = `${IMAGE_MAP_KEY}_time`
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 3
const URL = 'https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/refs/heads/main/static/images.json'

export function useImageMap() {
  async function loadImageMap() {
    if (isLoaded.value) return imageMap.value

    const cached = localStorage.getItem(IMAGE_MAP_KEY)
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY)
    const now = Date.now()
    const cacheValid = cached && cachedTime && now - cachedTime < CACHE_DURATION

    if (cacheValid) {
      imageMap.value = JSON.parse(cached)
      isLoaded.value = true
      return imageMap.value
    }

    const { data } = await axios.get(URL, { responseType: 'json' })
    imageMap.value = typeof data === 'string' ? JSON.parse(data) : data
    localStorage.setItem(IMAGE_MAP_KEY, JSON.stringify(imageMap.value))
    localStorage.setItem(CACHE_TIME_KEY, now.toString())
    isLoaded.value = true
    return imageMap.value
  }

  function getItemImage(itemUrl) {
    return imageMap.value[itemUrl] || 'fallback.png'
  }

  return { imageMap, isLoaded, loadImageMap, getItemImage }
}
