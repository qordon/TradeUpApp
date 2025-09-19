<template>
  <div class="container">
    <div class="content">
      <h1>Transfer from</h1> 

      <div class="filters">
        <span @click="">Refresh</span> |
        <span @click="clearFilters">Clear Filters</span> |
        <span @click="toggleFilters">Options<span v-if="isFilterApplied">*</span></span> |
        <input type="text" v-model="searchQuery" placeholder="Search Items" /> |
        <!-- <button class="group-toggle-btn" :class="{ active: groupAll }" @click="toggleGroupAll">
          {{ groupAll ? 'UNGROUP' : 'GROUP' }}
        </button> | -->
        <span @click="toggleGroupAll" class="group-toggle-btn" :class="{ active: groupAll }">{{ groupAll ? 'UNGROUP' : 'GROUP' }}</span> |
        <span>
          {{ selectedCount }} items
          <img src="@/assets/images/exchange.png" alt="Selected" class="action-icon small-icon"/>
        </span> | 
        <!-- <button class="move-selected-btn" @click="moveSelected">
          EXTRACT
        </button> -->
        <span @click="moveSelected" class="move-selected-btn">EXTRACT</span>
       
        
        <!-- <span class="float-selector-button" @click="openFloatPrompt">
          <img src="@/assets/images/magic-wand.png" alt="Float Selector" class="float-selector-icon"/>
        </span> -->
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

      <!-- Storages Section (inline) -->
      <div v-if="storages.length" class="storages">
        <h2 class="storages-title">Storages</h2>
        <div class="storages-grid">
          <div
            v-for="(storage, idx) in storages"
            :key="storage.item_id || idx"
            :class="['storage-card', { 'storage-card--selected': isStorageSelected(storage) }]"
            @click="toggleStorage(storage)"
          >
            <div class="storage-thumb">
              <img
                class="storage-image"
                src="https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJG51EejH_XV0MGkITXE5AB094KtuwG0Exv1yMfkqXcCtvT_MPw5JPTKV2bDk7Z3sudtHSjr2w0ptCMWPT2u/330x192?allow_animated=1"
                alt="Storage Unit"
              />
            </div>
            <div class="storage-info">
              <div class="storage-name" :title="displayStorageName(storage)">
                {{ displayStorageName(storage) }}
              </div>
              <div class="storage-count">
                {{ storage.item_storage_total ?? 0 }} items
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isLoading">Loading...</div>

      <div v-else class="inventory-list">
        <table>
          <thead>
            <tr style="padding-left: 5px;">
              <th @click="sortData('item_name')" style="width: 38%">
                ITEM
                <span v-if="sortKey === 'item_name'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('item_paint_wear')" style="width: 9%">
                FLOAT
                <span v-if="sortKey === 'item_paint_wear'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('collection')" style="width: 16%">
                COLLECTION
                <span v-if="sortKey === 'collection'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('stickers')" style="width: 22%">
                STICKERS
                <span v-if="sortKey === 'stickers'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('__storageName')" style="width: 15%">
                STORAGE
                <span v-if="sortKey === '__storageName'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th style="width: 6%">QTY</th>
              <th style="width: 8%">MOVE</th>
              <th>MAX</th>
              <!-- <th style="width: 5.5%">ADD</th> -->
            </tr>
          </thead>
          <tbody class="scrollable-body">
            <tr v-for="(item, index) in sortedItems" :key="index">
              <td>
                <span :style="getRarityStyle(item.rarityName)" class="rarity-circle"></span>
                <img :src="item.imageURL" alt="Item Image" class="item-image">
                <div class="item-info">
                  <div class="item-name">{{ item.item_name }}</div>
                  <div class="item-wear-name">{{ item.item_wear_name }}</div>
                </div>
              </td>
              <td>
                <div v-if="!item.__isGrouped">
                  <span :title="item.item_paint_wear">
                    {{ item.item_paint_wear ? item.item_paint_wear.toString().slice(0, 9) : '' }}
                  </span>
                  <div v-if="activeItem === item" class="full-paint-wear">
                    {{ item.item_paint_wear }}
                  </div>
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
              <td>{{ item.__storageName || '' }}</td>
              <td>{{ item.qty || 1 }}</td>
              <td>
                <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                  <input
                    class="move-input"
                    type="number"
                    min="0"
                    :max="item.qty"
                    :value="getMoveQty(item.__rowKey)"
                    @input="onMoveInputFrom(item, $event)"
                    @keydown="onMoveKeyDown"
                    @paste="onMovePaste"
                  />
                </div>
              </td>
              <td>
                <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                  <button @click="onMaxClick(item)" title="Fill max">
                    <img src="@/assets/images/up-arrow.png" alt="Max" class="action-icon"/>
                  </button>
                </div>
              </td>
              <!-- <td>
                <button @click="onMoveClick(item)" title="Move selected quantity">
                  <img src="@/assets/images/hand-tools.png" alt="Move" class="action-icon"/>
                </button>
              </td> -->
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { tradeUps } from '../models/tradeUps';

