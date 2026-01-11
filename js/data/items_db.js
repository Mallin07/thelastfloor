// js/data/items_db.js

import { ANIMAL_ITEMS }  from "./items/animal_items.js";
import { CARP_ITEMS }    from "./items/carp_items.js";
import { COCINA_ITEMS }  from "./items/cocina_items.js";
import { ENEMIES_ITEMS } from "./items/enemies_items.js";
import { FORGE_ITEMS }   from "./items/forge_items.js";
import { LEATHER_ITEMS } from "./items/leather_items.js";
import { MAGE_ITEMS }    from "./items/mage_items.js";
import { MAPA_ITEMS }    from "./items/mapa_items.js";

export const ITEMS = {
  ...ANIMAL_ITEMS,
  ...CARP_ITEMS,
  ...COCINA_ITEMS,
  ...ENEMIES_ITEMS,
  ...FORGE_ITEMS,
  ...LEATHER_ITEMS,
  ...MAGE_ITEMS,
  ...MAPA_ITEMS
};
