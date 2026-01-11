export function updateUI(state){
  const p = state.player;

  const hpText = document.getElementById("hpText");
  if (hpText) hpText.textContent = `${p.hp}/${p.hpMax}`;

  const mpText = document.getElementById("mpText");
  if (mpText) mpText.textContent = `${p.mp}/${p.mpMax}`;

  const hungerText = document.getElementById("hungerText");
  if (hungerText)
  hungerText.textContent =
  `${Math.floor(p.hunger)}/${Math.floor(p.hungerMax)}`;

  const lvlText = document.getElementById("levelText");
  if (lvlText) lvlText.textContent = `${p.lvl}`;

  const atkText = document.getElementById("atkText");
  if (atkText) atkText.textContent = `${p.atk}`;

  const potText = document.getElementById("potText");
  if (potText) potText.textContent = `${p.potions}`;

  const xpText = document.getElementById("xpText");
  if (xpText) xpText.textContent = `${p.xp}/${p.xpNext}`;

  const hpBar = document.getElementById("hpBar");
  if (hpBar) hpBar.style.width = `${Math.round((p.hp/p.hpMax)*100)}%`;

  const mpBar = document.getElementById("mpBar");
  if (mpBar) mpBar.style.width = `${Math.round((p.mp/p.mpMax)*100)}%`;

  const hungerBar = document.getElementById("hungerBar");
  if (hungerBar) hungerBar.style.width = `${Math.round((p.hunger/p.hungerMax)*100)}%`;

  const xpBar = document.getElementById("xpBar");
  if (xpBar) xpBar.style.width = `${Math.round((p.xp/p.xpNext)*100)}%`;

  // ✅ botón correcto: usePotionBtn (no healBtn)
  const usePotionBtn = document.getElementById("usePotionBtn");
  if (usePotionBtn){
    usePotionBtn.disabled = (p.potions<=0 || p.hp>=p.hpMax || state.over);
  }
}
