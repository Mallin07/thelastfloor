import { roll } from "../core/utils.js";
import { SLOT } from "./inventory.js";

export function randomGear(state){
  const table = [
    { kind:"gear", slot:"head",  name:"Casco de cuero", icon:"🪖", defense: 1 },
    { kind:"gear", slot:"chest", name:"Armadura ligera", icon:"🥋", defense: 2 },
    { kind:"gear", slot:"legs",  name:"Pantalones reforzados", icon:"👖", defense: 1 },
    { kind:"gear", slot:"feet",  name:"Botas de viaje", icon:"🥾", defense: 1 },

    { kind:"gear", slot:"mainHand", name:"Espada corta", icon:"🗡️", bonusAtk: 2 },

    { kind:"gear", slot:"offHand", name:"Daga", icon:"🗡️", bonusAtk: 1 },
    { kind:"gear", slot:"offHand", name:"Escudo", icon:"🛡️", defense: 3 }
  ];

  return table[Math.floor(state.rng() * table.length)];
}

