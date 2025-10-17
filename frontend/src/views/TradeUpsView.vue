<template>
  <div class="container">
    <div class="content">
      <h1>Trade Ups</h1> 

      <div class="filters">
        <span @click="fetchInventory">Refresh</span> |
        <span @click="clearFilters">Clear Filters</span> |
        <span @click="toggleFilters">Options<span v-if="isFilterApplied">*</span></span> |
        <input type="text" v-model="searchQuery" placeholder="Search Items" />
        <span class="float-selector-button" @click="openFloatPrompt">
          <img src="@/assets/images/magic-wand.png" alt="Float Selector" class="float-selector-icon"/>
        </span>
      </div>

      <div v-if="showFilters" class="filter-menu">
        <div class="filter-column">
          <h3>Rarity</h3>
          <label v-for="rarity in ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert']" :key="rarity">
            <input type="checkbox" v-model="selectedRarities" :value="rarity" />
            {{ rarity }}
          </label>
        </div>

        <div class="filter-column">
          <h3>StatTrak</h3>
          <label>
            <input type="checkbox" v-model="selectedStatTrak" :value="true" />
            StatTrak
          </label>
          <label>
            <input type="checkbox" v-model="selectedStatTrak" :value="false" />
            No StatTrak
          </label>
        </div>

        <div class="filter-column">
          <h3>Item Wear</h3>
          <label v-for="wear in ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred']" :key="wear">
            <input type="checkbox" v-model="selectedWearNames" :value="wear" />
            {{ wear }}
          </label>
        </div>

        <div class="filter-column float-group">
          <h3>Float</h3>
          <label class="float-field">
            <span class="float-label">Minimal</span>
            <input
              class="float-input"
              type="text"
              v-model="minFloatInput"
              @input="onFloatFilterChange('min', $event)"
              placeholder="0"
            />
          </label>
          <label class="float-field">
            <span class="float-label">Maximal</span>
            <input
              class="float-input"
              type="text"
              v-model="maxFloatInput"
              @input="onFloatFilterChange('max', $event)"
              placeholder="1"
            />
          </label>
        </div>

        <div class="filter-column">
          <h3>Collection</h3>
          <div class="collections-filters-list">
            <label v-for="collection in collections" :key="collection">
              <input type="checkbox" v-model="selectedCollections" :value="collection" />
              {{ collection }}
            </label>
          </div>
        </div>
      </div>

      <div v-if="isLoading">Loading...</div>

      <div v-else class="inventory-list">
        <table>
          <thead>
            <tr style="padding-left: 5px;">
              <th @click="sortData('item_name')" style="width: 40%">
                ITEM
                <span v-if="sortKey === 'item_name'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('item_paint_wear')" style="width: 10%">
                FLOAT
                <span v-if="sortKey === 'item_paint_wear'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('collection')" style="width: 20%">
                COLLECTION
                <span v-if="sortKey === 'collection'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('stickers')" style="width: 28%">
                STICKERS
                <span v-if="sortKey === 'stickers'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th style="width: 4%">ADD</th>
            </tr>
          </thead>
          <tbody class="scrollable-body">
            <tr v-for="(item, index) in sortedItems" :key="index" :class="{ 'selected-item': isItemInTradeUp(item) }">
              <td>
                <span :style="getRarityStyle(item.rarityName)" class="rarity-circle"></span>
                <img :src="item.imageURL" alt="Item Image" class="item-image">
                <div class="item-info">
                  <div class="item-name">{{ item.item_name }}</div>
                  <div class="item-wear-name">{{ item.item_wear_name }}</div>
                </div>
              </td>
              <td>
                <span :title="item.item_paint_wear">
                  {{ item.item_paint_wear.toString().slice(0, 9) }}
                </span>
                <div v-if="activeItem === item" class="full-paint-wear">
                  {{ item.item_paint_wear }}
                </div>
              </td>
              <td>{{ cleanCollectionName(item.collection) }}</td>
              <td>
                <div v-if="item.stickers.length > 0" class="stickers-images">
                  <div v-for="(sticker, idx) in item.stickers" :key="idx" class="sticker-container">
                    <img :src="sticker.stickerImageUrl" alt="s" class="sticker-image"/>
                    <div class="sticker-name">{{ sticker.sticker_name }}</div>
                  </div>
                </div>
              </td>
              <td>
                <button v-if="isItemInTradeUp(item)" @click="toggleItemInTradeUp(item)" title="Fill max" class="action-icon remove"></button>
                <button v-else @click="toggleItemInTradeUp(item)" title="Fill max" class="action-icon"></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="right-panel">
      <TradeUpPanel 
        :itemsToTradeUp="itemsToTradeUp" 
        :outcomes="outcomes"
        @remove-tradeup-item="removeItemFromTradeUp"
        @clear-tradeup-items="clearTradeupItems"
        @swap-items="swapItems" 
        @review="reviewTradeUp"
      />
    </div>

    <TradeUpConfirmation 
      :isOpen="isModalOpen" 
      :itemsToTradeUp="itemsToTradeUp" 
      :outcomes="outcomes"
      @close="closeModal"
      @confirm-tradeup="confirmTradeUp"
    />
    <RouletteWheel
      :possibleOutcomes="outcomes"
      :isOpen="isRouletteWheelOpen"
      :outcome="tradeUpOutcome"
      @close="closeRoulette"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { tradeUps } from '../models/tradeUps';

