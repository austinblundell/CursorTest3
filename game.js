"use strict";

const SAVE_KEY = "crystalfall-chronicles-save-v1";
const TILE_SIZE = 32;
const MAP_WIDTH = 24;
const MAP_HEIGHT = 16;

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
const partyPanel = document.querySelector("#party-panel");
const questPanel = document.querySelector("#quest-panel");
const commandPanel = document.querySelector("#command-panel");
const logPanel = document.querySelector("#log-panel");

const TILE_COLORS = {
  G: "#3d8f50",
  F: "#1e6f43",
  M: "#6b6471",
  W: "#2470b8",
  T: "#b9783f",
  S: "#50c89c",
  D: "#754b3b",
  R: "#8c79c8",
  C: "#3a254d",
};

const TILE_NAMES = {
  G: "Sunlit Plains",
  F: "Whisperwood",
  M: "Mooncrag Peaks",
  W: "Azure Sea",
  T: "Starfall Village",
  S: "Verdant Shrine",
  D: "Emberdeep Mine",
  R: "Skyglass Ruins",
  C: "Shadow Spire",
};

const CRYSTALS = {
  verdant: "Verdant Crystal",
  ember: "Ember Crystal",
  sky: "Sky Crystal",
};

const HEROES = [
  {
    name: "Aria",
    job: "Knight",
    level: 1,
    xp: 0,
    hp: 96,
    maxHp: 96,
    mp: 16,
    maxMp: 16,
    atk: 18,
    mag: 6,
    def: 10,
    color: "#ffd36a",
  },
  {
    name: "Nox",
    job: "Spellblade",
    level: 1,
    xp: 0,
    hp: 72,
    maxHp: 72,
    mp: 34,
    maxMp: 34,
    atk: 12,
    mag: 17,
    def: 6,
    color: "#70f7ff",
  },
  {
    name: "Mira",
    job: "Sage",
    level: 1,
    xp: 0,
    hp: 78,
    maxHp: 78,
    mp: 38,
    maxMp: 38,
    atk: 10,
    mag: 15,
    def: 7,
    color: "#84f29a",
  },
];

const ENEMY_TEMPLATES = {
  sproutling: {
    name: "Sproutling",
    maxHp: 38,
    atk: 10,
    mag: 3,
    def: 2,
    xp: 18,
    gold: 14,
    color: "#7ed957",
  },
  wolf: {
    name: "Moon Wolf",
    maxHp: 46,
    atk: 13,
    mag: 4,
    def: 4,
    xp: 24,
    gold: 17,
    color: "#9ab3d6",
  },
  goblin: {
    name: "Lantern Goblin",
    maxHp: 54,
    atk: 15,
    mag: 5,
    def: 5,
    xp: 31,
    gold: 25,
    color: "#c0a650",
  },
  wisp: {
    name: "Azure Wisp",
    maxHp: 44,
    atk: 9,
    mag: 13,
    def: 3,
    xp: 28,
    gold: 21,
    color: "#70f7ff",
    caster: true,
  },
  basilisk: {
    name: "Cinder Basilisk",
    maxHp: 70,
    atk: 17,
    mag: 7,
    def: 8,
    xp: 44,
    gold: 34,
    color: "#ff8c42",
  },
  sentinel: {
    name: "Glass Sentinel",
    maxHp: 82,
    atk: 16,
    mag: 14,
    def: 9,
    xp: 52,
    gold: 43,
    color: "#b7a6ff",
    caster: true,
  },
  verdantGuardian: {
    name: "Verdant Guardian",
    maxHp: 170,
    atk: 17,
    mag: 15,
    def: 8,
    xp: 95,
    gold: 70,
    color: "#39df8a",
    caster: true,
    boss: true,
  },
  emberGuardian: {
    name: "Ember Guardian",
    maxHp: 230,
    atk: 22,
    mag: 17,
    def: 10,
    xp: 130,
    gold: 95,
    color: "#ff6b4a",
    caster: true,
    boss: true,
  },
  skyGuardian: {
    name: "Sky Guardian",
    maxHp: 290,
    atk: 24,
    mag: 21,
    def: 12,
    xp: 175,
    gold: 130,
    color: "#9fb8ff",
    caster: true,
    boss: true,
  },
  shadowLord: {
    name: "Lord Umbra",
    maxHp: 430,
    atk: 30,
    mag: 26,
    def: 14,
    xp: 0,
    gold: 0,
    color: "#d46bff",
    caster: true,
    boss: true,
  },
};

