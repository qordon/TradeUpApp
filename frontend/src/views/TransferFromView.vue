<template>
  <div class="container">
    <div class="content">
      <h1>Transfer from</h1> 

      <div class="filters">
        <span @click="fetchInventory">Refresh</span> |
        <span @click="clearFilters">Clear Filters</span> |
        <span @click="toggleFilters">Options<span v-if="isFilterApplied">*</span></span> |
        <input type="text" v-model="searchQuery" placeholder="Search Items" /> |
        <span @click="toggleGroupAll" class="group-toggle-btn" :class="{ active: groupAll }">{{ groupAll ? 'UNGROUP' : 'GROUP' }}</span> |
        <span>
          {{ selectedCount }} items
          <img src="@/assets/images/exchange.png" alt="Selected" class="action-icon small-icon"/>
        </span> | 
        <span @click="moveSelected" class="move-selected-btn">EXTRACT</span>
       
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
          <h3>Souvenir</h3>
          <label>
            <input type="checkbox" v-model="selectedSouvenir" :value="true" />
            Souvenir
          </label>
          <label>
            <input type="checkbox" v-model="selectedSouvenir" :value="false" />
            No Souvenir
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
          <h3>Tradable</h3>
          <label>
            <input type="checkbox" v-model="selectedTradable" :value="true" />
            Tradable
          </label>
          <label>
            <input type="checkbox" v-model="selectedTradable" :value="false" />
            Not Tradable
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

      <div v-if="isLoading" style="padding-left: 5px;">Loading...</div>

      <div v-else class="inventory-list">
        <div v-if="storages.length" class="storages">
          <h2 class="storages-title">Storages</h2>
          <div class="storages-grid">
            <div
              v-for="(storage, idx) in storages"
              :key="storage.item_id || idx"
              :class="['storage-card', { 'storage-card--selected': isStorageSelected(storage), 'storage-card--loading': isStoragePending(storage) }]"
              @click.stop.prevent="toggleStorage(storage)"
              @dblclick.prevent
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
        <table>
          <thead>
            <tr style="padding-left: 5px;">
              <th @click="sortData('item_name')" style="width: 36%">
                ITEM
                <span v-if="sortKey === 'item_name'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('item_paint_wear')" style="width: 8%">
                FLOAT
                <span v-if="sortKey === 'item_paint_wear'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('collection')" style="width: 14%">
                COLLECTION
                <span v-if="sortKey === 'collection'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('stickers')" style="width: 12%">
                STICKERS
                <span v-if="sortKey === 'stickers'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('trade_unlock')" style="width: 9%">
                TRADABLE
                <span v-if="sortKey === 'trade_unlock'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('__storageName')" style="width: 8%">
                STORAGE
                <span v-if="sortKey === '__storageName'">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th @click="sortData('qty')" style="width: 4%; white-space: nowrap;">
                QTY
                <span v-if="sortKey === 'qty'" style="margin-left: 4px; display: inline-block;">
                  {{ sortOrder === 'asc' ? '▴' : (sortOrder === 'desc' ? '▾' : '↕') }}
                </span>
              </th>
              <th style="width: 6%">MOVE</th>
              <th style="width: 3%">MAX</th>
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
                <div v-if="(!item.__isGrouped || item.qty <= 1) && item.stickers.length > 0" class="stickers-images">
                  <div v-for="(sticker, idx) in item.stickers" :key="idx" class="sticker-container">
                    <img :src="sticker.stickerImageUrl" alt="s" class="sticker-image"/>
                  </div>
                </div>
              </td>
              <td>
                <template v-if="!item.__isGrouped">
                  {{ formatTradableDate(item.trade_unlock) }}
                </template>
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
                  />
                </div>
              </td>
              <td>
                <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                  <button @click="onMaxClick(item)" title="Fill max" class="max-btn"></button>
                  <!-- <button @click="onMaxClick(item)" title="Fill max">
                    <img src="@/assets/images/up-arrow.png" alt="Max" class="action-icon"/>
                  </button> -->
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <div v-if="isTransferModalOpen" class="modal-overlay" @click="onModalOverlayClick">
    <div class="modal-dialog" @click.stop>
      <div class="modal-header">
        <h3>Extracting Items</h3>
      </div>
      <div class="modal-body" v-if="transferPending">
        <div class="spinner"></div>
        <div>Processing your extract request...</div>
      </div>
      <div class="modal-body" v-else>
        <div v-if="transferError" class="error-text">{{ transferError }}</div>
        <div v-else>
          <div>Successful: <strong>{{ transferResult?.successCount || 0 }}</strong></div>
          <div>Failed: <strong>{{ transferResult?.failedCount || 0 }}</strong></div>
        </div>
      </div>
      <div class="modal-footer" v-if="!transferPending">
        <button class="move-selected-btn close-modal-btn" @click="closeTransferModal">CLOSE</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { tradeUps } from '../models/tradeUps';

