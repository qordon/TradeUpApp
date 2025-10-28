<template>
    <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-content">
            <button class="close-btn-top-right" @click="closeModal">X</button>
            <h2>Confirm Trade Up</h2>
            
            <div class="tradeup-container">

                <div class="items-container">
                    <h4>Input</h4>
                    <div style="display: flex; gap: 10px; display: grid;
    grid-template-columns: 1fr 1fr; width: 100%;">
                        <div class="column">
                            <div v-for="(item, index) in firstColumnItems" :key="'left-' + index" class="tradeup-item">
                                <div style="margin-right: 5px; width: 20px;" >{{ index + 1}}</div>
                                <div style="display: flex; flex-direction: column; align-items: flex-start;
                                margin-right: auto;">
                                    <div class="item-name">{{ item.item_name }}</div>
                                    <div class="small-text">{{ item.item_paint_wear }}</div>
                                </div>
                                
                            </div>
                        </div>
                        <div class="column">
                            <div v-for="(item, index) in secondColumnItems" :key="'right-' + index" class="tradeup-item">
                                <div style="margin-right: 5px; width: 20px;">{{ index + 6}}</div>
                                <div style="display: flex; flex-direction: column; align-items: flex-start;
                                margin-right: auto; width: 100%;">
                                    <div class="item-name">{{ item.item_name }}</div>
                                    <div class="small-text">{{ item.item_paint_wear }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="outcomes-container">
                    <h4>Possible outcomes</h4>
                    <div class="outcomes-list scrollable" style="overflow-y: auto; overflow-x: hidden; max-height: 320px;">
                        <div v-for="(outcome, index) in outcomes" :key="'outcome-' + index" class="outcome-item">
                            <div style="width: 100%;display: flex; justify-content: space-between;">
                                <span>{{ outcome.item_name }}</span>
                            </div>
                            <div style="width: 100%; display: flex; justify-content: space-between; gap: 5px;">
                                <div class="small-text">{{ outcome.float_chance }}</div>
                                <span class="small-text">{{ outcome.percentage }}%</span>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>

            <div class="confirmation">
                <input type="checkbox" id="confirm-checkbox" v-model="isConfirmed">
                <label for="confirm-checkbox">I confirm this trade-up and understand all consequences</label>
            </div>

            <button class="confirm-btn" :disabled="!isConfirmed" @click="confirmTradeUp">Confirm</button>
            <button class="close-btn" @click="closeModal">Cancel</button>
        </div>
    </div>
</template>

<script setup>
import { computed, defineProps, defineEmits, ref } from 'vue';

const props = defineProps({
    isOpen: Boolean,
    itemsToTradeUp: Array,
    outcomes: Array
});

const emit = defineEmits(["close", "confirm-tradeup"]);

const isConfirmed = ref(false);

const firstColumnItems = computed(() => props.itemsToTradeUp.slice(0, 5));
const secondColumnItems = computed(() => props.itemsToTradeUp.slice(5, 10));

const confirmTradeUp = () => {
    isConfirmed.value = false;
    emit("confirm-tradeup");
};

const closeModal = () => {
    emit("close");
    isConfirmed.value = false;
};
const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
        closeModal();
    }
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
}
.close-btn-top-right {
    position: absolute;
    top: 10px;
    right: 10px;
    background: transparent;
    color: white;
    border: none;
    font-size: 20px;
    cursor: pointer;
}

.close-btn-top-right:hover {
    color: red;
}
.modal-content {
    position: relative;
    background: #222;
    color: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
}

.tradeup-container {
    display: flex;
    justify-content: space-between;
    margin: 5px 0;
    margin-bottom: 20px;
    gap: 20px;
}

.items-container {
    text-align: left;
    gap: 10px;
    align-items: left;
}

.column {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
}
.item-name {
    display: block;
    overflow: auto;
    white-space: normal;
}
.item-name{
    text-align: left;
}

.tradeup-item {
    display: flex;
    background: #333;
    padding: 10px;
    
    border-radius: 5px;
    text-align: center;
    border: 1px solid #555;
    justify-content: space-between;
    align-items: center;
}

.outcomes-container {
    text-align: left;
    gap: 5px;
}
.outcomes-list{
    display: flex;
    flex-direction: column;
    gap: 8px;
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

.outcome-item {
    background: #444;
    padding: 10px;
    padding-right: 5px;
    border-radius: 5px;
    border: 1px solid #666;
}

.small-text {
    font-size: 12px;
    color: #bbb;
    line-height: 1;
}

.confirmation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
}

.confirm-btn {
    background: green;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.confirm-btn:disabled {
    background: gray;
    cursor: not-allowed;
}

.close-btn {
    background: red;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-left: 10px;
}
h4 {
    margin-bottom: 10px;
    font-size: 18px;
}
</style>