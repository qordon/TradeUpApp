<template>
  <div v-if="isOpen" class="roulette-overlay" @click="handleOverlayClick">
    <div v-if="!skinVisible" class="case-opening-container">
      <div class="case-track" :style="containerStyle">
        <div
          v-for="(item, index) in items"
          :key="index"
          class="case-item"
        >
          <img :src="item.imageURL" :alt="item.name" class="case-item-image" />
        </div>
      </div>
    </div>
    <transition name="fade">
      <div v-if="skinVisible" class="skin-popup">
        <img :src="outcome.imageURL" alt="Skin" class="skin-image" />
        <div class="skin-details">
          <h3>{{ outcome.item_name }} | ({{ outcome.item_wear_name }})</h3>
          <p>{{ outcome.item_paint_wear }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from "vue";

const props = defineProps({
  possibleOutcomes: Array,
  outcome: Object,
  isOpen: Boolean,
});

const items = ref([]);
const containerMargin = ref("0px");
const skinVisible = ref(false);

const emit = defineEmits(["close"]);


let timeoutSpinning;
let timeoutShowing

const containerStyle = computed(() => ({
  marginLeft: containerMargin.value,
}));

function rouletteSelection(items) {
  let totalWeight = items.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
  let randomValue = Math.random() * totalWeight;
  let cumulative = 0;
  for (let item of items) {
    cumulative += parseFloat(item.percentage);
    if (randomValue <= cumulative) {
      return item;
    }
  }
}

const generate = async () => {
  containerMargin.value = "";
  items.value = [];

  for (let i = 0; i < 40; i++) {
    items.value.push(rouletteSelection(props.possibleOutcomes));
  }
  console.log(props.outcome);
  items.value[36] = props.outcome;
  console.log(items.value);
  await nextTick(); 
  timeoutSpinning = setTimeout(() => {

    let rand = Math.abs(Math.cos(Math.random() * Math.PI));
    let scaled = rand * ((-5001) - (-5148)) + (-5150);
    const randomNumber = Math.round(scaled);
    console.log(randomNumber);
    containerMargin.value = randomNumber + "px";

    timeoutShowing= setTimeout(() => {
      skinVisible.value = true;
    }, 7200);
  }, 100);
  
};

const handleOverlayClick = () => {
  clearTimeout(timeoutSpinning);
  clearTimeout(timeoutShowing);
  skinVisible.value = false;
  emit("close");
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    generate();
  }
});

onUnmounted(() => {
  clearTimeout(timeoutSpinning);
  clearTimeout(timeoutShowing);
  skinVisible.value = false;
});
</script>

<style scoped>
.roulette-overlay {
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

.case-opening-container {
  width: 800px;
  overflow: hidden;
  display: flex;
  position: relative;
  background-color: gray;
  padding: 5px 0px;
  
}

.case-opening-container::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background-color: red;
  transform: translateX(-50%);
}

.case-track {
  display: flex;
  transition: all 8s cubic-bezier(.08, .6, 0, 1);
}

.case-item {
  width: 150px;
  flex-shrink: 0;
  border-left: 1px solid gray;
  padding: 5px;
  background: white;
  text-align: center;
  background: linear-gradient(180deg, #0f1923, #1c2b3a);
}

.case-item-image {
  width: 100%;
  height: auto;
}

.skin-popup {
  background: #444;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.skin-image {
  width: 200px;
  height: auto;
  margin-bottom: 10px;
}

.skin-details h3 {
  color: white;
  margin-bottom: 5px;
}

.skin-details p {
  color: white;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 1s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

</style>