const router = useRouter();
const items = ref([]);
const allInventory = ref([]);
const isLoading = ref(true);
// Inventory capacity restriction (Steam max 1000 items in inventory)
const INVENTORY_LIMIT = 1000;
const currentInventoryCount = ref(0);
const sortOrder = ref('default');
const sortKey = ref('item_name');
const searchQuery = ref('');
const activeItem = ref(null);

const showFilters = ref(false);
const selectedRarities = ref([]);
const selectedStatTrak = ref([]);
const selectedSouvenir = ref([]);
const selectedWearNames = ref([]);
const selectedCollections = ref([]);
const selectedTradable = ref([]);

// Float filters input (strings to allow typing '.' or ',')
const minFloatInput = ref('0');
const maxFloatInput = ref('1');
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

const rarityFilterTradeUp = ref(null);
const statTrakFilterTradeUp = ref(null);

const tradeUpInstance = new tradeUps();

const collections = ref([]);
collections.value = Object.keys(tradeUpInstance.collections);

// Group-all toggle (default: ungroup)
const groupAll = ref(false);

// Move quantities keyed by row key
const moveQuantities = ref({});
// Clear current selections whenever any filter input changes
watch(
  [
    () => searchQuery.value,
    () => selectedRarities.value,
    () => selectedStatTrak.value,
    () => selectedSouvenir.value,
    () => selectedWearNames.value,
    () => selectedCollections.value,
    () => selectedTradable.value,
    () => minFloatInput.value,
    () => maxFloatInput.value,
  ],
  () => {
    moveQuantities.value = {};
  },
  { deep: true }
);
const getMoveQty = (key) => {
  const v = moveQuantities.value[key];
  return (typeof v === 'number' && !isNaN(v)) ? String(v) : "0";
};
const setMoveQty = (key, val) => {
  const n = Number(val);
  moveQuantities.value[key] = !isNaN(n) && n >= 0 ? n : 0;
};

const onMoveInputFrom = (row, e) => {
  const key = row.__rowKey;
  // Keep digits only
  const raw = String(e.target.value || '');
  const digits = raw.replace(/\D+/g, '');
  let n = digits === '' ? 0 : Number(digits);
  const rowMax = Number(row.qty || 0);
  const current = Number(moveQuantities.value[key] || 0);
  // Remaining capacity excluding this row's current selection
  const remainingExcl = Math.max(0, INVENTORY_LIMIT - currentInventoryCount.value - (selectedCount.value - current));
  const cap = Math.max(0, Math.min(rowMax, remainingExcl));
  if (n > cap) n = cap;
  moveQuantities.value[key] = n;
  // Reflect sanitized value back to input
  e.target.value = String(n);
};

// Grouping logic: group by storage+name for groupable types, or all if groupAll is on
const isGroupable = (item) => {
  if (groupAll.value) return true;
  const name = (item?.item_name || '').toLowerCase();
  return name.includes('sticker') || name.includes('souvenir package') || 
         name.includes('case') || name.includes('patch');
};

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
    // Save current inventory count for capacity checks (includes Storage Units as items)
    currentInventoryCount.value = Array.isArray(allInventory.value) ? allInventory.value.length : 0;

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
// Track storages currently being fetched to prevent double clicks
const pendingStorageIds = ref(new Set());
const isStoragePending = (storage) => pendingStorageIds.value.has(storage.item_id);
// Non-reactive immediate guard to prevent race conditions on rapid double clicks
const inFlightStorageIds = new Set();

