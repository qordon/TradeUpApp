<template>
  <div class="trade-up-panel">
    <div class="panel-header">
      <button @click="clearItems" style="margin-right: 5px;">
        <img  src="@/assets/images/trash.png" alt="Remove" class="action-icon remove"/>
      </button>
      <button class="edit" @click="review">
          Review
      </button>
      <div :class="{'header-info-green': itemsToTradeUp.length === 10}" class="header-info">
        <span>{{ itemsToTradeUp.length }} / 10</span>
      </div>
    </div>
    <h5>Items in trade-up</h5>
    <div class="items-list scrollable">
      
      <div v-if="itemsToTradeUp.length === 0" class="empty-item">
        <span>No Items Added</span>
      </div>
      <div v-for="(item, index) in itemsToTradeUp" :key="item.id" class="item">
        <div class="item-controls">
          <div v-if="index > 0" @click="moveUp(index)" class="move-btn up">▲</div>
          <!-- <button v-if="index > 0" @click="moveUp(index)" class="move-btn up" style="border: 1px solid green;">▲</button> -->
          <span class="item-index">{{ index + 1 }}</span>
          <div v-if="index < itemsToTradeUp.length - 1" @click="moveDown(index)" class="move-btn down">▼</div>
          <!-- <button v-if="index < itemsToTradeUp.length - 1" @click="moveDown(index)" class="move-btn down"></button> -->
        </div>
        <div class="item-details">
          <span class="item-name">{{ item.item_name }}</span>
          <span class="item-wear" @click="copyText(item.item_paint_wear)">{{ item.item_paint_wear }}</span>
        </div>
        <button class="del-btn" @click="removeItem(index)">
          <img  src="@/assets/images/trash.png" alt="Remove" class="action-icon remove"/>
        </button>
      </div>
    </div>
    <div class="resizer" @mousedown="startResizing"></div>
    <h5>Possible Outcomes</h5>
    <div class="outcome-list scrollable">
      
      <div v-if="outcomes.length === 0" class="empty-item">
        <span>No Items Added</span>
      </div>
      <div v-for="(outcome, index) in outcomes" :key="index" class="outcome">
        <div class="outcome-header">
          <span class="outcome-name">{{ outcome.item_name }}</span>
        </div>
        <div class="outcome-footer">
          <span class="float-chance">{{ outcome.float_chance }}</span>
          <span class="percentage">{{ outcome.percentage }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

const emit = defineEmits();

const props = defineProps({
  itemsToTradeUp: Array,
  outcomes: Array,
});
const copyText = async (textToCopy) => {
  try {

    await navigator.clipboard.writeText(textToCopy);

  } catch (err) {
  }
};

const clearItems = () => {
  emit('clear-tradeup-items');
}

const removeItem = (index) => {
  emit('remove-tradeup-item', index);
}
const swapItems = (i, j) => {
  emit('swap-items', i, j);
  
}
const moveUp = (index) => {
  if (index > 0) {
    swapItems(index, index - 1);
  }
}
const moveDown = (index) => {
  if (index < props.itemsToTradeUp.length - 1) {
    swapItems(index, index + 1);
  }
}
const review = () =>{
  emit('review');
};
</script>

<style scoped>
.trade-up-panel {
  width: 300px;
  height: 100vh;
  background-color: #1e1e1e;
  color: #fff;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  border-left: 2px solid #555;
}

.panel-header {
  display: flex;
  align-items: center;
  height: 80px;
}

h4 {
  margin: 0;
  font-size: 20px;
}

button {
  padding: 8px 12px;
  background-color: #444;
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 5px;
}

button:hover {
  background-color: #666;
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  padding-right: 10px;
  margin-left: auto;
}
.header-info-green {
  color: green;
  border: 1px dashed green;
  padding: 7px 10px;
  border-radius: 10px;
}
.drag-handle {
  cursor: grab;
  padding: 5px;
  margin-right: 10px;
  font-size: 18px;
}
.items-list,
.outcome-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow-y: auto;
  align-items: stretch;
}
.items-list{
  margin-bottom: 10px;
}
.item-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 0px;
  width: 15px;
}

.move-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 10px;
  color: white;
  opacity: 0;
  padding: 0;
  transition: opacity 0.2s;
  line-height: 1;
}
.item:hover .move-btn {
  opacity: 1;
}
.move-btn:hover {
  color: #777;
  transition: color 0.2s;
}


.scrollable::-webkit-scrollbar {
  width: 8px;
}

.scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.scrollable::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 4px;
}

.scrollable::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.6);
}

.item {
  background-color: #333;
  padding: 5px 10px;
  padding-right: 5px;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}

.item-image {
    width: 40px;
    height: auto;
    vertical-align: middle;
}

.empty-item {
  background-color: #333;
  padding: 10px;
  border: 2px dashed #888;
  border-radius: 5px;
  text-align: center;
}

.outcome {
  margin-bottom: 5px;
  background-color: #444;
  padding: 10px;
  padding-right: 5px;
  border-radius: 5px;
}

.outcome-header {
  margin-bottom: 5px;
}

.outcome-name {
  font-size: 14px;
  font-weight: normal;
}

.outcome-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #bbb;
}

.float-chance,
.percentage {
  font-size: 12px;
}

h5 {
  margin: 0px;
  font-size: 16px;
  font-weight: normal;
  padding: 0px;
}

.item-index {
  font-size: 18px;
  font-weight: bold;
  padding: 0px;
  line-height: 1;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-left: 10px;
}

.item-name {
  font-size: 14px;
  font-weight: normal;
}

.item-wear {
  font-size: 12px;
  color: #bbb;
}
.item-wear:hover {
  cursor: pointer;
}
.del-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
}

.action-icon {
  width: 20px;
  height: 20px;
  filter: invert(1);
}

.action-icon.remove {
  filter: invert(17%) sepia(94%) saturate(7480%) hue-rotate(-5deg) brightness(107%) contrast(116%);
}

.edit {
  padding: 11.5px 10px;
}
</style>
