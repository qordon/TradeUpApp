import { ref } from 'vue'
import axios from 'axios'

const imageMap = ref({})
const isLoaded = ref(false)

const IMAGE_MAP_KEY = 'csgo_image_map'
const CACHE_TIME_KEY = `${IMAGE_MAP_KEY}_time`
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 3
const URL = 'https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/refs/heads/main/static/images.json'

// Simple default placeholder image used when we can't resolve a URL
const DEFAULT_IMAGE_URL =
  ''

export function useImageMap() {
  async function loadImageMap() {
    if (isLoaded.value) return imageMap.value

    try {
      const { data } = await axios.get(URL, { responseType: 'json' })
      imageMap.value = typeof data === 'string' ? JSON.parse(data) : data
    } catch (error) {
      console.error('Failed to load image map:', error)
      imageMap.value = {}
    }

    isLoaded.value = true
    return imageMap.value
  }


  function getItemImage(itemUrl) {
    if (!itemUrl) return DEFAULT_IMAGE_URL
    return imageMap.value[itemUrl] || DEFAULT_IMAGE_URL
  }

  return { imageMap, isLoaded, loadImageMap, getItemImage }
}
