// js/data/skill_tree_layout.js
export const SKILL_TREE_LAYOUT = {
  mage: {
    nodes: [
      { id: "fireball", x: 0, y: 0 },
      { id: "chain_lightning", x: -1, y: 2 },
      { id: "flame_floor", x: 1, y: 2 },
    ],
    edges: [
      ["fireball", "chain_lightning"],
      ["fireball", "flame_floor"],
    ],
  },

  archer: {
    nodes: [
      { id: "shoot_arrow", x: 0, y: 0 },
      { id: "multishot", x: 0, y: 2 },
    ],
    edges: [
      ["shoot_arrow", "multishot"],
    ],
  },

  warrior: {
    nodes: [
      { id: "power_strike", x: 0, y: 0 },
      { id: "whirlwind", x: 0, y: 2 },
    ],
    edges: [
      ["power_strike", "whirlwind"],
    ],
  },

  defense: {
    nodes: [
      { id: "magic_shield", x: 0, y: 0 },
      { id: "shield_bash", x: 0, y: 2 },
    ],
    edges: [
      ["magic_shield", "shield_bash"],
    ],
  },
};
