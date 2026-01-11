// js/data/skill_vfx_db.js

//=========MAGO===========//

export const SKILL_VFX = {
fireball: {
  type: "projectile",
  asset: "FIREBALL",
  duration: 300,
  speed: 420,
  scale: 1.0,
  size: 36,
},

//=========ARQUERO===========//

shoot_arrow: {
  type: "projectile",
  asset: "SHOOT_ARROW",
  duration: 300,
  speed: 420,
  scale: 1.0,
  size: 36,
},  

//=========GUERRERO===========//  

power_strike: {
  type: "melee",
  asset: "SLASH_HEAVY",
  duration: 180,
  scale: 1.1,
  offsetPx: 18,

  // ✅ NUEVO: ajusta la orientación base del sprite
  rotOffset: Math.PI / 2, // prueba también -Math.PI/2 si lo invierte
},


//=========DEFENSA===========//  

shield_bash: {
    type: "melee",
    asset: "SHIELD_HIT",
    duration: 140,
    scale: 1.0,
    offsetPx: 14,
  },
};

export function getSkillVFXSpec(skillId){
  return SKILL_VFX[skillId] ?? null;
}