import TradeUpPanel from '../components/TradeUpPanel.vue';
import TradeUpConfirmation from '../components/TradeUpConfirmation.vue';
import RouletteWheel from '@/components/RouletteWheel.vue';

const router = useRouter();
const items = ref([]);
const isModalOpen = ref(false);
const isRouletteWheelOpen = ref(false);
const tradeUpOutcome = ref(null);

const isLoading = ref(true);
const sortOrder = ref('default');
const sortKey = ref('item_name');
const searchQuery = ref('');
const activeItem = ref(null);
const itemsToTradeUp = ref([]);
const outcomes = ref([]);

const showFilters = ref(false);
const selectedRarities = ref([]);
const selectedStatTrak = ref([]);
const selectedWearNames = ref([]);
const selectedCollections = ref([]);

const minFloatInput = ref('0');
const maxFloatInput = ref('1');

const rarityFilterTradeUp = ref(null);
const statTrakFilterTradeUp = ref(null);

const tradeUpInstance = new tradeUps();

const collections = ref([]);
collections.value = Object.keys(tradeUpInstance.collections);

// Parsed/clamped numeric values for filtering
const clamp01 = (n) => Math.min(1, Math.max(0, Number(n)));
const sanitizeFloatString = (raw) => {
  if (raw == null) return '';
  let s = String(raw).replace(',', '.');
  s = s.replace(/[^0-9.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }
  return s;
};
const parseSanitizedFloat = (raw, fallback) => {
  const s = sanitizeFloatString(raw);
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
};
const minFloat = computed(() => clamp01(parseSanitizedFloat(minFloatInput.value, 0)));
const maxFloat = computed(() => clamp01(parseSanitizedFloat(maxFloatInput.value, 1)));

const onFloatFilterChange = (type, e) => {
  if (type === 'min'){
    minFloatInput.value = sanitizeFloatString(e.target.value);
  }
  else if (type === 'max') {
    maxFloatInput.value = sanitizeFloatString(e.target.value);
  }   
};

onMounted(async () => {
  try{
    const response = await axios.get('http://localhost:3000/api/check');
    if (response.data.isConnected) {
      await fetchInventory();
  } else {
    router.push({ name: 'login' });
  }
  }
  catch (error){
    router.push({ name: 'login' });
  }
  
});

const closeRoulette = () => {
  isRouletteWheelOpen.value = false;
  outcomes.value = [];
};

const fetchInventory = async () => {
  try {
    isLoading.value = true;
    const response = await axios.get('http://localhost:3000/api/tradeups');
    items.value = [...response.data.data].reverse();

    items.value.forEach((item) => {
      let itemName = item.item_name.replace('StatTrak™ ', '');

      const collection = tradeUpInstance.directory[itemName];
      if (collection) {
        item.collection = collection;
      }
      try{
        item.imageURL = tradeUpInstance.collections[collection][itemName]["imageURL"];
      }
      catch (error) {
        item.imageURL = "";
      }
      
    });

  } catch (error) {
    console.error('Error fetching inventory:', error);
  } finally {
    isLoading.value = false;
  }
};
const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};
const reviewTradeUp = () => {
  if (itemsToTradeUp.value.length === 10){
    openModal();
  }
  else{
    alert("Len should be 10");
  }
};
const confirmTradeUp = async () => {

  const allSameRarity = itemsToTradeUp.value.every(
    (item, _, arr) => item.rarity === arr[0].rarity
  );

  const allStatTrak = itemsToTradeUp.value.every(
    item => item.item_name.includes("StatTrak")
  );

  const noneStatTrak = itemsToTradeUp.value.every(
    item => !item.item_name.includes("StatTrak")
  );
  if (!allSameRarity) {
    console.error("Rarity is not the same.");
  } else if (!(allStatTrak || noneStatTrak)) {
    console.error("All items must either have 'StatTrak' or none of them should have it.");
  } else {

  }

  const itemIds = itemsToTradeUp.value.map(item => parseInt(item.item_id))
  const itemsSeeds = itemsToTradeUp.value.map(item => parseInt(item.item_paint_seed))
  const itemsFloats = itemsToTradeUp.value.map(item => (item.item_paint_wear))
  let recipe_id = 0;
  if (!itemsToTradeUp.value[0].item_name.includes('StatTrak')){
    recipe_id = itemsToTradeUp.value[0].rarity - 1;
  }
  else {
    recipe_id = itemsToTradeUp.value[0].rarity + 9;
  }
  try{
    const response = await axios.post('http://localhost:3000/api/confirm/tradeup', 
                                     {itemsIds: itemIds, itemsSeeds: itemsSeeds, itemsFloats: itemsFloats, recipeId: recipe_id, })
    if (response.data.success === true) {
      closeModal();
      itemsToTradeUp.value = [];
      
      rarityFilterTradeUp.value = null;
      statTrakFilterTradeUp.value = null;

      tradeUpOutcome.value = response.data.craftedItem;
      let itemName = response.data.craftedItem.item_name.replace('StatTrak™ ', '');
      tradeUpOutcome.value.imageURL = tradeUpInstance.collections[tradeUpInstance.directory[itemName]][itemName]["imageURL"];

      isRouletteWheelOpen.value = true;
    }
    else {
      closeModal();
      alert("Crafting failed!");
    }
  } catch (erorr) {

  }

  
};
const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};
const clearFilters = () => {
  searchQuery.value = '';
  selectedRarities.value = [];
  selectedStatTrak.value = [];
  selectedWearNames.value = [];
  selectedCollections.value = [];
  minFloatInput.value = '0';
  maxFloatInput.value = '1';
};