const state = createInitialState();
let animationTick = 0;

function createMap() {
  const map = Array.from({ length: MAP_HEIGHT }, (_, y) =>
    Array.from({ length: MAP_WIDTH }, (_, x) =>
      x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1 ? "W" : "G"
    )
  );

  fillRect(map, 8, 1, 4, 6, "F");
  fillRect(map, 16, 2, 4, 2, "M");
  fillRect(map, 3, 7, 4, 2, "M");
  fillRect(map, 1, 10, 4, 3, "F");
  fillRect(map, 18, 9, 5, 3, "W");
  fillRect(map, 15, 6, 4, 2, "F");
  fillRect(map, 2, 2, 3, 2, "T");
  fillRect(map, 12, 5, 3, 2, "S");
  fillRect(map, 10, 8, 3, 2, "D");
  fillRect(map, 19, 12, 3, 2, "R");
  fillRect(map, 11, 12, 3, 2, "C");

  return map;
}

function fillRect(map, startX, startY, width, height, tile) {
  for (let y = startY; y < startY + height; y += 1) {
    for (let x = startX; x < startX + width; x += 1) {
      map[y][x] = tile;
    }
  }
}

const worldMap = createMap();

function createInitialState() {
  return {
    mode: "explore",
    x: 5,
    y: 4,
    gold: 70,
    potions: 4,
    ethers: 1,
    crystals: [],
    guardians: {
      verdant: false,
      ember: false,
      sky: false,
      shadow: false,
    },
    party: HEROES.map((hero) => ({ ...hero, guarding: false, acted: false })),
    battle: null,
    log: [
      "The crystals of Auralis have gone dark. Guide Aria, Nox, and Mira across the realm.",
    ],
  };
}

function resetGame() {
  const fresh = createInitialState();
  Object.keys(state).forEach((key) => {
    delete state[key];
  });
  Object.assign(state, fresh);
  addLog("A new journey begins beneath a fading crystal moon.");
  render();
}

