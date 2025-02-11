<template>
  <div class="container">
    <div class="content">
      <h1>Trade Ups <button @click="testRoulette()" style="color: white;">sdsd</button></h1> 

      <div class="filters">
        <span @click="fetchInventory">Refresh</span> |
        <span @click="clearFilters">Clear Filters</span> |
        <span @click="toggleFilters">Options<span v-if="isFilterApplied">*</span></span> |
        <input type="text" v-model="searchQuery" placeholder="Search Items" />
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
              <th @click="sortData('collection')" style="width: 25%">
                COLLECTION
                <span v-if="sortKey === 'collection'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('stickers')">
                STICKERS
                <span v-if="sortKey === 'stickers'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th style="width: 5.5%">ADD</th>
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
                    <img :src="sticker.url" alt="s" class="sticker-image"/>
                  </div>
                </div>
              </td>
              <td>
                <button @click="toggleItemInTradeUp(item)">
                  <img v-if="isItemInTradeUp(item)" src="@/assets/images/trash.png" alt="Remove" class="action-icon remove"/>
                  <img v-else src="@/assets/images/hand-tools.png" alt="Add" class="action-icon"/>
                </button>
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
    <!-- <RouletteWheel :possibleOutcomes="possibleOutcomes" :tradeUpOutcome="tradeUpOutcome" /> -->
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

const rarityFilterTradeUp = ref(null);
const statTrakFilterTradeUp = ref(null);

const tradeUpInstance = new tradeUps();

const collections = ref([]);
collections.value = Object.keys(tradeUpInstance.collections);

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

const testRoulette = async () => {
  const response = await axios.get('http://localhost:3000/api/roulette');
  tradeUpOutcome.value = response.data.tradeUpOutcome;
  let itemName = response.data.tradeUpOutcome.item_name.replace('StatTrak™ ', '');
  tradeUpOutcome.value.imageURL = tradeUpInstance.collections[tradeUpInstance.directory[itemName]][itemName]["imageURL"];
  isRouletteWheelOpen.value = !isRouletteWheelOpen.value;

};

const closeRoulette = () => {
  isRouletteWheelOpen.value = false;
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
      outcomes.value = [];
      rarityFilterTradeUp.value = null;
      statTrakFilterTradeUp.value = null;

      alert("Crafting successful! ");
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
    return matchesRarity && matchesStatTrak && matchesWear && matchesCollections;
  });
});
const isFilterApplied = computed(() => {
  return (
      selectedRarities.value.length > 0 ||
      selectedStatTrak.value.length > 0 ||
      selectedWearNames.value.length > 0 ||
      selectedCollections.value.length > 0 ||
      searchQuery.length > 0
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
      console.log(outcomes.value);
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
const clearTradeupItems = (item) => {
  itemsToTradeUp.value = [];
  outcomes.value = [];
  rarityFilterTradeUp.value = null;
  statTrakFilterTradeUp.value = null;

}

</script>

<style scoped>

.container{
  display: flex;
  justify-content: flex-start;
  max-height: 100vh;
  border-left: 2px solid #555;

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
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #555;
  border: none;
  /* font-size: 14px; */
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
  filter: invert(1);
}
.action-icon.remove {
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
  flex-wrap: wrap;
  gap: 8px;
}

.sticker-container {
  display: inline-block;
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
</style>
