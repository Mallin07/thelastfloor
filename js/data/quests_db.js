// js/data/quests_db.js

import { CARPINTERO_QUESTS } from "./quest/carpintero_quest.js";
import { COCINERO_QUESTS }   from "./quest/cocinero_quest.js";
import { HERRERO_QUESTS }    from "./quest/herrero_quest.js";
import { MAESTRO_QUESTS }    from "./quest/maestro_quest.js";
import { MAGO_QUESTS }       from "./quest/mago_quest.js";
import { PELETERO_QUESTS }   from "./quest/peletero_quest.js";
import { VENDEDOR_QUESTS }   from "./quest/vendedor_quest.js";

export const QUESTS = {
  ...CARPINTERO_QUESTS,
  ...COCINERO_QUESTS,
  ...HERRERO_QUESTS,
  ...MAESTRO_QUESTS,
  ...MAGO_QUESTS,
  ...PELETERO_QUESTS,
  ...VENDEDOR_QUESTS
};
