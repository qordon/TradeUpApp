<template>
  <div class="app-container">
    <Sidebar />

    <div class="main-content">
      <router-view />
    </div>
    
  </div>
</template>

<script setup>
import Sidebar from "@/components/Sidebar.vue";
</script>

<style scoped>

.app-container {
  display: flex;
}

.main-content {
  flex: 1;
  max-height: 100vh;
}
html, body, #app {
  height: 100%;
  margin: 0;
}
#app {
  display: flex;
  flex-direction: column;
}
</style>