const router = useRouter();
const items = ref([]);
const allInventory = ref([]); // holds full inventory for listing storages
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

// Group-all toggle (default: ungroup)
const groupAll = ref(false);

// Move quantities keyed by row key
const moveQuantities = ref({});
const getMoveQty = (key) => {
  const v = moveQuantities.value[key];
  return (typeof v === 'number' && !isNaN(v)) ? String(v) : "0";
};
const setMoveQty = (key, val) => {
  const n = Number(val);
  moveQuantities.value[key] = !isNaN(n) && n >= 0 ? n : 0;
};

// Strict MOVE input handlers (digits only, clamp to row max)
const onMoveKeyDown = (e) => {
  // Allow navigation and editing keys
  const allowedKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Home','End',];
  if (allowedKeys.includes(e.key)) return;
  // Allow digits only
  if (/^\d$/.test(e.key)) return;
  // Block everything else (no minus, dot, comma, letters, etc.)
  e.preventDefault();
};

const onMovePaste = (e) => {
  const text = (e.clipboardData || window.clipboardData).getData('text');
  if (!/^\d+$/.test(text)) {
    e.preventDefault();
  }
};

const onMoveInputFrom = (row, e) => {
  const key = row.__rowKey;
  // Keep digits only
  const raw = String(e.target.value || '');
  const digits = raw.replace(/\D+/g, '');
  let n = digits === '' ? 0 : Number(digits);
  const max = Number(row.qty || 0);
  if (n > max) n = max;
  moveQuantities.value[key] = n;
  // Reflect sanitized value back to input
  e.target.value = String(n);
};

// Grouping logic: group by storage+name for groupable types, or all if groupAll is on
const isGroupable = (item) => {
  if (groupAll.value) return true;
  const name = (item?.item_name || '').toLowerCase();
  return name.includes('sticker') || name.includes('souvenir package') || name.includes('case');
};

const groupedItems = computed(() => {
  const map = new Map();
  for (const it of items.value) {
    const groupable = isGroupable(it);
    const storageKey = it.__storageId ?? 'inv';
    const nameKey = it.item_name || '';
    const key = groupable ? `${storageKey}|${nameKey}` : (it.item_id || `${storageKey}|${nameKey}|${Math.random()}`);

    if (groupable) {
      if (!map.has(key)) {
        const rep = { ...it };
        rep.qty = 1;
        rep.__rowKey = key;
        rep.__isGrouped = true;
        map.set(key, rep);
        // Do not auto-select; leave moveQuantities undefined until user types
      } else {
        const rep = map.get(key);
        rep.qty += 1;
      }
    } else {
      const repKey = it.item_id || key;
      const rep = { ...it, qty: 1, __rowKey: repKey, __isGrouped: false };
      map.set(repKey, rep);
      // Do not auto-select; leave moveQuantities undefined until user types
    }
  }
  return Array.from(map.values());
});

onMounted(async () => {
  try{
    const response = await axios.get('http://localhost:3000/api/check');
    if (response.data.isConnected) {
      await fetchInventory(); // fetch to populate storages list on mount
    } else {
      router.push({ name: 'login' });
    }
  }
  catch (error){
    router.push({ name: 'login' });
  }
  
});

const fetchInventory = async () => {
  try {
    isLoading.value = true;
    const response = await axios.get('http://localhost:3000/api/inventory');
    allInventory.value = [...response.data.data].reverse();

    allInventory.value.forEach((item) => {
      let itemName = item.item_name.replace('StatTrak™ ', '');
      itemName = itemName.replace("Souvenir ", "");
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
      if (itemName == "Storage Unit"){
        console.log(item);
      }
      
    });

  } catch (error) {
    console.error('Error fetching inventory:', error);
  } finally {
    isLoading.value = false;
  }
};

