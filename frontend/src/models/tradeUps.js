import collections from '@/stores/collections.json'
import init, { decimal_to_result, binstr_to_result, hexstring_to_result, binstr_plus, binstr_minus } from "../models/floatconv.js";
// import Module from './converting.js';

init().then(() => {

});

// const wasmModule = await Module();
// if (!wasmModule._calculateOutputFloatValue) {
//   console.error("Функція _calculateOutputFloatValue не знайдена!");
// }
// else {
//   console.log("ALL good time");
// }

async function setCollections(currencyClass) {

  const directory = {};
  for (const [key, value] of Object.entries(collections)) {
    const keys = Object.keys(value);
    keys.forEach((element) => {
      directory[element] = key;
    });
  }
  currencyClass.setCollections(collections, directory);
}
  
export class tradeUps {
  constructor() {
    this.collections = {};
    this.seenRates = {};
    this.directory = {};
    this.rarityLevels = {
      'Factory New': 0.07,
      'Minimal Wear': 0.15,
      'Field-Tested': 0.38,
      'Well-Worn': 0.45,
      'Battle-Scarred': 1,
    };
    setCollections(this);
  }

  // Setup backup
  setCollections(converter, dir) {
    this.collections = converter;
    this.directory = dir;
  }

  // Get rarity
  getRarity(min_wear, max_wear, averageFloat) {
    let c = (max_wear - min_wear) * averageFloat;
    for (const [key, value] of Object.entries(this.rarityLevels)) {
      let chance = (value - min_wear) / (max_wear - min_wear);
      if (chance > averageFloat) {
        return [key, decimal_to_result((c + parseFloat(min_wear)).toString())];
      }
    }
    return ['Battle-Scarred', decimal((c + parseFloat(min_wear)).toString())];
  }

  // Get possible outcomes
  getPossible(collection, quality) {
    let i = 1;
    while (true) {
      let listOfPossibilities = [];
      for (const [key, value] of Object.entries(this.collections[collection])) {
        if (value.best_quality == quality + i) {
          listOfPossibilities.push(key);
        }
      }

      if (listOfPossibilities.length > 0 || i + quality > 15) {
        return listOfPossibilities;
      }
      i++;
    }
  }

  getTradeUp(arrayOfItems) {
    return new Promise((resolve) => {
      arrayOfItems.forEach((element) => {
        let itemName = element.item_name.replace('StatTrak™ ', '');
        let collection = this.directory[itemName];
        element['tradeUpConfirmed'] = false;

        if (collection !== undefined) {
          let possible = this.collections?.[collection][itemName]?.trade_up;
          element['tradeUpConfirmed'] = possible;
          element['collection'] = collection;
        }
      });

      resolve(arrayOfItems);
    });
  }

  // Generate outcome
  getPotentialOutcome(arrayOfItems) {
    return new Promise((resolve) => {
      let finalResult = [];
      let average = 0;
      let possibleSkins = [];
      let seenSkins = [];
      let isStattrak = false;
  
      if (arrayOfItems[0].item_name.includes('StatTrak™')) {
        isStattrak = true;
      }
      let items_paint_wear = [];
      arrayOfItems.forEach((element) => {
        let cleanItemName = element.item_name;
        if (isStattrak) {
          cleanItemName = cleanItemName.replace('StatTrak™ ', '');
        }
  
        let collection = this.directory[cleanItemName];
        let possible = this.getPossible(
          collection,
          parseInt(this.collections[collection][cleanItemName].best_quality)
        );
  
        possible.forEach((skin) => {
          if (!seenSkins.includes(skin)) {
            seenSkins.push(skin);
          }
        });
  
        possibleSkins.push(...possible);
        average += element.item_paint_wear;
        items_paint_wear.push(element.item_paint_wear);
      });
  
      average = average / arrayOfItems.length;
      
      seenSkins.forEach((skin) => {
        let relevantObject = this.collections[this.directory[skin]][skin];
        let [skinRarity, floatChance] = this.getRarity(
          relevantObject['min-wear'],
          relevantObject['max-wear'],
          average
        );
  
        let percentageChance =
          100 /
          (possibleSkins.length /
            possibleSkins.filter((item) => item === skin).length);
  
        let item_name = isStattrak ? `StatTrak™ ${skin}` : skin;
        // items_paint_wear = new Float32Array(items_paint_wear);
        // let calc_output = wasmModule.cwrap('calculateOutputFloatValue', 'string', ['array', 'float', 'float'])
        // let tempFloatChance = calc_output(items_paint_wear, 
        //                                                 parseFloat(relevantObject['min-wear']),
        //                                                 parseFloat(relevantObject['max-wear']));
        // let tempFloatChance = wasmModule._calculateOutputFloatValue(items_paint_wear, 
        //                                                     relevantObject['min-wear'],
        //                                                     relevantObject['max-wear']);
        let objectToWrite = {
          item_name: item_name,
          item_wear_name: skinRarity,
          percentage: percentageChance.toFixed(1),
          image: relevantObject['imageURL'],
          float_chance: floatChance,
          // temp_float_chance: tempFloatChance,
        };
  
        finalResult.push(objectToWrite);
      });
  
      resolve(finalResult);
    });
  }
  
}
  
  