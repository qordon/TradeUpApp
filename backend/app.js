const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const SteamSession = require('./steamSession');
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
  const inventoryPath = path.join(__dirname, 'data', 'inventory_js.json');

  try {
    const data = fs.readFileSync(inventoryPath, 'utf8');
    const inventory = JSON.parse(data);
    let convertedInventory = csgo_items.inventoryConverter(inventory);
    return res.status(200).json({ message: 'Successful login', data: convertedInventory });
  } catch (err) {
    console.error('Error reading or parsing file:', err);
    return res.status(500).json({ message: 'Login failed', error: err.toString() });
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
