const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const SteamSession = require('./steamSession');
const GlobalOffensive = require('globaloffensive');
const items = require('./utils');

const app = express();
app.use(express.json())
const port = 3000;
csgo_items = new items();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello from Node.js backend!');
});

app.get('/api/check', async (req, res) => {
  try {
    const isConnected = await SteamSession.isSessionActive();
    return res.status(200).json({"isConnected": isConnected});
  } catch {
    return res.status(501).json({"isConnected": false});
  }
});

app.post('/api/login', async (req, res) => {
  const { account_name, token, steamid } = req.body;

  var loginOptionsLegacy = { accountName: account_name, webLogonToken: token, steamID: steamid };
  try {
    const result = await SteamSession.login(loginOptionsLegacy);
    return res.status(200).json({ message: 'Successful login', data: result });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.toString() });
  }

});

app.get('/api/inventory', async (req, res) => {
  SteamSession.saveInventoryToFile();
  const inventoryPath = path.join(__dirname, 'data', 'inventory_js.json');

  if (!SteamSession.isSessionActive()) {
    return res.status(502).json({ message: 'Not connected to Game Coordinator' });
  }
  
  try {
    const data = fs.readFileSync(inventoryPath, 'utf8');
    const inventory = JSON.parse(data);
    let convertedInventory = csgo_items.inventoryConverter(inventory);
    return res.status(200).json({ message: 'Successful', data: convertedInventory });
  } catch (err) {
    console.error('Error reading or parsing file:', err);
    return res.status(500).json({ message: 'Error reading or parsing file', 
      error: err.toString() });
  }
});

app.get('/api/getStorageContents', async (req, res) => {
  if (!SteamSession.isSessionActive()) {
    return res.status(502).json({ message: 'Not connected to Game Coordinator' });
  }
  try{
    const casketId = req.query.casketId;
    const casketContents = await new Promise((resolve, reject) => {
      try {
        SteamSession.getCasketContents(casketId, (err, items) => {
          if (err) return reject(err);
          resolve(items);
        });
      } catch (e) {
        reject(e);
      }
    });
    // SteamSession.saveInventoryToFile();
    // const inventoryPath = path.join(__dirname, 'data', 'inventory_js.json');
    try {
      // const data = fs.readFileSync(inventoryPath, 'utf8');
      // const inventory = JSON.parse(data);
      let convertedInventory = csgo_items.inventoryConverter(casketContents, isCasket=true);
      // convertedInventory = convertedInventory.filter(item => item.casket_id === casketId);
      return res.status(200).json({ message: 'Successful login', data: convertedInventory });
    } catch (err) {
      console.error('Error getting casket contents', err);
      return res.status(500).json({ message: 'Getting items from storage failed', error: err.toString() });
    }
  } catch (err) {
    console.error('Error getting casket contents', err);
    return res.status(500).json({ message: 'Getting items from storage failed', error: err.toString() });
  }
  
});

app.post('/api/transferFromStorage', async (req, res) => {
  try {
    // Payload shape expected: { [casketId]: string[] }
    const body = req.body || {};
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ message: 'Payload must be an object { [casketId]: string[] }' });
    }
    const entries = Object.entries(body).filter(([, v]) => Array.isArray(v));
    if (entries.length === 0) {
      return res.status(400).json({ message: 'Invalid payload: expected { [casketId]: itemIds[] }' });
    }

    if (!SteamSession.isSessionActive()) {
      return res.status(502).json({ message: 'Not connected to Game Coordinator' });
    }

    // Helper: wait for a CasketRemoved notification from GC (single-shot with timeout)
    const waitForCasketRemoved = (timeoutMs = 3000) => {
      return new Promise((resolve) => {
        let finished = false;
        const done = (ok) => {
          if (finished) return;
          finished = true;
          try { SteamSession.csgo.removeListener('itemCustomizationNotification', onNotif); } catch {}
          clearTimeout(timer);
          resolve(ok);
        };

        const onNotif = (itemIds, notificationType) => {
          if (notificationType === GlobalOffensive.ItemCustomizationNotification.CasketRemoved) {
            done(true);
          }
        };

        const timer = setTimeout(() => done(false), timeoutMs);
        SteamSession.csgo.once('itemCustomizationNotification', onNotif);
      });
    };

    // Process all groups sequentially to avoid mixing notifications
    const results = [];
    for (const [casketId, ids] of entries) {
      for (const id of ids) {
        try {
          SteamSession.removeFromCasket(casketId, id);
          const ok = await waitForCasketRemoved();
          if (ok) {
            results.push({ casketId, itemId: id, success: true });
          } else {
            results.push({ casketId, itemId: id, success: false, error: 'Game Coordinator did not confirm removal (timeout)' });
          }
        } catch (e) {
          results.push({ casketId, itemId: id, success: false, error: e?.toString?.() || 'Unknown error' });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    return res.status(200).json({ message: 'Processed', successCount, failedCount, results });
  } catch (err){
    console.error('Error removing from casket', err);
    return res.status(500).json({ message: 'Transferring items from storage failed', error: err.toString() });
  }
});


