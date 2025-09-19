<template>
    <div class="sidebar">
      <h2>TradeUp App</h2>
      
      <button @click="goTo('/tradeups')" class="centered-button">
        <img src="@/assets/images/hand-tools.png" alt="Add" class="action-icon"/> Trade Up
      </button>
      <button @click="goTo('/transfer-from')" class="centered-button">
        <img src="@/assets/images/arrow-from.png" alt="Add" class="action-icon"/>Transfer From
      </button>
      <button @click="goTo('/transfer-to')" class="centered-button">
        <img src="@/assets/images/arrow-to.png" alt="Add" class="action-icon"/>Transfer To
      </button>
      <button @click="logout()" class="centered-button">
        <img src="@/assets/images/logout.png" alt="Add" class="action-icon"/> Logout
      </button>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router';
  import axios from 'axios';

  const router = useRouter();
  
  const goTo = (path) => {
    router.push(path);
  };
  
  const logout = async () => {
    const response = await axios.post('http://localhost:3000/api/logout');
    if (response.data.successful) {
      router.push('/login');
    }
    else{
      alert('Something went wrong');
    }
    
  };
  </script>
  
  <style scoped>
  .sidebar {
    width: 250px;
    height: 100vh;
    background-color: #222;
    color: white;
    padding: 5px 20px;
    display: flex;
    flex-direction: column;
    border-right: white;
  }
  .centered-button {
  display: flex;
  align-items: center;
  gap: 10px;
}
  .action-icon{
    width: 20px;
    filter: invert(1);
  }
  button {
    margin: 10px 0;
    padding: 10px;
    width: 100%;
    border-radius: 5px;
    background: #555;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 14px;;
  }
  
  button:hover {
    background: #777;
  }
  </style>
  