// Selected storages state
const selectedStorageIds = ref(new Set());

const isStorageSelected = (storage) => {
  return selectedStorageIds.value.has(storage.item_id);
};

const toggleStorage = async (storage) => {
  const storageId = storage.item_id;
  const storageName = displayStorageName(storage);
  
  if (selectedStorageIds.value.has(storageId)) {
    // Deselect: remove items from this storage
    items.value = items.value.filter(i => i.__storageId !== storageId);
    // Update selection set (reassign to trigger reactivity)
    const next = new Set(selectedStorageIds.value);
    next.delete(storageId);
    selectedStorageIds.value = next;
    return;
  }

  try {
    isLoading.value = true;
    console.log(storageId);
    const response = await axios.get('http://localhost:3000/api/getStorageContents', {
          params: { casketId: storageId }
    });
    console.log(response);
    const storageItems = Array.isArray(response.data?.data) ? response.data.data : [];
    // If API returns casket_id, use it to filter; otherwise, use all items (they belong to this casket by context)
    const hasCasketField = storageItems.some((it) => it && it.casket_id != null);
    const itemsForThisStorage = hasCasketField
      ? storageItems.filter((item) => String(item.casket_id) === String(storageId))
      : storageItems;

    const processed = itemsForThisStorage.map((item) => {
      let itemName = (item.item_name || '').replace('StatTrak™ ', '').replace('Souvenir ', '');
      const collection = tradeUpInstance.directory[itemName];
      if (collection) {
        item.collection = collection;
      }
      try {
        item.imageURL = tradeUpInstance.collections[collection][itemName]["imageURL"];
      } catch (e) {
        item.imageURL = "";
      }
      if (!Array.isArray(item.stickers)) item.stickers = [];
      // Mark storage metadata
      item.__storageId = item.casket_id ?? storageId;
      item.__storageName = storageName;
      return item;
    });

    items.value = items.value.concat(processed);
    const next = new Set(selectedStorageIds.value);
    next.add(storageId);
    selectedStorageIds.value = next;
  } catch (error) {
    console.error('Error fetching storage contents:', error);
  } finally {
    isLoading.value = false;
  }
};
const toggleGroupAll = () => {
  groupAll.value = !groupAll.value;
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

// Placeholder: move items from storage to inventory (single row) - to be implemented later
const onMoveClick = (row) => {
  const key = row.__rowKey;
  const qty = Math.max(1, Math.min(Number(moveQuantities.value[key] || 1), Number(row.qty || 1)));
  console.log('Move requested:', { storageId: row.__storageId, item_name: row.item_name, qty, row });
  // TODO: implement backend call to transfer items from storage
};

// Click on ADD column: set the MOVE input to max available for that row
const onMaxClick = (row) => {
  const key = row.__rowKey;
  moveQuantities.value[key] = Number(row.qty || 1);
};

// Selected to move: reactive list and total count (sum of quantities)
const selectedToMove = computed(() => {
  return groupedFilteredItems.value
    .map((row) => {
      const key = row.__rowKey;
      const qty = Number(moveQuantities.value[key] || 0);
      if (qty > 0 && qty <= Number(row.qty || 1)) {
        return { storageId: row.__storageId, item_name: row.item_name, qty, row };
      }
      return null;
    })
    .filter(Boolean);
});

const selectedCount = computed(() => selectedToMove.value.reduce((sum, x) => sum + x.qty, 0));

// Build backend payload: { [storageId]: [itemId, ...] }
const buildTransferPayload = () => {
  const map = {};
  for (const sel of selectedToMove.value) {
    const storageId = sel.storageId;
    const desired = sel.qty;
    // Find matching individual items for this row
    const candidates = items.value.filter((it) =>
      String(it.__storageId) === String(storageId) && it.item_name === sel.item_name
    );
    const ids = candidates.slice(0, desired).map((it) => it.item_id);
    if (!map[storageId]) map[storageId] = [];
    map[storageId].push(...ids);
  }
  return map;
};

const moveSelected = () => {
  const payload = buildTransferPayload();
  console.log('Move selected requested (by storage -> item_ids):', payload);
  // TODO: batch transfer logic later
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
  let result = [...groupedFilteredItems.value];
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

    if (sortKey.value === '__storageName') {
      aValue = (a.__storageName || '').toLowerCase();
      bValue = (b.__storageName || '').toLowerCase();
    }
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

// Group filtered items for display
const groupedFilteredItems = computed(() => {
  const map = new Map();
  for (const it of filteredItems.value) {
    const groupable = isGroupable(it);
    const storageKey = it.__storageId ?? 'inv';
    const nameKey = it.item_name || '';
    const key = groupable ? `${storageKey}|${nameKey}` : (it.item_id || `${storageKey}|${nameKey}|${Math.random()}`);

    if (groupable) {
      if (!map.has(key)) {
        const rep = { ...it };
        rep.qty = 1;
        rep.__rowKey = key;
        rep.__isGrouped = true;
        map.set(key, rep);
        if (moveQuantities.value[rep.__rowKey] == null) moveQuantities.value[rep.__rowKey] = 0;
      } else {
        const rep = map.get(key);
        rep.qty += 1;
      }
    } else {
      const repKey = it.item_id || key;
      const rep = { ...it, qty: 1, __rowKey: repKey, __isGrouped: false };
      map.set(repKey, rep);
      if (moveQuantities.value[rep.__rowKey] == null) moveQuantities.value[rep.__rowKey] = 0;
    }
  }
  return Array.from(map.values());
});

// Storage units list (from full inventory, not the displayed list)
const storages = computed(() => allInventory.value.filter(i => i.item_name === 'Storage Unit'));

// Display name helper for storages
const displayStorageName = (item) => {
  const name = item?.item_customname?.toString().trim();
  return name && name.length > 0 ? name : 'Storage Unit';
};
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
  max-height: calc(100vh - 232px);
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
}

/* Center all columns except the first (ITEM) */
th:not(:first-child),
td:not(:first-child) {
  text-align: center;
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
.small-icon {
  width: 14px;
  height: 14px;
  vertical-align: middle;
  margin-left: 6px;
  opacity: 0.9;
}
.action-icon.remove {
  filter: invert(17%) sepia(94%) saturate(7480%) hue-rotate(-5deg) brightness(107%) contrast(116%);
}

.float-selector-icon {
  width: 18px;
  height: 18px;
  filter: invert(1);
}

.float-selector-button:hover .float-selector-icon {
  filter: invert(1) brightness(1.2);
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

/* Modern darker input for MOVE */
.move-input {
  width: 56px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid #555;
  background-color: #222;
  color: #eee;
  text-align: center; /* center number inside input */
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.move-input:focus {
  border-color: #88aaff;
  box-shadow: 0 0 0 2px rgba(136, 170, 255, 0.2);
}

/* Remove native number spinners */
.move-input::-webkit-outer-spin-button,
.move-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.move-input[type=number] {
  appearance: textfield;
  -moz-appearance: textfield;
}

/* Toolbar buttons */
.move-selected-btn, .group-toggle-btn {
  margin-left: 8px;
  padding: 0px 10px;
  background: #2c2c2c;
  color: #eee;
  border: 1px solid #555;
  border-radius: 6px;
  cursor: pointer;
}
.move-selected-btn:hover, .group-toggle-btn:hover {
  background: #353535;
}
.group-toggle-btn.active {
  border-color: #88aaff;
  box-shadow: 0 0 0 2px rgba(136, 170, 255, 0.2);
}

/* Storages (inline) */
.storages {
  padding: 6px 10px;
  background-color: #222;
  border-top: 1px solid #555;
}

.storages-title {
  color: #fff;
  font-size: 16px;
  margin-bottom: 10px;
}

.storages-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.storage-card {
  background-color: #333;
  border: 1px solid #555;
  border-radius: 6px;
  padding: 10px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  cursor: pointer;
}

.storage-card--selected {
  border-color: #82b1ff;
  box-shadow: 0 0 0 1px #82b1ff inset;
  background-color: #2c2c2c;
}

.storage-thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  background-color: #444;
  border: 1px solid #666;
  flex: 0 0 auto;
}

.storage-thumb .storage-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.storage-info {
  display: flex;
  flex-direction: column;
  min-width: 0; /* allow text truncation */
}

.storage-name {
  font-size: 14px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.storage-count {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}
</style>