const toggleStorage = async (storage) => {
  const storageId = storage.item_id;
  const storageName = displayStorageName(storage);

  // Global guard: if a storage load is in progress, ignore further clicks
  if (isLoading.value) {
    return;
  }

  // Prevent double-click while a request for this storage is in-flight
  if (inFlightStorageIds.has(storageId) || pendingStorageIds.value.has(storageId)) {
    return;
  }
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
    // Mark immediately in non-reactive set to avoid race (only for load case)
    inFlightStorageIds.add(storageId);
    // Mark this storage as pending to block further clicks
    const nextPending = new Set(pendingStorageIds.value);
    nextPending.add(storageId);
    pendingStorageIds.value = nextPending;
    isLoading.value = true;
    const response = await axios.get('http://localhost:3000/api/getStorageContents', {
          params: { casketId: storageId }
    });
    const storageItems = Array.isArray(response.data?.data) ? response.data.data : [];
    console.log(storageItems);
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
    // Clear pending flag for this storage
    const clearPending = new Set(pendingStorageIds.value);
    clearPending.delete(storageId);
    pendingStorageIds.value = clearPending;
    inFlightStorageIds.delete(storageId);
    isLoading.value = false;
  }
};
const toggleGroupAll = () => {
  moveQuantities.value = {};
  groupAll.value = !groupAll.value;
};
const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};
const clearFilters = () => {
  searchQuery.value = '';
  selectedRarities.value = [];
  selectedStatTrak.value = [];
  selectedSouvenir.value = [];
  selectedWearNames.value = [];
  selectedCollections.value = [];
  minFloatInput.value = '0';
  maxFloatInput.value = '1';
};

