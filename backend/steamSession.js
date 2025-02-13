const fs = require('fs');
const path = require('path');
const SteamUser = require('steam-user');
const GlobalOffensive = require('globaloffensive');

class SteamSession {
  constructor() {
    this.user = new SteamUser();
    this.csgo = new GlobalOffensive(this.user);
    this.sessionActive = false;
    
    this.accountData = {};
    
    this.setupEventListeners();
  }

  saveInventoryToFile() {
    const inventoryPath = path.join(__dirname, 'data', 'inventory_js.json');
    const inventoryData = JSON.stringify(this.csgo.inventory, null, 2);

    if (!fs.existsSync(path.dirname(inventoryPath))) {
      fs.mkdirSync(path.dirname(inventoryPath), { recursive: true });
    }

    fs.writeFileSync(inventoryPath, inventoryData, (err) => {
      if (err) {
        console.error('Error saving inventory to file:', err);
      } else {
        console.log('Inventory saved to file.');
      }
    });
  }

  requireGCSession(method) {
    return function(...args) {
      if (!this.csgo.haveGCSession) {
        console.log('Does not connected to Game Coordinator');
        return;
      }
      return method.apply(this, args);
    };
  }

  setupEventListeners() {
    // this.csgo.on('disconnectedFromGC', (reason) => {
    //   console.log(`Disconnected from Game Coordinator due to ${reason}`);
    //   this.sessionActive = false;
    // });

    // this.user.on('disconnected', (eresult, msg) => {
    //   console.log(`Steam disconnected: ${eresult} - ${msg}`);
    //   this.sessionActive = false;
    // });

    this.csgo.on('error', (err) => {
      console.error('Error in CS:GO session:', err);
    });

    // this.csgo.on('itemAcquired', (item) => {
    //   console.log('Item acquired:', item);
    // });

    this.csgo.on('itemRemoved', (item) => {
      console.log('Item removed:', item);
    });

    // this.csgo.on('craftingComplete', (recipe, itemsGained) => {
    //   console.log(`Crafting complete. Recipe: ${recipe}, Items gained:`, itemsGained);
    // });
  }

  async login(loginOptionsLegacy) {
    return new Promise((resolve, reject) => {
        console.log("Start general login");
        this.user.logOn(loginOptionsLegacy);
    
        this.user.once('loggedOn', () => {
          console.log('Logged into Steam.');
          this.user.gamesPlayed([730]);
        });
    
        this.csgo.once('connectedToGC', () => {
          console.log('Connected to GC.');
          this.sessionActive = true;
          this.saveInventoryToFile();
          resolve({ status: 'loggedIn' });
        });
    
        this.user.once('error', (err) => reject(err));
        this.csgo.once('error', (err) => reject(err));
      });
  }

  logout(){
    if (this.isSessionActive()){

      this.user.gamesPlayed([]);
      this.user.logOff();
      if (!this.isSessionActive()){
        return {'successful': true};
      }
      else {
        return {'successful': false, 'message': 'Something went wrong'}
      }
            
    }
    else {
      return {'successful': false, 'message': 'Session already inactive'};
    }
  
  }

  isSessionActive() {
    return this.csgo.haveGCSession;
  }

  craft(items, recipe) {
    return new Promise((resolve, reject) => {
        if (!this.isSessionActive()) {
            console.log('Not connected to GC.');
            return reject({"error": "Not connected to GC"});
        }

        const timeout = setTimeout(() => {
            this.csgo.removeListener('itemAcquired', onCraftingComplete);
            reject({"error": "Crafting timeout"});
        }, 10000);

        const onCraftingComplete = (craftedItem) => {
            clearTimeout(timeout);
            this.csgo.removeListener('itemAcquired', onCraftingComplete);
            console.log(craftedItem);
            resolve(craftedItem);
        };

        this.csgo.once('itemAcquired', onCraftingComplete);

        try {
            this.csgo.craft(items, recipe);
        } catch (error) {
            clearTimeout(timeout);
            this.csgo.removeListener('itemAcquired', onCraftingComplete);
            reject(error);
        }
    });
  }

  addToCasket(casketId, itemId) {
    if (!this.sessionActive) return console.log('Not connected to GC.');
    this.csgo.addToCasket(casketId, itemId);
  }

  removeFromCasket(casketId, itemId) {
    if (!this.sessionActive) return console.log('Not connected to GC.');
    this.csgo.removeFromCasket(casketId, itemId);
  }

  getCasketContents(casketId, callback) {
    if (!this.sessionActive) return console.log('Not connected to GC.');
    this.csgo.getCasketContents(casketId, callback);
  }

  // Exposing a method to get the inventory from csgo.inventory
  getInventory() {
    if (this.isSessionActive()) {
      return this.csgo.inventory;
    } else {
      console.log('Not connected to Game Coordinator.');
      return [];
    }
  }
}

module.exports = new SteamSession();