const sortData = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : (sortOrder.value === 'desc' ? 'default' : 'asc');
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const sortedItems = computed(() => {
  let result = [...filteredItems.value];
  result = result.map(item => {
    const hasImage = item.imageURL && item.imageURL.trim() !== '';
    const finalImageURL = hasImage
      ? item.imageURL
      : `https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/${item.item_url}_png.png`;

    let updatedStickers = item.stickers || [];
    if (Array.isArray(updatedStickers) && updatedStickers.length > 0) {
      updatedStickers = updatedStickers.map(sticker => {
        const hasStickerImage = sticker.imageURL && sticker.imageURL.trim() !== '';
        const finalStickerURL = hasStickerImage
          ? sticker.imageURL
          : `https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/${sticker.sticker_url}_png.png`;
        return {
          ...sticker,
          stickerImageUrl: finalStickerURL,
        };
      });
    }

    return {
      ...item,
      imageURL: finalImageURL,
      stickers: updatedStickers,
    };
  });
  if (searchQuery.value) {
    result = result.filter(item => 
      item.item_name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  if (rarityFilterTradeUp.value){
    result = result.filter(item => 
      item.rarity === rarityFilterTradeUp.value);
  }
  if (statTrakFilterTradeUp.value === null){

  }
  else if (statTrakFilterTradeUp.value === true) {
  result = result.filter(item =>
    item.item_name && item.item_name.includes('StatTrak')
  );
  }
  else if (statTrakFilterTradeUp.value === false) {
    result = result.filter(item =>
    item.item_name && !item.item_name.includes('StatTrak')
  );
  }
  if (sortOrder.value === 'default') {
    return result;
  }

  result.sort((a, b) => {
    let aValue = a[sortKey.value];
    let bValue = b[sortKey.value];

    if (sortKey.value === 'stickers') {
      aValue = a.stickers.length;
      bValue = b.stickers.length;
    }

    if (aValue < bValue) {
      return sortOrder.value === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder.value === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  return result;
});

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesRarity = selectedRarities.value.length === 0 || selectedRarities.value.includes(item.rarityName);
    const matchesStatTrak = selectedStatTrak.value.length === 0 || selectedStatTrak.value.includes(item.item_name.includes("StatTrak™"));
    const matchesWear = selectedWearNames.value.length === 0 || selectedWearNames.value.includes(item.item_wear_name);
    const matchesCollections = selectedCollections.value.length === 0 || selectedCollections.value.includes(item.collection);
        // Float filter
        const minF = Number(minFloat.value || 0);
    const maxF = Number(maxFloat.value || 1);
    let matchesFloat = true;
    if (minF > 0 || maxF < 1) {
      const n = typeof item.item_paint_wear === 'number' ? item.item_paint_wear : parseFloat(item.item_paint_wear);
      matchesFloat = Number.isFinite(n) && n >= minF && n <= maxF;
    }
    return matchesRarity && matchesStatTrak && matchesWear && matchesCollections && matchesFloat;
  });
});
const isFilterApplied = computed(() => {
  return (
      selectedRarities.value.length > 0 ||
      selectedStatTrak.value.length > 0 ||
      selectedWearNames.value.length > 0 ||
      selectedCollections.value.length > 0 ||
      searchQuery.length > 0 ||
      Number(minFloat.value) > 0 || Number(maxFloat.value) < 1
    );
});

const cleanCollectionName = (name) => {
  if (name) {
    // Видаляємо "Collection" і "The" з початку та кінця рядка
    return name.replace(/\b(The|Collection)\b/g, '').trim();
  }
  return '';
};

const getRarityStyle = (rarityName) => {
  let color;
  switch (rarityName) {
    case 'Consumer Grade':
      color = 'rgb(176, 195, 217)';
      break;
    case 'Industrial Grade':
      color = 'rgb(94, 152, 217)';
      break;
    case 'Mil-Spec':
      color = 'rgb(75, 105, 255)';
      break;
    case 'Restricted':
      color = 'rgb(136, 71, 255)';
      break;
    case 'Classified':
      color = 'rgb(211, 46, 230)'; 
      break;
    case 'Covert':
      color = 'rgb(235, 75, 75)';
      break;
    default:
      color = '#999';
  }
  return { backgroundColor: color };
};

const showFullPaintWear = (item) => {
  activeItem.value = item;
};

const hideFullPaintWear = () => {
  activeItem.value = null;
};

const isItemInTradeUp = (item) => {
  return itemsToTradeUp.value.some(existingItem => existingItem.item_id === item.item_id);
};

const removeItemFromTradeUp = async (index) => {
  itemsToTradeUp.value.splice(index, 1);
  
  if (itemsToTradeUp.value.length === 0){
    rarityFilterTradeUp.value = null;
    statTrakFilterTradeUp.value = null;
    outcomes.value = [];
  }

};

const toggleItemInTradeUp = async (item) => {
  const index = itemsToTradeUp.value.findIndex(existingItem => existingItem.item_id === item.item_id);
  
  if (index !== -1) {

    removeItemFromTradeUp(index);
  } else {

    if (itemsToTradeUp.value.length < 10) {
      itemsToTradeUp.value.push(item);
      if (!rarityFilterTradeUp.value) rarityFilterTradeUp.value = item.rarity;
      if (statTrakFilterTradeUp.value === null && item.item_name.includes("StatTrak™")){
        statTrakFilterTradeUp.value = true;
      } 
      else if (statTrakFilterTradeUp.value === null && !item.item_name.includes("StatTrak™")) {
        statTrakFilterTradeUp.value = false;
      }
      outcomes.value = await (tradeUpInstance.getPotentialOutcome(itemsToTradeUp.value));
    } 

    else {
      alert("You can only add 10 items.");
    }
  }
};
const swapItems = async (i,j) => {
  const temp = itemsToTradeUp.value[i];
  itemsToTradeUp.value[i] = itemsToTradeUp.value[j];
  itemsToTradeUp.value[j] = temp;
  outcomes.value = await (tradeUpInstance.getPotentialOutcome(itemsToTradeUp.value));
}
const clearTradeupItems = () => {
  itemsToTradeUp.value = [];
  outcomes.value = [];
  rarityFilterTradeUp.value = null;
  statTrakFilterTradeUp.value = null;

}

const openFloatPrompt = async () => {
  const input = prompt(`Select items with specific float values.\nEnter float values (format: (0.123, 0.894, 0.456):`);
  if (input === null) return;

  let targetFloats;
  try {
    if (input.startsWith('(') && input.endsWith(')')) {
      const numbersStr = input.slice(1, -1).split(',');
      targetFloats = numbersStr.map(num => parseFloat(num.trim()));
    }
    else if (input.startsWith('[') && input.endsWith(']')) {
      try {
        targetFloats = JSON.parse(input).map(num => parseFloat(num));
      } catch {
        throw new Error('Invalid array format');
      }
    }
    else {
      throw new Error('Invalid format');
    }

    if (!targetFloats.every(num => !isNaN(num) && num >= 0 && num <= 1)) {
      throw new Error('Invalid numbers');
    }

    const matchingItems = targetFloats.map(targetFloat => {
      // Get the number of decimal places in the input
      const decimalPlaces = targetFloat.toString().split('.')[1]?.length || 0;
      const precision = Math.min(decimalPlaces, 12);
      const targetFloatStr = targetFloat.toFixed(precision);
      
      // Find the closest match if precision is less than 12
      if (precision < 12) {
        let closestItem = null;
        let minDifference = Infinity;
        
        for (const item of sortedItems.value) {
          const itemFloatStr = item.item_paint_wear.toFixed(precision);
          if (itemFloatStr === targetFloatStr) {
            return item;
          }
          
          // Calculate difference for closest match
          const difference = Math.abs(item.item_paint_wear - targetFloat);
          if (difference < minDifference) {
            minDifference = difference;
            closestItem = item;
          }
        }
        return closestItem;
      }
      
      // For 12 decimal places, use exact match
      return sortedItems.value.find(item => 
        item.item_paint_wear.toFixed(12) === targetFloatStr
      );
    }).filter(Boolean);

    clearTradeupItems();
    for (const item of matchingItems) {
      await toggleItemInTradeUp(item);
    }

  } catch (error) {
    alert('Invalid format! Please use format: (0.123, 0.894, 0.456)');
  }
};

</script>

<style scoped>

.container{
  display: flex;
  justify-content: flex-start;
  max-height: 100vh;
}
.content {
  flex: 1;
  flex-grow: 1;
  background-color: #222;
}
.right-panel {
  width: 300px;
  background-color: #444;
}


div {
  color: white;
}

h1 {
  color: white;
  padding-left: 10px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  background-color: #222;
  border-top: 1px solid white;
}

.filters span {
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s;
}

.filters span:hover {
  color: #fff;
}

.filters input {
  padding: 4px 8px;
  border: none;
  border-bottom: 1px solid #555;
  background-color: transparent;
  color: #ddd;
  outline: none;
}

.filters input::placeholder {
  color: #888;
}

.filters input:focus {
  border-bottom-color: #aaa;
}


.inventory-list {
  max-height: calc(100vh - 98px);
  overflow-y: auto;
  border-top: 1px solid #555;
  background-color: #333;
  scrollbar-gutter: stable;
  overflow-x: hidden;
}

.inventory-list::-webkit-scrollbar {
  width: 8px;
}

.inventory-list::-webkit-scrollbar-track {
  background: transparent;
}

.inventory-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 4px;
}

