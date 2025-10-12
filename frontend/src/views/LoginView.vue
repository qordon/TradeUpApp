<template>
    <div class="login-container">
      <h2 class="title">Connect from browser</h2>
      <p class="description">
        Finish your steam session on desktop. <br>
        Open the URL by clicking on the button. <br>
        You should be logged into the account you wish to connect TradeUp App with.<br>
        Paste the entire string below.
      </p>
      <div class="input-container">
        <input v-model="username" type="text" placeholder="Paste data" @keyup.enter="handleLogin" />
        <a href="https://steamcommunity.com/chat/clientjstoken" target="_blank">
            <button class="input-btn"><img src="@/assets/images/link.png" alt="Add" class="action-icon"/></button>
        </a>
      </div>
      <button class="signin-btn" @click="handleLogin" :disabled="isLoading">
        <span v-if="isLoading" class="loading-spinner"></span>

        <span v-else>Sign in</span>
      </button>
    </div>
  </template>
  
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const username = ref('');
const isLoading = ref(false);

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/check');
    if (response.data.isConnected) {
      router.push({ name: 'tradeups' });
    } else {
      router.push({ name: 'login' });
    }
  } catch (error) {
    console.error('Error during connection check:', error);
  }
});

const handleLogin = async () => {
  // Prevent double/triple submissions
  if (isLoading.value) return;
  isLoading.value = true;
  let chat_clientjstoken = null;
  try {
      chat_clientjstoken = JSON.parse(username.value);
  } catch (error) {
      alert("Invalid format. Please paste the whole JSON from Steam.");
      isLoading.value = false;
      return;
  }

  const requiredKeys = ["logged_in", "steamid", "accountid", "account_name", "token"];
  const objectKeys = Object.keys(chat_clientjstoken || {});
  const isValid = requiredKeys.every(key => objectKeys.includes(key));
  if (!isValid) {
      alert("Some keys are missing in JSON. Required: logged_in, steamid, accountid, account_name, token.");
      isLoading.value = false;
      return;
  }
  if (chat_clientjstoken.logged_in !== true) {
      alert("Steam session is not logged in. Make sure you're logged in on Steam in the browser.");
      isLoading.value = false;
      return;
  }

  try{
    const response = await axios.post('http://localhost:3000/api/login', chat_clientjstoken);
    // Success (200): { message: 'Successful login', data: ... }
    router.push({ name: 'tradeups' });
  }
  catch(error){
    // Show meaningful backend or network error messages
    const resp = error?.response;
    if (resp) {
      const msg = resp.data?.message || 'Login failed';
      const detail = resp.data?.error;
      alert(detail ? `${msg}: ${detail}` : msg);
    } else if (error?.message) {
      alert(`Network error: ${error.message}`);
    } else {
      alert("An unknown error occurred during login.");
    }
    console.error('Login error:', error);
  }
  finally {
    isLoading.value = false;
  }

};
</script>
  
  <style scoped>
  .login-container {
    padding: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 80vh;
    text-align: center;
    margin: 0 auto;
  }
  
  .title {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 10px;
    color: #ffffff;
  }
  
  .description {
    font-size: 14px;
    text-align: center;
    margin-bottom: 20px;
    color: #b0b0b0;
    max-width: 400px;
  }
  
  .input-container {
    display: flex;
    flex-direction: row;
    gap: 10px;
    width: 40%;
    align-items: center;
    font-size: 14px;
  }
  
  input {
    padding: 10px;
    font-size: 16px;
    width: 100%;
    border-radius: 8px;
    border: 1px solid #444;
    background-color: #3a3a3a;
    color: #fff;
  }
  
  .input-btn {
    width: 40px;
    height: 40px;
    font-size: 14px;
    background-color: #3a3a3a;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    justify-content: center; 
    align-items: center;
  }
  
  .input-btn:hover {
    background-color: #444;
  }
  .action-icon{
    width: 15px;
    filter: invert(0.5);
  }
  .signin-btn {
    padding: 10px 30px;
    font-size: 18px;
    background-color: #003366;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    width: 100%;
    max-width: 250px;
    margin-top: 20px;
  }
  
  .signin-btn:hover {
    background-color: #002244;
  }
  .loading-spinner {
  border: 4px solid transparent;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>