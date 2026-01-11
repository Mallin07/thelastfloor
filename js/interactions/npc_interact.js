// js/interactions/npc_interact.js
import { CONFIG } from "../core/config.js";
import { QUESTS } from "../data/quests_db.js";
import { openBank } from "../ui/menu/menu_index.js";
import { listSaves, saveToSlot, loadFromSlot, deleteSlot } from "../core/save_system.js";
import { openCraft } from "../ui/menu/menu_craft.js";
import { openTrade } from "../ui/menu/menu_trade.js";
import { SKILL_BRANCH, SKILLS } from "../data/skills_db.js";
import { getSkillStatus, learnSkill } from "../entities/skills.js";
import { SKILL_TREE_LAYOUT } from "../data/skill_tree_layout.js";
import { resetKeys } from "../input/input.js";

import {
  renderSkillsPanel,
  renderSkillsTreePanel,
  hideSkillsPanel
} from "../ui/menu/menu_skills_panel.js";

// ✅ action bar helpers (punto 6)
import {
  ACTIONBAR_FREE_SLOTS,
  ensureActionBar,
  assignSkillToActionSlot,
  autoAssignLearnedSkill
} from "../systems/actionbar_system.js";

import {
  acceptQuest,
  hasQuest,
  isCompleted,
  questStatusText,
  tryCompleteQuest,
  questRequirementsStatus
} from "../entities/quests.js";

// Acción principal por NPC (quién tendrá menú "avanzado")

import { nearestNpc as nearestNpc_impl } from "./npc/npc_utils.js";
import {
  talkToNearestNpc as talkToNearestNpc_impl,
  dialogUp as dialogUp_impl,
  dialogDown as dialogDown_impl,
  advanceDialog as advanceDialog_impl
} from "./npc/npc_actions.js";

export function nearestNpc(state, rangePx = CONFIG.TILE * 1.2){
  return nearestNpc_impl(state, rangePx);
}

// ---------- TALK ----------
export function talkToNearestNpc(state){
  return talkToNearestNpc_impl(state);
}

// ---------- CONTROLES ----------
export function dialogUp(state){
  return dialogUp_impl(state);
}

export function dialogDown(state){
  return dialogDown_impl(state);
}

export function advanceDialog(state){
  return advanceDialog_impl(state);
}