.inventory-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.6);
}

table {
  width: 100%;
  border: none;
  border-collapse: collapse;
  background-color: #444;
  
}

th, td {
  padding: 8px 5px;
  text-align: left;
  border-bottom: 1px solid #555;
  border: none;
}
th:not(:first-child),
td:not(:first-child) {
  text-align: center;
} 

td:first-child {
  padding-left: 8px;
}

th {
  background-color: #222;
  color: white;
  cursor: pointer;
  top: 0; 
  z-index: 1; 
}
tbody {

  max-height: 50vh;
  overflow-y: auto; 
  border: none;
}
td {
  background-color: #333;
  color: white;
  border: none;
}
tr{
  border-bottom: 1px solid #555;
}

.rarity-circle {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 5px;
    vertical-align: middle;
}
.item-image {
    width: 40px;
    height: auto;
    margin: 0 8px;
    vertical-align: middle; 
}

.item-info {
    display: inline-block;
    vertical-align: middle; 
}

.item-name {
    font-size: 15x;
}

.item-wear-name {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
}

button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
}

button:hover {
  opacity: 0.8;
}

.action-icon {
  width: 20px;
  height: 20px;
  background: url('@/assets/images/hand-tools.png') center/contain no-repeat;
  
  filter: invert(1);
  border: none;
  cursor: pointer;
}

