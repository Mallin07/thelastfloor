// js/data/skill_combat_db.js

// ============================================================================
// SKILL COMBAT DB – LEYENDA / DOCUMENTACIÓN
// ============================================================================
//
// Este archivo define CÓMO funcionan las habilidades en combate.
// NO define requisitos de aprendizaje (eso vive en skills_db.js).
//
// Cada entrada en SKILL_COMBAT describe el comportamiento de una skill
// una vez que el jugador YA la ha aprendido.
//
// ----------------------------------------------------------------------------
// PROPIEDADES COMUNES
// ----------------------------------------------------------------------------
//
// mpCost(rank, state?) : number
//   - Coste de maná al usar la skill.
//   - Puede ser un número fijo o una función por rank.
//   - Si el jugador no tiene suficiente MP, la skill no se puede usar.
//
// cooldownMs(rank, state?) : number
//   - Tiempo de enfriamiento en milisegundos.
//   - Se guarda por skill en player.skillCooldowns[skillId].
//   - Nunca debe depender de Date.now(); se usa performance.now().
//
// rangePx : number
//   - Rango máximo para encontrar objetivo.
//   - Usado por nearestEnemy(state, rangePx).
//   - Para buffs suele ser 0.
//
// kind : string
//   - Define QUÉ tipo de acción de combate es la skill.
//   - Determina cómo useSkill() ejecuta sus efectos.
//   - Valores válidos:
//
//     "projectile"
//       - Requiere un enemigo en rango.
//       - Daño directo inmediato al objetivo más cercano.
//       - Ej: fireball, shoot_arrow
//
//     "melee"
//       - Requiere un enemigo en rango corto.
//       - Daño directo cuerpo a cuerpo.
//       - Ej: power_strike
//
//     "melee_cc"
//       - Igual que melee, pero además aplica control (stun).
//       - Ej: shield_bash
//
//     "buff"
//       - No requiere objetivo.
//       - Aplica un efecto temporal al jugador.
//       - Ej: magic_shield
//
// ----------------------------------------------------------------------------
// PROPIEDADES DE DAÑO (projectile / melee / melee_cc)
// ----------------------------------------------------------------------------
//
// damage(rank, state) : number
//   - Calcula el daño final de la skill.
//   - Se ejecuta SOLO si la skill impacta.
//   - Debe devolver un número entero >= 1.
//
// ----------------------------------------------------------------------------
// PROPIEDADES DE BUFF (buff)
// ----------------------------------------------------------------------------
//
// durationMs(rank, state?) : number
//   - Duración total del buff en milisegundos.
//
// defBonus(rank, state?) : number
//   - Bonus defensivo aplicado mientras el buff esté activo.
//   - Se suma a player.def y se revierte al expirar.
//
// ----------------------------------------------------------------------------
// PROPIEDADES DE CONTROL (melee_cc)
// ----------------------------------------------------------------------------
//
// stunMs(rank, state?) : number
//   - Duración del stun aplicado al enemigo impactado.
//   - Durante el stun el enemigo no puede moverse ni atacar.
//
// ----------------------------------------------------------------------------
// NOTAS IMPORTANTES
// ----------------------------------------------------------------------------
//
// - Todas las funciones pueden depender del rank y del state.
// - Nada aquí se guarda en la partida (todo es runtime).
// - La validación (MP, cooldown, arma, target) se hace en canCastSkill().
// - La ejecución real se hace en useSkill().
//
// ============================================================================
// FIN DE LEYENDA
// ============================================================================

import { roll } from "../core/utils.js";

export const SKILL_COMBAT = {
  // ===== Mago =====
  fireball: {
    mpCost: (rank) => 4 + (rank - 1) * 2,
    cooldownMs: (rank) => Math.max(250, 900 - (rank - 1) * 80),
    rangePx: 300,
    kind: "projectile",

    // Daño mágico base que escala por rank + spellPower (varita offHand)
    damage: (rank, state) => {
      const pow = state.player.spellPower || 0; // 0 si no hay varita
      // Ej: rank1 ~ 3-6 (+pow), rank4 ~ 6-12 (+pow*2 aprox)
      const min = 2 + rank + pow;
      const max = 4 + rank * 2 + pow * 2;
      return roll(state.rng, min, max);
    },
  },

  // ===== Arquero =====
  shoot_arrow: {
    mpCost: 1,
    cooldownMs: (rank) => Math.max(250, 650 - (rank - 1) * 60),
    rangePx: 240,
    kind: "projectile",

    // Daño físico basado en rangedAtk (arco offHand) + bonus por rank
    damage: (rank, state) => {
      const atk = state.player.rangedAtk || 1; // <- arco offHand
      const base = roll(state.rng, 1, atk);
      const bonus = Math.max(0, rank - 1); // +0/+1/+2/+3...
      return base + bonus;
    },
  },

  // ===== Guerrero =====
  power_strike: {
    mpCost: 3,
    cooldownMs: (rank) => Math.max(300, 1000 - (rank - 1) * 80),
    rangePx: 60,
    kind: "melee",

    // Golpe fuerte: multiplica el daño melee (espada mainHand)
    // skill_combat_db.js
    damage: (_rank, state) => {
      const atk = state.player.atk || 1;
      const base = roll(state.rng, 1, atk);
      return Math.max(1, Math.floor(base * 1.4));
    }

  },

  // ===== Defensa =====
  magic_shield: {
    mpCost: (rank) => 6 + (rank - 1) * 2,
    cooldownMs: (rank) => Math.max(800, 5000 - (rank - 1) * 300),
    rangePx: 0,
    kind: "buff",

    durationMs: (rank) => 4000 + (rank - 1) * 1200,

    defBonus: (rank, _state) => {
      return 2 + (rank - 1);
    },
  },

  shield_bash: {
    mpCost: (_) => 0,
    cooldownMs: (rank) => Math.max(400, 1800 - (rank - 1) * 120),
    rangePx: 70,
    kind: "melee_cc",

    stunMs: (rank) => 700 + (rank - 1) * 150,

    // Daño pequeño + stun. Si no hay escudo equipado, casi no pega.
    damage: (rank, state) => {
      const hasShield = String(state.player?.equipment?.offHand?.weaponType || "").toLowerCase() === "shield";
      const atk = state.player.atk || 1; // meleeAtk
      const cap = Math.max(1, Math.floor(atk * 0.6));
      const base = roll(state.rng, 1, cap);
      const bonus = Math.floor(rank / 2); // 0,1,1,2...

      const dmg = Math.max(1, base + bonus);
      return hasShield ? dmg : 1; // sin escudo: 1 de daño
    },
  },
};

export function getSkillCombatSpec(skillId) {
  return SKILL_COMBAT[skillId] ?? null;
}