function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 40);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choose(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function makeEnemy(key, levelBonus = 0) {
  const template = ENEMY_TEMPLATES[key];
  const hpBonus = levelBonus * 12;
  return {
    ...template,
    key,
    hp: template.maxHp + hpBonus,
    maxHp: template.maxHp + hpBonus,
    atk: template.atk + levelBonus * 2,
    mag: template.mag + levelBonus * 2,
    def: template.def + levelBonus,
  };
}

function xpNeeded(hero) {
  return hero.level * 75 + 35;
}

function livingHeroes() {
  return state.party.filter((hero) => hero.hp > 0);
}

function livingEnemies() {
  return state.battle ? state.battle.enemies.filter((enemy) => enemy.hp > 0) : [];
}

function currentTile() {
  return worldMap[state.y][state.x];
}

function isBlocked(tile) {
  return tile === "W" || tile === "M";
}

function movePlayer(dx, dy) {
  if (state.mode !== "explore") {
    return;
  }

  const nextX = clamp(state.x + dx, 0, MAP_WIDTH - 1);
  const nextY = clamp(state.y + dy, 0, MAP_HEIGHT - 1);
  const tile = worldMap[nextY][nextX];

  if (isBlocked(tile)) {
    addLog(`${TILE_NAMES[tile]} blocks the path.`);
    render();
    return;
  }

  state.x = nextX;
  state.y = nextY;

  const location = locationAtCurrentTile();
  if (location) {
    addLog(`You arrive at ${location.name}.`);
  } else {
    maybeStartRandomEncounter(tile);
  }

  render();
}

function maybeStartRandomEncounter(tile) {
  const encounterRate = {
    G: 0.08,
    F: 0.18,
    D: 0.14,
    R: 0.16,
  }[tile] || 0;

  if (Math.random() >= encounterRate) {
    return;
  }

  const averageLevel = Math.floor(
    state.party.reduce((sum, hero) => sum + hero.level, 0) / state.party.length
  );

  const groups = {
    G: [
      ["sproutling", "sproutling"],
      ["wolf"],
      ["sproutling", "wolf"],
    ],
    F: [
      ["goblin"],
      ["sproutling", "wisp"],
      ["wolf", "goblin"],
    ],
    D: [
      ["basilisk"],
      ["goblin", "basilisk"],
    ],
    R: [
      ["sentinel"],
      ["wisp", "sentinel"],
    ],
  };

  const enemies = choose(groups[tile] || groups.G).map((key) =>
    makeEnemy(key, Math.max(0, averageLevel - 1))
  );
  startBattle(enemies, "encounter");
}

function locationAtCurrentTile() {
  const tile = currentTile();
  if (tile === "T") {
    return { type: "town", name: "Starfall Village" };
  }
  if (tile === "S") {
    return { type: "guardian", key: "verdant", name: "Verdant Shrine" };
  }
  if (tile === "D") {
    return { type: "guardian", key: "ember", name: "Emberdeep Mine" };
  }
  if (tile === "R") {
    return { type: "guardian", key: "sky", name: "Skyglass Ruins" };
  }
  if (tile === "C") {
    return { type: "final", key: "shadow", name: "Shadow Spire" };
  }
  return null;
}

function startBattle(enemies, kind, guardianKey = null) {
  state.mode = "battle";
  state.party.forEach((hero) => {
    hero.acted = hero.hp <= 0;
    hero.guarding = false;
  });
  state.battle = {
    kind,
    guardianKey,
    enemies,
    round: 1,
    activeIndex: firstLivingHeroIndex(),
  };
  addLog(`${enemies.map((enemy) => enemy.name).join(" and ")} stand in your way!`);
  render();
}

function firstLivingHeroIndex() {
  return state.party.findIndex((hero) => hero.hp > 0);
}

function activeHero() {
  if (!state.battle) {
    return null;
  }
  return state.party[state.battle.activeIndex];
}

function chooseDefaultTarget() {
  return livingEnemies()[0];
}

function heroAction(action) {
  const hero = activeHero();
  if (!hero || hero.hp <= 0 || hero.acted || state.mode !== "battle") {
    return;
  }

  const enemy = chooseDefaultTarget();

  if (action === "attack") {
    damageEnemy(hero, enemy, hero.atk + randInt(3, 8), `${hero.name} attacks`);
  }

  if (action === "cleave") {
    if (hero.mp < 5) {
      addLog(`${hero.name} needs 5 MP for Cleave.`);
      render();
      return;
    }
    hero.mp -= 5;
    livingEnemies().forEach((target) => {
      damageEnemy(hero, target, hero.atk + randInt(7, 13), `${hero.name}'s Cleave hits`);
    });
  }

  if (action === "spark") {
    if (hero.mp < 7) {
      addLog(`${hero.name} needs 7 MP for Spark.`);
      render();
      return;
    }
    hero.mp -= 7;
    damageEnemy(hero, enemy, hero.mag + randInt(17, 25), `${hero.name} casts Spark`);
  }

  if (action === "flare") {
    if (hero.mp < 14) {
      addLog(`${hero.name} needs 14 MP for Crystal Flare.`);
      render();
      return;
    }
    hero.mp -= 14;
    livingEnemies().forEach((target) => {
      damageEnemy(hero, target, hero.mag + randInt(20, 32), `${hero.name}'s Crystal Flare burns`);
    });
  }

  if (action === "cure") {
    if (hero.mp < 6) {
      addLog(`${hero.name} needs 6 MP for Cure.`);
      render();
      return;
    }
    hero.mp -= 6;
    healHero(lowestLivingHero(), hero.mag + randInt(22, 34), `${hero.name} casts Cure`);
  }

  if (action === "renew") {
    if (hero.mp < 14) {
      addLog(`${hero.name} needs 14 MP for Renew.`);
      render();
      return;
    }
    hero.mp -= 14;
    livingHeroes().forEach((target) => {
      healHero(target, hero.mag + randInt(14, 24), `${hero.name}'s Renew restores`);
    });
  }

  if (action === "potion") {
    if (state.potions <= 0) {
      addLog("No potions remain.");
      render();
      return;
    }
    state.potions -= 1;
    healHero(lowestLivingHero(), 55, `${hero.name} uses a Potion`);
  }

  if (action === "ether") {
    if (state.ethers <= 0) {
      addLog("No ethers remain.");
      render();
      return;
    }
    state.ethers -= 1;
    restoreMp(hero, 22, `${hero.name} uses an Ether`);
  }

  if (action === "guard") {
    hero.guarding = true;
    addLog(`${hero.name} braces behind a shield of light.`);
  }

  hero.acted = true;

  if (livingEnemies().length === 0) {
    winBattle();
    return;
  }

  advanceBattleTurn();
  render();
}

function damageEnemy(hero, enemy, rawDamage, label) {
  if (!enemy || enemy.hp <= 0) {
    return;
  }
  const damage = Math.max(1, Math.floor(rawDamage - enemy.def * 0.45));
  enemy.hp = Math.max(0, enemy.hp - damage);
  addLog(`${label} ${enemy.name} for ${damage} damage.`);
}

function damageHero(enemy, hero, rawDamage, label) {
  const guardFactor = hero.guarding ? 0.48 : 1;
  const damage = Math.max(1, Math.floor((rawDamage - hero.def * 0.5) * guardFactor));
  hero.hp = Math.max(0, hero.hp - damage);
  addLog(`${label} ${hero.name} for ${damage} damage.`);
  if (hero.hp === 0) {
    hero.acted = true;
    addLog(`${hero.name} falls!`);
  }
}

function healHero(hero, amount, label) {
  if (!hero) {
    return;
  }
  const before = hero.hp;
  hero.hp = Math.min(hero.maxHp, hero.hp + amount);
  addLog(`${label} ${hero.name} for ${hero.hp - before} HP.`);
}

function restoreMp(hero, amount, label) {
  const before = hero.mp;
  hero.mp = Math.min(hero.maxMp, hero.mp + amount);
  addLog(`${label}, restoring ${hero.mp - before} MP.`);
}

function lowestLivingHero() {
  return livingHeroes().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
}

function advanceBattleTurn() {
  const battle = state.battle;
  const nextIndex = state.party.findIndex((hero) => hero.hp > 0 && !hero.acted);

  if (nextIndex !== -1) {
    battle.activeIndex = nextIndex;
    return;
  }

  enemyPhase();

  if (livingHeroes().length === 0) {
    loseBattle();
    return;
  }

  battle.round += 1;
  state.party.forEach((hero) => {
    hero.acted = hero.hp <= 0;
    hero.guarding = false;
  });
  battle.activeIndex = firstLivingHeroIndex();
  addLog(`Round ${battle.round} begins.`);
}

function enemyPhase() {
  addLog("The monsters surge forward.");
  livingEnemies().forEach((enemy) => {
    const target = choose(livingHeroes());
    if (!target) {
      return;
    }
    if (enemy.caster && Math.random() < 0.42) {
      damageHero(enemy, target, enemy.mag + randInt(12, 22), `${enemy.name}'s spell strikes`);
    } else {
      damageHero(enemy, target, enemy.atk + randInt(5, 13), `${enemy.name} hits`);
    }
  });
}

function winBattle() {
  const battle = state.battle;
  const xp = battle.enemies.reduce((sum, enemy) => sum + enemy.xp, 0);
  const gold = battle.enemies.reduce((sum, enemy) => sum + enemy.gold, 0);
  state.gold += gold;
  addLog(`Victory! The party gains ${xp} XP and ${gold} gold.`);

  state.party.forEach((hero) => {
    if (hero.hp <= 0) {
      hero.hp = 1;
    }
    hero.xp += xp;
    while (hero.xp >= xpNeeded(hero)) {
      hero.xp -= xpNeeded(hero);
      hero.level += 1;
      hero.maxHp += 14 + hero.level * 2;
      hero.maxMp += hero.job === "Knight" ? 3 : 7;
      hero.atk += hero.job === "Sage" ? 2 : 4;
      hero.mag += hero.job === "Knight" ? 1 : 4;
      hero.def += 2;
      hero.hp = hero.maxHp;
      hero.mp = hero.maxMp;
      addLog(`${hero.name} reaches level ${hero.level}!`);
    }
    hero.acted = false;
    hero.guarding = false;
  });

  if (battle.guardianKey && battle.guardianKey !== "shadow") {
    claimCrystal(battle.guardianKey);
  }

  if (battle.guardianKey === "shadow") {
    state.guardians.shadow = true;
    state.mode = "ending";
    state.battle = null;
    addLog("Lord Umbra dissolves into starlight. Auralis is saved!");
    render();
    return;
  }

  state.mode = "explore";
  state.battle = null;
  render();
}

function loseBattle() {
  state.mode = "explore";
  state.battle = null;
  state.x = 3;
  state.y = 3;
  state.gold = Math.max(0, Math.floor(state.gold * 0.8));
  state.party.forEach((hero) => {
    hero.hp = Math.max(1, Math.floor(hero.maxHp * 0.45));
    hero.mp = Math.max(0, Math.floor(hero.maxMp * 0.35));
    hero.acted = false;
    hero.guarding = false;
  });
  addLog("The party wakes in Starfall Village, battered but alive.");
  render();
}

function claimCrystal(key) {
  if (state.guardians[key]) {
    return;
  }
  state.guardians[key] = true;
  state.crystals.push(key);
  addLog(`The ${CRYSTALS[key]} joins your cause.`);
  if (state.crystals.length === 3) {
    addLog("All crystals sing together. The path to the Shadow Spire is open.");
  }
}

function restAtInn() {
  state.party.forEach((hero) => {
    hero.hp = hero.maxHp;
    hero.mp = hero.maxMp;
  });
  addLog("The village inn restores the party.");
  render();
}

function buyPotion() {
  if (state.gold < 25) {
    addLog("A Potion costs 25 gold.");
    render();
    return;
  }
  state.gold -= 25;
  state.potions += 1;
  addLog("Bought one Potion.");
  render();
}

function buyEther() {
  if (state.gold < 40) {
    addLog("An Ether costs 40 gold.");
    render();
    return;
  }
  state.gold -= 40;
  state.ethers += 1;
  addLog("Bought one Ether.");
  render();
}

function usePotionOutsideBattle() {
  if (state.mode !== "explore" || state.potions <= 0) {
    return;
  }
  const hero = lowestLivingHero() || state.party[0];
  state.potions -= 1;
  healHero(hero, 55, "A Potion restores");
  render();
}

function useEtherOutsideBattle() {
  if (state.mode !== "explore" || state.ethers <= 0) {
    return;
  }
  const hero = state.party
    .filter((member) => member.hp > 0)
    .sort((a, b) => a.mp / a.maxMp - b.mp / b.maxMp)[0];
  state.ethers -= 1;
  restoreMp(hero, 22, "An Ether glows");
  render();
}

function challengeLocation(key) {
  if (key === "verdant") {
    startBattle([makeEnemy("verdantGuardian")], "guardian", "verdant");
  }
  if (key === "ember") {
    startBattle([makeEnemy("emberGuardian", 1)], "guardian", "ember");
  }
  if (key === "sky") {
    startBattle([makeEnemy("skyGuardian", 2)], "guardian", "sky");
  }
  if (key === "shadow") {
    startBattle([makeEnemy("shadowLord", 3)], "final", "shadow");
  }
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  addLog("Game saved to this browser.");
  render();
}

function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) {
    addLog("No saved game was found in this browser.");
    render();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    Object.keys(state).forEach((key) => {
      delete state[key];
    });
    Object.assign(state, parsed);
    addLog("Save loaded.");
  } catch (error) {
    addLog("The saved game could not be loaded.");
  }

  render();
}