.action-icon.remove {
  background: url('@/assets/images/trash.png') center/contain no-repeat;
  filter: invert(17%) sepia(94%) saturate(7480%) hue-rotate(-5deg) brightness(107%) contrast(116%);
}


.full-paint-wear {
  position: absolute;
  background-color: #222;
  color: white;
  padding: 5px;
  border-radius: 5px;
  font-size: 12px;
  z-index: 10;
  width: 60px;
  text-align: center;
}
.stickers-images {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: visible;
}

.sticker-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0;
  width: 45px;
  height: 45px;
  position: relative;
}

.sticker-container:hover {
  z-index: 5; /* raise above neighboring cells so label can overlap */
}
.sticker-image {
  width: 45px;
  height: 45px;
  object-fit: contain;
  display: block;
  transition: transform 0.22s ease;
}

.sticker-container:hover .sticker-image {
  transform: scale(1.4);
}

.sticker-name {
  position: absolute;
  top: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  line-height: 1.2;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 3px;
  white-space: nowrap;
  max-width: 250px;
  opacity: 0;
  transition: opacity 0.22s ease;
  pointer-events: none;
  z-index: 2;
}

.sticker-container:hover .sticker-name {
  opacity: 1;
}


.filter-menu {
  position: absolute;
  background: #333;
  border: 1px solid white;
  padding: 10px;
  display: flex;
  gap: 20px;
}

.filter-column {
  display: flex;
  flex-direction: column;
  gap: 5px;
}


/* Float filter styling to match inputs */
.float-group {
  gap: 8px;
}
.float-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.float-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}
.float-input {
  padding: 4px 8px;
  border: none;
  border-bottom: 1px solid #555;
  background-color: transparent;
  color: #ddd;
  outline: none;
  width: 120px;
}
.float-input::placeholder {
  color: #888;
}
.float-input:focus {
  border-bottom-color: #aaa;
}


.collections-filters-list {
  max-height: 150px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.collections-filters-list::-webkit-scrollbar {
  width: 8px;
}

.collections-filters-list::-webkit-scrollbar-track {
  background: transparent;
}

.collections-filters-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 4px;
}

.collections-filters-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.6);
}
.selected-item td {
  background-color: #111;
}

.float-selector-button {
  color: #888;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
  background-color: #444;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.float-selector-button:hover {
  background-color: #555;
}

.float-selector-icon {
  width: 18px;
  height: 18px;
  filter: invert(1);
}

.float-selector-button:hover .float-selector-icon {
  filter: invert(1) brightness(1.2);
}
</style>