app.post('/api/transferToStorage', async (req, res) => {
  try {
    const { casketId, itemIds } = req.body;

    // Expect payload from frontend: { casketId: string|number, itemIds: string[] }
    const ids = Array.isArray(itemIds) ? itemIds : (itemIds ? [itemIds] : []);
    if (!casketId || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid payload: require casketId and itemIds[]' });
    }

    // Ensure we have an active GC session
    if (!SteamSession.isSessionActive()) {
      return res.status(502).json({ message: 'Not connected to Game Coordinator' });
    }

    // Helper: wait for a CasketAdded notification from GC (single-shot with timeout)
    const waitForCasketAdded = (timeoutMs = 3000) => {
      return new Promise((resolve) => {
        let finished = false;
        const done = (ok) => {
          if (finished) return;
          finished = true;
          try { SteamSession.csgo.removeListener('itemCustomizationNotification', onNotif); } catch {}
          clearTimeout(timer);
          resolve(ok);
        };

        const onNotif = (itemIds, notificationType) => {
          if (notificationType === GlobalOffensive.ItemCustomizationNotification.CasketAdded) {
            // Confirmed by GC
            done(true);
          }
        };

        const timer = setTimeout(() => done(false), timeoutMs);
        SteamSession.csgo.once('itemCustomizationNotification', onNotif);
      });
    };

    // Process items sequentially: issue addToCasket, await GC confirmation (or timeout)
    const results = [];
    for (const id of ids) {
      try {
        SteamSession.addToCasket(casketId, id);
        const ok = await waitForCasketAdded();
        if (ok) {
          results.push({ itemId: id, success: true });
        } else {
          results.push({ itemId: id, success: false, error: 'Game Coordinator did not confirm move (timeout)' });
        }
      } catch (e) {
        results.push({ itemId: id, success: false, error: e?.toString?.() || 'Unknown error' });
      }
    }
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    return res.status(200).json({ message: 'Processed', successCount, failedCount, results });
  } catch (err){
    console.error('Error adding to casket', err);
    return res.status(500).json({ message: 'Transfering items to storage failed', error: err.toString() });
  }
});

app.get('/api/tradeups', (req, res) => {
  SteamSession.saveInventoryToFile();
  const inventoryPath = path.join(__dirname, 'data', 'inventory_js.json');
  try {
    const data = fs.readFileSync(inventoryPath, 'utf8');
    const inventory = JSON.parse(data);
    let convertedInventory = csgo_items.inventoryConverter(inventory);

    convertedInventory = convertedInventory.filter(item => item.tradeUp === true);
    return res.status(200).json({ message: 'Successful login', data: convertedInventory });
  } catch (err) {
    console.error('Error reading or parsing file:', err);
    return res.status(500).json({ message: 'Login failed', error: err.toString() });
  }
});

app.post('/api/confirm/tradeup', async (req, res) => {
  try {
    const { itemsIds, itemsSeeds, itemsFloats, recipeId } = req.body;
    if (SteamSession.isSessionActive()) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const craftedItem = await SteamSession.craft(itemsIds, recipeId);
        await saveCraft(itemsIds, itemsSeeds, itemsFloats, craftedItem, timestamp);
        console.log(craftedItem);
        let resultItem = csgo_items.itemConverter(craftedItem);
        return res.status(200).json({"success": true, "craftedItem": resultItem})
      } catch (error) {
        console.log(error);
        return res.status(500).json({ "success": false, "message": error });
      }
    } else {
      return res.status(502).json({"success": false, "message": "Not Connected to GC"})
    }
  } catch {
    return res.status(501).json({});
  }
});

app.post('/api/logout', async (req, res) => {
  const response = SteamSession.logout();
  res.json(response);
});

async function saveCraft(itemsIds, paint_seed, paint_wears, craftedItem, timestamp) {
  const craftsPath = path.join(__dirname, 'data', 'crafts.json');

  const craftData = {
      timestamp: timestamp,
      input: itemsIds.map((id, index) => ({
          id: id,
          paint_seed: paint_seed[index],
          paint_wear: paint_wears[index]
      })),
      output: {
          id: craftedItem.id,
          paint_seed: craftedItem.paint_seed,
          paint_wear: craftedItem.paint_wear
      }
  };

  let crafts = [];
  if (fs.existsSync(craftsPath)) {
      try {
          const fileData = fs.readFileSync(craftsPath, 'utf8');
          crafts = JSON.parse(fileData);
      } catch (error) {
          console.error('Error reading file:', error);
          crafts = [];
      }
  }

  crafts.push(craftData);

  fs.writeFileSync(craftsPath, JSON.stringify(crafts, null, 2), 'utf8');

  console.log('Craft saved:', craftData);
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
