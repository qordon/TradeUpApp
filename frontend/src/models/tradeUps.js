import collections from '@/stores/collections.json'


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

  normalizePaintWear(minWear, maxWear, paintWear) {
    let abc = new Float32Array([minWear, maxWear, paintWear, 0, 0]);
    abc[3] = abc[2] - abc[0];
    abc[4] = (abc[3] / (abc[1] - abc[0]))

    return abc[4];
  }

  // Get rarity
  getRarity(min_wear, max_wear, averageFloat) {
    let abc = new Float32Array([min_wear, max_wear, averageFloat, 0, 0]);
    abc[3] = abc[1] - abc[0]; // float range
    abc[4] = (abc[3] * abc[2]) + abc[0]; // output float
    let output_float_string = (abc[4].toFixed(35)).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');

    for (const [key, value] of Object.entries(this.rarityLevels)) {
      let chance = (value - min_wear) / (max_wear - min_wear);
      if (chance > averageFloat) {
        return [key, output_float_string];
      }
    }
    return ['Battle-Scarred', output_float_string];
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
        let normalizedPaintWear = this.normalizePaintWear(
          this.collections[collection][cleanItemName]['min-wear'],
          this.collections[collection][cleanItemName]['max-wear'],
          element.item_paint_wear
        );
        possibleSkins.push(...possible);
        items_paint_wear.push(normalizedPaintWear);
      });
      let sum = new Float32Array(1);
      for (let i = 0; i < items_paint_wear.length; i++) {
        sum[0] += items_paint_wear[i];
      }
      average = new Float32Array([sum[0] / items_paint_wear.length])[0];
      
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
        let objectToWrite = {
          item_name: item_name,
          item_wear_name: skinRarity,
          percentage: percentageChance.toFixed(1),
          imageURL: relevantObject['imageURL'],
          float_chance: floatChance,
          // temp_float_chance: tempFloatChance,
        };
  
        finalResult.push(objectToWrite);
      });
  
      resolve(finalResult);
    });
  }
  
}
  
  