function render() {
  draw();
  renderParty();
  renderQuest();
  renderCommands();
  renderLog();
}

function draw() {
  animationTick += 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state.mode === "battle") {
    drawBattle();
    return;
  }

  drawWorld();
  if (state.mode === "ending") {
    drawEndingOverlay();
  }
}

function drawWorld() {
  worldMap.forEach((row, y) => {
    row.forEach((tile, x) => {
      drawTile(tile, x, y);
    });
  });

  drawPlayer(state.x, state.y);
  drawMiniHud();
}

function drawTile(tile, x, y) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  ctx.fillStyle = TILE_COLORS[tile];
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(px, py, TILE_SIZE, 1);
  ctx.fillRect(px, py, 1, TILE_SIZE);

  if (tile === "F") {
    ctx.fillStyle = "#134e32";
    ctx.beginPath();
    ctx.arc(px + 12, py + 13, 8, 0, Math.PI * 2);
    ctx.arc(px + 21, py + 14, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  if (tile === "T") {
    ctx.fillStyle = "#f2d492";
    ctx.fillRect(px + 8, py + 13, 16, 12);
    ctx.fillStyle = "#8c3d2d";
    ctx.beginPath();
    ctx.moveTo(px + 5, py + 14);
    ctx.lineTo(px + 16, py + 5);
    ctx.lineTo(px + 27, py + 14);
    ctx.fill();
  }

  if (tile === "S" || tile === "D" || tile === "R" || tile === "C") {
    const pulse = Math.sin(animationTick / 12) * 3;
    ctx.fillStyle = tile === "C" ? "#171126" : "#f7f1d7";
    ctx.fillRect(px + 9, py + 8, 14, 18);
    ctx.fillStyle = tile === "D" ? "#ff8c42" : tile === "R" ? "#c7b8ff" : "#70f7ff";
    ctx.beginPath();
    ctx.arc(px + 16, py + 11 + pulse, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(tileX, tileY) {
  const px = tileX * TILE_SIZE;
  const py = tileY * TILE_SIZE;
  ctx.fillStyle = "#15182e";
  ctx.beginPath();
  ctx.ellipse(px + 16, py + 26, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd36a";
  ctx.fillRect(px + 10, py + 11, 12, 14);
  ctx.fillStyle = "#f7f1d7";
  ctx.fillRect(px + 11, py + 6, 10, 8);
  ctx.fillStyle = "#4156b8";
  ctx.fillRect(px + 8, py + 16, 5, 8);
  ctx.fillRect(px + 20, py + 16, 5, 8);
}

function drawMiniHud() {
  ctx.fillStyle = "rgba(10, 13, 27, 0.82)";
  ctx.fillRect(12, 12, 260, 84);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.strokeRect(12, 12, 260, 84);
  ctx.fillStyle = "#ffd36a";
  ctx.font = "700 18px Trebuchet MS, sans-serif";
  ctx.fillText("Auralis Overworld", 26, 38);
  ctx.fillStyle = "#f7f1d7";
  ctx.font = "14px Trebuchet MS, sans-serif";
  ctx.fillText(`Location: ${TILE_NAMES[currentTile()]}`, 26, 61);
  ctx.fillText(`Crystals: ${state.crystals.length}/3`, 26, 82);
}

function drawBattle() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#1b2346");
  gradient.addColorStop(1, "#080914");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  for (let i = 0; i < 80; i += 1) {
    const x = (i * 97 + animationTick * 2) % canvas.width;
    const y = (i * 53) % 250;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = "#26325c";
  ctx.fillRect(0, 360, canvas.width, 152);
  ctx.fillStyle = "#15182e";
  ctx.fillRect(0, 416, canvas.width, 96);

  livingEnemies().forEach((enemy, index) => {
    const x = 455 + index * 108;
    const y = enemy.boss ? 138 : 190 + index * 18;
    drawEnemy(enemy, x, y);
  });

  state.party.forEach((hero, index) => {
    const x = 108 + index * 100;
    const y = 292 + index * 18;
    drawHeroBattle(hero, x, y, index === state.battle.activeIndex);
  });

  ctx.fillStyle = "#ffd36a";
  ctx.font = "700 20px Trebuchet MS, sans-serif";
  ctx.fillText(`Round ${state.battle.round}`, 28, 38);
}

function drawEnemy(enemy, x, y) {
  const bob = Math.sin((animationTick + x) / 16) * 5;
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(x, y + 78, enemy.boss ? 48 : 32, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.arc(x, y + bob, enemy.boss ? 45 : 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0d1b";
  ctx.fillRect(x - 15, y - 4 + bob, 8, 8);
  ctx.fillRect(x + 7, y - 4 + bob, 8, 8);
  ctx.fillStyle = "#f7f1d7";
  ctx.font = "700 14px Trebuchet MS, sans-serif";
  ctx.fillText(enemy.name, x - 54, y + 105);
  drawBar(x - 52, y + 114, 104, 8, enemy.hp / enemy.maxHp, "#ff6b6b");
}

function drawHeroBattle(hero, x, y, active) {
  ctx.fillStyle = active ? "rgba(112, 247, 255, 0.26)" : "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(x - 28, y - 42, 70, 92);
  ctx.strokeStyle = active ? "#70f7ff" : "rgba(255, 255, 255, 0.14)";
  ctx.strokeRect(x - 28, y - 42, 70, 92);
  ctx.fillStyle = hero.hp > 0 ? hero.color : "#69708f";
  ctx.fillRect(x - 10, y - 22, 20, 42);
  ctx.fillStyle = "#f7f1d7";
  ctx.fillRect(x - 8, y - 36, 16, 16);
  ctx.fillStyle = "#0a0d1b";
  ctx.font = "700 13px Trebuchet MS, sans-serif";
  ctx.fillText(hero.name, x - 23, y + 39);
}

function drawBar(x, y, width, height, percent, color) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, width * percent), height);
}

function drawEndingOverlay() {
  ctx.fillStyle = "rgba(10, 13, 27, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffd36a";
  ctx.font = "700 42px Trebuchet MS, sans-serif";
  ctx.fillText("Auralis Restored", 218, 230);
  ctx.fillStyle = "#f7f1d7";
  ctx.font = "20px Trebuchet MS, sans-serif";
  ctx.fillText("The party returns beneath a bright crystal sky.", 184, 270);
}

function renderParty() {
  partyPanel.innerHTML = state.party
    .map(
      (hero) => `
        <article class="hero-stat">
          <div class="hero-row">
            <span class="hero-name">${hero.name}</span>
            <span class="hero-job">Lv ${hero.level} ${hero.job}</span>
          </div>
          <div class="small-label">HP ${hero.hp}/${hero.maxHp}</div>
          <div class="bar hp"><span style="width: ${(hero.hp / hero.maxHp) * 100}%"></span></div>
          <div class="small-label">MP ${hero.mp}/${hero.maxMp}</div>
          <div class="bar mp"><span style="width: ${(hero.mp / hero.maxMp) * 100}%"></span></div>
          <div class="small-label">XP ${hero.xp}/${xpNeeded(hero)}</div>
        </article>
      `
    )
    .join("");
}

function renderQuest() {
  const crystals = ["verdant", "ember", "sky"]
    .map((key) => {
      const owned = state.crystals.includes(key);
      return `<span class="crystal">${owned ? "[x]" : "[ ]"} ${CRYSTALS[key]}</span>`;
    })
    .join("");

  let objective = "Seek the three crystal guardians.";
  if (state.crystals.length === 1) {
    objective = "Two crystals remain. Train in forests and ruins if battles grow fierce.";
  }
  if (state.crystals.length === 2) {
    objective = "One crystal remains before the Shadow Spire opens.";
  }
  if (state.crystals.length === 3) {
    objective = "Challenge Lord Umbra at the Shadow Spire.";
  }
  if (state.mode === "ending") {
    objective = "Auralis is safe. Start a new game to adventure again.";
  }

  questPanel.innerHTML = `
    <div class="quest-row"><strong>Gold</strong><span>${state.gold}</span></div>
    <div class="quest-row"><strong>Items</strong><span>${state.potions} Potions / ${state.ethers} Ethers</span></div>
    <div class="quest-row"><strong>Area</strong><span>${TILE_NAMES[currentTile()]}</span></div>
    <div>${crystals}</div>
    <p>${objective}</p>
  `;
}

function renderCommands() {
  commandPanel.innerHTML = "";

  if (state.mode === "battle") {
    renderBattleCommands();
    return;
  }

  if (state.mode === "ending") {
    addCommand("New Game", resetGame);
    addCommand("Load Save", loadGame);
    return;
  }

  const location = locationAtCurrentTile();

  if (location?.type === "town") {
    addCommand("Rest at Inn", restAtInn);
    addCommand("Buy Potion (25g)", buyPotion, state.gold < 25);
    addCommand("Buy Ether (40g)", buyEther, state.gold < 40);
  }

  if (location?.type === "guardian") {
    const label = state.guardians[location.key]
      ? "Crystal Claimed"
      : `Challenge ${location.name}`;
    addCommand(label, () => challengeLocation(location.key), state.guardians[location.key]);
  }

  if (location?.type === "final") {
    addCommand(
      "Challenge Shadow Spire",
      () => challengeLocation("shadow"),
      state.crystals.length < 3 || state.guardians.shadow
    );
  }

  addCommand("Use Potion", usePotionOutsideBattle, state.potions <= 0);
  addCommand("Use Ether", useEtherOutsideBattle, state.ethers <= 0);
  addCommand("Save Game", saveGame);
}

function renderBattleCommands() {
  const hero = activeHero();
  if (!hero) {
    return;
  }

  const title = document.createElement("p");
  title.className = "small-label";
  title.textContent = `${hero.name}'s turn`;
  commandPanel.appendChild(title);

  addCommand("Attack", () => heroAction("attack"));

  if (hero.job === "Knight") {
    addCommand("Cleave (5 MP)", () => heroAction("cleave"), hero.mp < 5);
  }

  if (hero.job === "Spellblade") {
    addCommand("Spark (7 MP)", () => heroAction("spark"), hero.mp < 7);
    addCommand("Crystal Flare (14 MP)", () => heroAction("flare"), hero.mp < 14);
  }

  if (hero.job === "Sage") {
    addCommand("Cure (6 MP)", () => heroAction("cure"), hero.mp < 6);
    addCommand("Renew (14 MP)", () => heroAction("renew"), hero.mp < 14);
  }

  addCommand("Potion", () => heroAction("potion"), state.potions <= 0);
  addCommand("Ether", () => heroAction("ether"), state.ethers <= 0);
  addCommand("Guard", () => heroAction("guard"));
}

function addCommand(label, handler, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", handler);
  commandPanel.appendChild(button);
}

function renderLog() {
  logPanel.innerHTML = state.log.map((entry) => `<li>${entry}</li>`).join("");
}

document.addEventListener("keydown", (event) => {
  const keyMap = {
    ArrowUp: [0, -1],
    w: [0, -1],
    W: [0, -1],
    ArrowDown: [0, 1],
    s: [0, 1],
    S: [0, 1],
    ArrowLeft: [-1, 0],
    a: [-1, 0],
    A: [-1, 0],
    ArrowRight: [1, 0],
    d: [1, 0],
    D: [1, 0],
  };

  const move = keyMap[event.key];
  if (!move) {
    return;
  }
  event.preventDefault();
  movePlayer(move[0], move[1]);
});

document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => {
    const moves = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0],
    };
    const move = moves[button.dataset.move];
    movePlayer(move[0], move[1]);
  });
});

document.querySelector("#new-game-button").addEventListener("click", resetGame);
document.querySelector("#save-button").addEventListener("click", saveGame);
document.querySelector("#load-button").addEventListener("click", loadGame);

setInterval(() => {
  draw();
}, 120);

render();