// Click on MAX column: set the MOVE input to the maximum allowed respecting capacity
const onMaxClick = (row) => {
  const key = row.__rowKey;
  const rowMax = Number(row.qty || 1);
  const current = Number(moveQuantities.value[key] || 0);
  // Remaining capacity excluding this row's current selection
  const remainingExcl = Math.max(0, INVENTORY_LIMIT - currentInventoryCount.value - (selectedCount.value - current));
  const cap = Math.max(0, Math.min(rowMax, remainingExcl));
  moveQuantities.value[key] = cap;
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
// Remaining capacity for extraction to inventory
const remainingCapacity = computed(() => Math.max(0, INVENTORY_LIMIT - currentInventoryCount.value - selectedCount.value));

const buildTransferPayload = () => {
  const map = {};
  const usedIds = new Set();

  selectedToMove.value.forEach(sel => {
    const storageId = sel.storageId;
    if (!storageId) return;

    const desiredQty = sel.qty || 0;
    if (desiredQty <= 0) return;

    // If user selected a specific ungrouped row (qty === 1), use its exact item_id like in TransferToView
    if (
      desiredQty === 1 &&
      sel.row &&
      sel.row.__isGrouped === false &&
      sel.row.item_id &&
      !usedIds.has(sel.row.item_id)
    ) {
      if (!map[storageId]) map[storageId] = [];
      map[storageId].push(sel.row.item_id);
      usedIds.add(sel.row.item_id);
      return;
    }

    // Prefer exact IDs from this grouped row when available
    let ids = [];
    if (sel.row.__isGrouped && Array.isArray(sel.row.__ids)) {
      ids = sel.row.__ids.filter((id) => !usedIds.has(id)).slice(0, desiredQty);
    } else {
      // Fallback: pick candidates from the same storage and with the same item name and wear
      const candidates = items.value.filter(it =>
        String(it.__storageId) === String(storageId) &&
        it.item_name === sel.item_name &&
        it.item_wear_name === sel.row.item_wear_name &&
        !usedIds.has(it.item_id)
      );
      ids = candidates.slice(0, desiredQty).map(it => it.item_id);
    }

    ids.forEach(id => usedIds.add(id));

    if (ids.length > 0) {
      if (!map[storageId]) map[storageId] = [];
      map[storageId].push(...ids);
    }
  });

  return map;
};


// Modal state and extract action
const isTransferModalOpen = ref(false);
const transferPending = ref(false);
const transferResult = ref(null);
const transferError = ref(null);

const closeTransferModal = () => {
  isTransferModalOpen.value = false;
};

const onModalOverlayClick = () => {
  if (!transferPending.value) {
    closeTransferModal();
  }
};

const moveSelected = () => {
  const payload = buildTransferPayload();
  const allIdsCount = Object.values(payload).reduce((sum, arr) => sum + arr.length, 0);
  if (allIdsCount === 0) return;

  // Capacity guard: ensure we won't exceed 1000 in inventorybut in
  if (currentInventoryCount.value + selectedCount.value > INVENTORY_LIMIT) {
    // Clamp all inputs would be ideal; here we just block and inform user in modal
    isTransferModalOpen.value = true;
    transferPending.value = false;
    transferResult.value = null;
    transferError.value = `Not enough capacity. Remaining: ${Math.max(0, INVENTORY_LIMIT - currentInventoryCount.value)} items.`;
    return;
  }

  isTransferModalOpen.value = true;
  transferPending.value = true;
  transferResult.value = null;
  transferError.value = null;

  axios.post('http://localhost:3000/api/transferFromStorage', payload)
    .then((resp) => {
      transferResult.value = resp?.data || { successCount: 0, failedCount: 0 };
      // Optimistically update UI: remove extracted items from the displayed list
      const removeSet = new Set(
        Object.values(payload).flat().map((id) => String(id))
      );
      items.value = items.value.filter((it) => !removeSet.has(String(it.item_id)));
      // Update inventory count locally so capacity checks remain accurate until refresh
      try {
        currentInventoryCount.value = Number(currentInventoryCount.value || 0) + removeSet.size;
      } catch (_) { /* noop */ }
    })
    .catch((err) => {
      console.error('Extract error:', err);
      transferError.value = err?.response?.data?.message || err?.message || 'Unknown error';
    })
    .finally(() => {
      transferPending.value = false;
      fetchInventory()
        .then(() => {
          // Explicitly clear any current MOVE selections
          moveQuantities.value = {};
        })
        .catch((e) => console.error('Refresh inventory after move failed:', e));
    });
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
  // Map image URLs for items and stickers (fallbacks similar to TransferToView)
  result = result.map(item => {
    const hasImage = item.imageURL && String(item.imageURL).trim() !== '';
    const finalImageURL = hasImage
      ? item.imageURL
      : (item.item_url
          ? `https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/${item.item_url}_png.png`
          : (item.imageURL || ''));

    let updatedStickers = Array.isArray(item.stickers) ? item.stickers : [];
    if (updatedStickers.length > 0) {
      updatedStickers = updatedStickers.map(sticker => {
        const existing = sticker.stickerImageUrl && String(sticker.stickerImageUrl).trim() !== '' ? sticker.stickerImageUrl : null;
        const direct = sticker.imageURL && String(sticker.imageURL).trim() !== '' ? sticker.imageURL : null;
        const directAlt = sticker.url && String(sticker.url).trim() !== '' ? sticker.url : null;
        const fallback = sticker.sticker_url
          ? `https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/${sticker.sticker_url}_png.png`
          : null;
        const finalStickerURL = existing || direct || directAlt || fallback || '';
        return { ...sticker, stickerImageUrl: finalStickerURL };
      });
    }

    return { ...item, imageURL: finalImageURL, stickers: updatedStickers };
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

    if (sortKey.value === 'item_paint_wear') {
      const aNumRaw = typeof a.item_paint_wear === 'number' ? a.item_paint_wear : parseFloat(a.item_paint_wear);
      const bNumRaw = typeof b.item_paint_wear === 'number' ? b.item_paint_wear : parseFloat(b.item_paint_wear);
      const aNum = Number.isFinite(aNumRaw) ? aNumRaw : (sortOrder.value === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
      const bNum = Number.isFinite(bNumRaw) ? bNumRaw : (sortOrder.value === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
      if (aNum !== bNum) return sortOrder.value === 'asc' ? aNum - bNum : bNum - aNum;
      // tie-breaker for stability
      const aName = (a.item_name || '').toLowerCase();
      const bName = (b.item_name || '').toLowerCase();
      if (aName < bName) return -1;
      if (aName > bName) return 1;
      return 0;
    }
    if (sortKey.value === 'trade_unlock') {
      const aTimeRaw = Date.parse(a.trade_unlock);
      const bTimeRaw = Date.parse(b.trade_unlock);
      const aTime = Number.isFinite(aTimeRaw) ? aTimeRaw : (sortOrder.value === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
      const bTime = Number.isFinite(bTimeRaw) ? bTimeRaw : (sortOrder.value === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
      if (aTime !== bTime) return sortOrder.value === 'asc' ? aTime - bTime : bTime - aTime;
      const aName = (a.item_name || '').toLowerCase();
      const bName = (b.item_name || '').toLowerCase();
      if (aName < bName) return -1;
      if (aName > bName) return 1;
      return 0;
    }
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
    const matchesSouvenir = selectedSouvenir.value.length === 0 || selectedSouvenir.value.includes(item.item_name.includes("Souvenir "));
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
    const tradable = isItemTradable(item.trade_unlock);
    const matchesTradable = selectedTradable.value.length === 0 || selectedTradable.value.includes(tradable);
    return matchesRarity && matchesStatTrak && matchesSouvenir && matchesWear && matchesCollections && matchesFloat && matchesTradable;
  });
});

// Group filtered items for display
const groupedFilteredItems = computed(() => {
  const map = new Map();
  for (const it of filteredItems.value) {
    const groupable = isGroupable(it);
    const storageKey = (it.__storageId != null) ? String(it.__storageId) : 'inv';
    const nameKey = it.item_name || '';
    const wearKey = it.item_wear_name || '';
    const key = groupable ? `${storageKey}|${nameKey}|${wearKey}` : (it.item_id || `${storageKey}|${nameKey}|${wearKey}|${Math.random()}`);

    if (groupable) {
      if (!map.has(key)) {
        const rep = { ...it };
        rep.qty = 1;
        rep.__rowKey = key;
        rep.__isGrouped = true;
        // Track exact item IDs for this group in stable order
        rep.__ids = [];
        if (it.item_id != null) rep.__ids.push(it.item_id);
        map.set(key, rep);
        if (moveQuantities.value[rep.__rowKey] == null) moveQuantities.value[rep.__rowKey] = 0;
      } else {
        const rep = map.get(key);
        rep.qty += 1;
        if (it.item_id != null && Array.isArray(rep.__ids)) rep.__ids.push(it.item_id);
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
      selectedSouvenir.value.length > 0 ||
      selectedWearNames.value.length > 0 ||
      selectedCollections.value.length > 0 ||
      selectedTradable.value.length > 0 ||
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

const formatTradableDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d)) return '';
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

const isItemTradable = (isoString) => {
  if (!isoString) return true;
  const t = Date.parse(isoString);
  if (!Number.isFinite(t)) return true;
  return t <= Date.now();
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
  border-top: 1px solid #555;
  border-bottom: 1px solid #555;
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
  max-height: calc(100vh - 100px);
  overflow-y: auto;
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
  padding: 8px 5px;
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
  top: 0; 
  z-index: 1; 
  cursor: pointer;
}
tbody {
  border: none;
  overflow-y: hidden;
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
  flex-wrap: nowrap; /* single row */
  align-items: center;
  justify-content: center;
  width: 100%;
}

.sticker-container {
  display: inline-flex;
  align-items: center;
}

.sticker-image {
  width: 45px;
  height: 45px;
  object-fit: contain;
  display: block;
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
  text-align: center;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.move-input:focus {
  border-color: #88aaff;
  box-shadow: 0 0 0 2px rgba(136, 170, 255, 0.2);
}

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
  padding: 3px 10px 6px 10px;
  background-color: #222;
  border-bottom: 1px solid #555;
}

.storages-title {
  color: #fff;
  font-size: 16px;
  margin-bottom: 5px;
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

/* Loading state: disable interactions and dim */
.storage-card--loading {
  opacity: 0.6;
  pointer-events: none;
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
  min-width: 0;
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

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-dialog {
  width: 360px;
  background: #222;
  border: 1px solid #555;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  overflow: hidden;
}
.modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid #444;
  background: #1a1a1a;
}
.modal-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid #444;
  display: flex;
  justify-content: flex-end;
  background: #1a1a1a;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #444;
  border-top-color: #88aaff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.error-text {
  color: #ff6b6b;
  text-align: center;
}
.close-modal-btn { padding: 3px 15px; }

.max-btn {
  width: 20px;
  height: 20px;
  background: url('@/assets/images/up-arrow.png') center/contain no-repeat;
  filter: invert(1);
  border: none;
  cursor: pointer;
}
</style>
