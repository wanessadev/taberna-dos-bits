// --- SEÇÃO DE TOAST (FIXO) ---
function mostrarToast(mensagem, tipo = 'info', duracao = 3500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = mensagem;
  toast.className = `toast-fixed show toast-${tipo}`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(esconderToast, duracao);
}

function esconderToast() {
  const toast = document.getElementById('toast');
  if (toast) toast.classList.remove('show');
}

// --- TABELA DE MELHORIAS (UPGRADES) ---
const UPGRADE_TYPES = [
  { id: 'fole', name: 'Boleador de Fole', desc: 'Esquenta a forja gerando calor passivo.', cost: 50, count: 0, passiveBonus: 10, clickBonus: 0, icon: '💨', equipped: false },
  { id: 'martelo', name: 'Martelo de Forja', desc: 'Aumenta a força dos seus cliques na bigorna.', cost: 100, count: 0, passiveBonus: 0, clickBonus: 5, icon: '🔨', equipped: false },
  { id: 'carvao', name: 'Carvão de Lava', desc: 'Fervura intensa na fornalha que gera ouro passivo.', cost: 300, count: 0, passiveBonus: 60, clickBonus: 0, icon: '🔥', equipped: false },
  { id: 'bigorna_run', name: 'Bigorna Rúnica', desc: 'Glifos rúnicos multiplicam a força do metal.', cost: 600, count: 0, passiveBonus: 0, clickBonus: 30, icon: '💎', equipped: false },
  { id: 'aprendiz', name: 'Aventureiro Aprendiz', desc: 'Contrata um ajudante para martelar ouro por você.', cost: 1500, count: 0, passiveBonus: 300, clickBonus: 0, icon: '🙋', equipped: false },
  { id: 'bencao_vul', name: 'Bênção de Vulcano', desc: 'Divindade do fogo concede poder supremo à oficina.', cost: 8000, count: 0, passiveBonus: 1500, clickBonus: 0, icon: '✨', equipped: false }
];

// --- FAIXAS DE RANKING (XP / NÍVEIS) ---
const RANKS = [
  { name: 'MADEIRA', minXp: 0, maxXp: 500, color: '#a17c58' },
  { name: 'PEDRA', minXp: 500, maxXp: 2500, color: '#7a828a' },
  { name: 'COBRE', minXp: 2500, maxXp: 10000, color: '#cc6633' },
  { name: 'FERRO', minXp: 10000, maxXp: 50000, color: '#4a4e52' },
  { name: 'OURO', minXp: 50000, maxXp: 250000, color: '#ffd700' },
  { name: 'CRISTAL', minXp: 250000, maxXp: Infinity, color: '#9d4edd' }
];

// --- ESTADO DO JOGO ---
let gameState = {
  gold: 0,
  xp: 0,
  upgrades: JSON.parse(JSON.stringify(UPGRADE_TYPES)), // Cópia profunda
  lastSaveTime: Date.now()
};

let currentHudTab = 'market'; // 'market' ou 'arsenal'

// --- SVGS DILIGENTES PARA A FORJA ---
const FORGE_SVGS = {
  MADEIRA: `
    <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
      <!-- Colunas de suporte de madeira rústica nas laterais -->
      <rect x="10" y="24" width="6" height="32" fill="#5a3d28"/>
      <rect x="8" y="28" width="2" height="28" fill="#422c1d"/>
      <rect x="48" y="24" width="6" height="32" fill="#5a3d28"/>
      <rect x="54" y="28" width="2" height="28" fill="#422c1d"/>
      <!-- Viga superior de madeira -->
      <rect x="8" y="20" width="48" height="6" fill="#6d4930"/>
      <rect x="12" y="22" width="4" height="2" fill="#321e10"/>
      <rect x="40" y="21" width="3" height="1" fill="#321e10"/>
      <!-- Obscurecimento suave da fornalha nativa para destacar o fogo -->
      <rect x="20" y="32" width="24" height="24" fill="#000" opacity="0.3"/>
      <!-- Fogo animado personalizado -->
      <g class="fire-layer">
        <path d="M26,56 Q32,36 38,56 Z" fill="#d946ef" opacity="0.85"/>
        <path d="M27,56 Q32,42 37,56 Z" fill="#ea580c"/>
        <path d="M29,56 Q32,48 35,56 Z" fill="#facc15"/>
      </g>
    </svg>
  `,
  PEDRA: `
    <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
      <!-- Colunas de pedra lavrada cinza -->
      <rect x="10" y="24" width="6" height="32" fill="#7a828a"/>
      <rect x="8" y="28" width="2" height="28" fill="#474d52"/>
      <rect x="48" y="24" width="6" height="32" fill="#7a828a"/>
      <rect x="54" y="28" width="2" height="28" fill="#474d52"/>
      <!-- Viga superior de pedra cinza -->
      <rect x="8" y="20" width="48" height="6" fill="#61686e"/>
      <rect x="12" y="22" width="4" height="2" fill="#374151"/>
      <rect x="42" y="21" width="3" height="1" fill="#374151"/>
      <!-- Detalhes de pedra rachada -->
      <rect x="11" y="32" width="2" height="4" fill="#474d52"/>
      <rect x="51" y="40" width="2" height="4" fill="#474d52"/>
      <!-- Fundo escuro do nicho -->
      <rect x="20" y="30" width="24" height="26" fill="#000" opacity="0.45"/>
      <!-- Fogo de Pedra (Chamas Laranja e Amarelas Fortes) -->
      <g class="fire-layer">
        <path d="M24,56 Q32,28 40,56 Z" fill="#ea580c"/>
        <path d="M26,56 Q32,36 38,56 Z" fill="#f97316"/>
        <path d="M28,56 Q32,44 36,56 Z" fill="#fbbf24"/>
      </g>
    </svg>
  `,
  COBRE: `
    <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
      <!-- Tubos e Colunas de Cobre Brilhante -->
      <rect x="10" y="22" width="6" height="34" fill="#b45309"/>
      <rect x="11" y="22" width="2" height="34" fill="#f59e0b"/>
      <rect x="48" y="22" width="6" height="34" fill="#b45309"/>
      <rect x="51" y="22" width="2" height="34" fill="#f59e0b"/>
      <!-- Viga superior com canos horizontais -->
      <rect x="8" y="18" width="48" height="4" fill="#b45309"/>
      <rect x="8" y="19" width="48" height="1.5" fill="#f59e0b"/>
      <!-- Válvulas e Medidores (Gauges) -->
      <!-- Indicador Esquerdo -->
      <rect x="12" y="30" width="4" height="4" fill="#374151"/>
      <rect x="13" y="31" width="2" height="2" fill="#fff"/>
      <rect x="14" y="31" width="1" height="1" fill="#ef4444"/>
      <!-- Indicador Direito -->
      <rect x="48" y="38" width="4" height="4" fill="#374151"/>
      <rect x="49" y="39" width="2" height="2" fill="#fff"/>
      <!-- Fundo de calor e chamas com tons verdes/cobre -->
      <rect x="20" y="28" width="24" height="28" fill="#000" opacity="0.45"/>
      <g class="fire-layer">
        <path d="M22,56 Q32,24 42,56 Z" fill="#b45309"/>
        <path d="M24,56 Q32,30 40,56 Z" fill="#ea580c"/>
        <path d="M27,56 Q32,40 37,56 Z" fill="#34d399"/> <!-- Chamas verde-cobre mágicas -->
      </g>
    </svg>
  `,
  FERRO: `
    <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
      <!-- Colunas e Vigas de Ferro Fundido -->
      <rect x="10" y="20" width="6" height="36" fill="#1f2937"/>
      <rect x="12" y="20" width="2" height="36" fill="#4b5563"/>
      <rect x="48" y="20" width="6" height="36" fill="#1f2937"/>
      <rect x="50" y="20" width="2" height="36" fill="#4b5563"/>
      <!-- Viga transversal superior com rebites -->
      <rect x="8" y="16" width="48" height="6" fill="#111827"/>
      <rect x="8" y="17" width="48" height="1" fill="#4b5563"/>
      <!-- Rebites nas colunas -->
      <rect x="12" y="24" width="2" height="2" fill="#4b5563"/>
      <rect x="12" y="38" width="2" height="2" fill="#4b5563"/>
      <rect x="50" y="24" width="2" height="2" fill="#4b5563"/>
      <rect x="50" y="38" width="2" height="2" fill="#4b5563"/>
      <!-- Correntes de Ferro suspensas nas laterais -->
      <path d="M12,22 C15,25 15,29 12,32" stroke="#4b5563" stroke-width="1.5" fill="none"/>
      <path d="M52,22 C49,25 49,29 52,32" stroke="#4b5563" stroke-width="1.5" fill="none"/>
      <!-- Grelha protetora de Ferro (Grate) na frente do fogo -->
      <rect x="22" y="44" width="20" height="2" fill="#374151"/>
      <rect x="22" y="52" width="20" height="2" fill="#374151"/>
      <rect x="24" y="42" width="2" height="14" fill="#1f2937"/>
      <rect x="29" y="42" width="2" height="14" fill="#1f2937"/>
      <rect x="34" y="42" width="2" height="14" fill="#1f2937"/>
      <rect x="39" y="42" width="2" height="14" fill="#1f2937"/>
      <!-- Fundo e fogo de alta temperatura (Chamas de Ferro Azuladas) -->
      <rect x="20" y="26" width="24" height="30" fill="#000" opacity="0.4"/>
      <g class="fire-layer">
        <path d="M20,56 Q32,20 44,56 Z" fill="#ea580c"/>
        <path d="M23,56 Q32,28 41,56 Z" fill="#facc15"/>
        <path d="M26,56 Q32,45 38,56 Z" fill="#3b82f6"/> <!-- Núcleo azul ultra quente -->
      </g>
    </svg>
  `,
  OURO: `
    <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
      <!-- Moldura e Colunata de Ouro Maciço Real com detalhes dourados -->
      <rect x="10" y="20" width="6" height="36" fill="#d97706"/>
      <rect x="11" y="20" width="4" height="36" fill="#fbbf24"/>
      <rect x="12" y="20" width="1.5" height="36" fill="#fef08a"/>
      <rect x="48" y="20" width="6" height="36" fill="#d97706"/>
      <rect x="49" y="20" width="4" height="36" fill="#fbbf24"/>
      <rect x="50" y="20" width="1.5" height="36" fill="#fef08a"/>
      <!-- Entablamento Dourado Superior -->
      <rect x="8" y="15" width="48" height="6" fill="#d97706"/>
      <rect x="8" y="16" width="48" height="2" fill="#fbbf24"/>
      <rect x="8" y="18" width="48" height="1" fill="#fef08a"/>
      <!-- Gemas Vermelhas (Rubis) lapidadas engastadas nas colunas -->
      <polygon points="13,28 15,26 15,30" fill="#ef4444"/>
      <rect x="13" y="27" width="1" height="2" fill="#fecaca"/>
      <polygon points="51,28 49,26 49,30" fill="#ef4444"/>
      <rect x="50" y="27" width="1" height="2" fill="#fecaca"/>
      <!-- Adorno em Arco de Filigrana -->
      <path d="M16,21 Q32,16 48,21" stroke="#fbbf24" stroke-width="1.5" fill="none"/>
      <!-- Fundo brilhante e fogo radiante de Ouro -->
      <rect x="18" y="26" width="28" height="30" fill="#000" opacity="0.45"/>
      <g class="fire-layer">
        <path d="M20,56 Q32,18 44,56 Z" fill="#dc2626"/>
        <path d="M22,56 Q32,25 42,56 Z" fill="#f97316"/>
        <path d="M25,56 Q32,32 39,56 Z" fill="#fbbf24"/>
      </g>
    </svg>
  `,
  CRISTAL: `
    <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
      <!-- Pilares Rúnicos de Rocha Negra / Obsidiana com Cristais Roxo -->
      <rect x="10" y="20" width="6" height="36" fill="#1a0033"/>
      <rect x="48" y="20" width="6" height="36" fill="#1a0033"/>
      <!-- Cristais mágicos emergindo nas laterais -->
      <!-- Esquerda: Cristal Roxo e Azul Celeste -->
      <polygon points="10,24 3,20 10,28" fill="#c77dff" opacity="0.9"/>
      <polygon points="10,24 6,22 10,26" fill="#e0aaff"/>
      <polygon points="10,38 1,36 10,42" fill="#60a5fa" opacity="0.9"/>
      <polygon points="10,38 5,37 10,40" fill="#e0f2fe"/>
      <!-- Direita: Cristal Roxo e Azul Celeste -->
      <polygon points="54,24 61,20 54,28" fill="#c77dff" opacity="0.9"/>
      <polygon points="54,24 58,22 54,26" fill="#e0aaff"/>
      <polygon points="54,38 63,36 54,42" fill="#60a5fa" opacity="0.9"/>
      <polygon points="54,38 59,37 54,40" fill="#e0f2fe"/>
      <!-- Lintéis de Obsidiana com Runas mágicas gravadas e brilhantes -->
      <rect x="8" y="15" width="48" height="6" fill="#2d004d"/>
      <rect x="14" y="17" width="3" height="2" fill="#a5f3fc" opacity="0.85"/>
      <rect x="22" y="17" width="2" height="2" fill="#a5f3fc" opacity="0.85"/>
      <rect x="30" y="17" width="4" height="2" fill="#a5f3fc" opacity="0.85"/>
      <rect x="40" y="17" width="2" height="2" fill="#a5f3fc" opacity="0.85"/>
      <rect x="46" y="17" width="3" height="2" fill="#a5f3fc" opacity="0.85"/>
      <!-- Fundo de energia mágica e fogo cósmico (Roxo, Ciano e Lilás) -->
      <rect x="18" y="26" width="28" height="30" fill="#000" opacity="0.5"/>
      <g class="fire-layer">
        <path d="M20,56 Q32,15 44,56 Z" fill="#7b2cbf"/>
        <path d="M22,56 Q32,25 42,56 Z" fill="#2563eb"/>
        <path d="M25,56 Q32,35 39,56 Z" fill="#c084fc"/>
      </g>
    </svg>
  `
};

// --- GAME LOOP ---
setInterval(() => {
  if (gameState.gold === undefined) return;

  const passiveRate = obterTotalOuroPassivo();
  if (passiveRate > 0) {
    const ganho = passiveRate / 3600;
    gameState.gold += ganho;
    gameState.xp += ganho;

    atualizarUI();
  }
}, 1000);

// --- AUTO SAVE ---
setInterval(() => {
  salvarJogo();
}, 5000);

function salvarJogo() {
  gameState.lastSaveTime = Date.now();
  localStorage.setItem('taberna_idle_state', JSON.stringify(gameState));
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  const salvo = localStorage.getItem('taberna_idle_state');
  if (salvo) {
    try {
      const parsed = JSON.parse(salvo);
      if (parsed) {
        gameState.gold = parsed.gold || 0;
        gameState.xp = parsed.xp || 0;
        if (parsed.upgrades) {
          parsed.upgrades.forEach(uSalvo => {
            const uState = gameState.upgrades.find(x => x.id === uSalvo.id);
            if (uState) {
              uState.count = uSalvo.count || 0;
              uState.equipped = uSalvo.equipped || false;
              uState.cost = uSalvo.cost || uState.cost;
            }
          });
        }
        gameState.lastSaveTime = parsed.lastSaveTime || Date.now();
      }
    } catch (e) {
      console.error("Falha ao restaurar save local:", e);
    }
  }

  // Ganhos offline
  const now = Date.now();
  const tempoOfflineSec = (now - gameState.lastSaveTime) / 1000;
  const passiveRate = obterTotalOuroPassivo();

  if (tempoOfflineSec > 10 && passiveRate > 0) {
    const ouroGanho = Math.floor(tempoOfflineSec * (passiveRate / 3600));
    if (ouroGanho > 0) {
      gameState.gold += ouroGanho;
      gameState.xp += ouroGanho;
      
      document.getElementById('offline-message').innerHTML = `
        Sua forja gerou <span class="status-value">🪙 ${ouroGanho} de ouro</span> enquanto você esteve fora da guilda!
      `;
      openModal('offline');
    }
  }

  atualizarUI();
  renderizarHudTab();
  
  window.addEventListener('beforeunload', () => {
    salvarJogo();
  });
});

// --- CLICK ENGINE ---
function handleAnvilClick(event) {
  const clickPower = obterTotalClick();
  gameState.gold += clickPower;
  gameState.xp += clickPower;

  // Floating text indicator
  const anvilWrapper = document.getElementById('anvil-wrapper');
  const rect = anvilWrapper.getBoundingClientRect();
  
  const floating = document.createElement('div');
  floating.className = 'floating-points';
  floating.textContent = `+${clickPower}`;
  
  const leftPos = event ? event.clientX - rect.left : rect.width / 2;
  const topPos = event ? event.clientY - rect.top : rect.height / 2;
  
  floating.style.left = `${leftPos}px`;
  floating.style.top = `${topPos}px`;
  
  anvilWrapper.appendChild(floating);
  setTimeout(() => floating.remove(), 700);

  atualizarUI();
}

// --- RATE GETTERS ---
function obterTotalOuroPassivo() {
  let rate = 0;
  gameState.upgrades.forEach(u => {
    if (u.equipped) {
      rate += (u.count * u.passiveBonus);
    }
  });
  return rate;
}

function obterTotalClick() {
  let power = 1;
  gameState.upgrades.forEach(u => {
    if (u.equipped) {
      power += (u.count * u.clickBonus);
    }
  });
  return power;
}

// --- RANK SYSTEM ---
function obterRankAtual() {
  const xp = gameState.xp;
  let rankAtual = RANKS[0];
  
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXp) {
      rankAtual = RANKS[i];
    }
  }
  return rankAtual;
}

function atualizarForja(rankName) {
  const container = document.getElementById('forge-container');
  if (container.getAttribute('data-current-rank') !== rankName) {
    container.innerHTML = FORGE_SVGS[rankName] || FORGE_SVGS.MADEIRA;
    container.setAttribute('data-current-rank', rankName);
  }
}

// --- CORE UI UPDATER ---
function atualizarUI() {
  document.getElementById('total-gold').textContent = Math.floor(gameState.gold);
  document.getElementById('passive-gold-rate').textContent = obterTotalOuroPassivo();

  const rank = obterRankAtual();
  document.getElementById('rank-name').textContent = `NÍVEL: ${rank.name}`;
  document.getElementById('rank-name').style.color = rank.color;

  const xpText = document.getElementById('xp-text');
  const xpFill = document.getElementById('xp-fill');

  if (rank.maxXp === Infinity) {
    xpText.textContent = `${Math.floor(gameState.xp)} XP (NÍVEL MÁXIMO)`;
    xpFill.style.width = '100%';
  } else {
    const range = rank.maxXp - rank.minXp;
    const progress = gameState.xp - rank.minXp;
    const percentage = Math.max(0, Math.min(100, (progress / range) * 100));

    xpText.textContent = `${Math.floor(gameState.xp)} / ${rank.maxXp} XP`;
    xpFill.style.width = `${percentage}%`;
  }

  atualizarForja(rank.name);

  // Slots
  const slotsEquipados = gameState.upgrades.filter(u => u.equipped);
  for (let i = 0; i < 4; i++) {
    const slotEl = document.getElementById(`slot-${i}`);
    if (slotsEquipados[i]) {
      slotEl.textContent = slotsEquipados[i].icon;
      slotEl.className = 'active-upgrade-slot equipped';
      slotEl.title = `${slotsEquipados[i].name} (x${slotsEquipados[i].count})`;
    } else {
      slotEl.textContent = '';
      slotEl.className = 'active-upgrade-slot';
      slotEl.title = 'Vazio';
    }
  }

  // Atualizar a aba da Loja e do Arsenal inline
  renderizarHudTab();
}

// --- HUD INTEGRADO INLINE TABS ---
function switchHudTab(tabId) {
  if (currentHudTab === tabId) return;
  currentHudTab = tabId;

  document.getElementById('tab-btn-market').classList.toggle('active', tabId === 'market');
  document.getElementById('tab-btn-arsenal').classList.toggle('active', tabId === 'arsenal');

  renderizarHudTab();
}

function renderizarHudTab() {
  const container = document.getElementById('hud-tab-content');
  if (!container) return;

  container.innerHTML = '';

  if (currentHudTab === 'market') {
    gameState.upgrades.forEach(u => {
      const row = document.createElement('div');
      row.className = `upgrade-row ${u.equipped ? 'equipped' : ''}`;
      
      const goldBonusText = u.passiveBonus > 0 ? `+${u.passiveBonus} ouro/h` : `+${u.clickBonus} por clique`;
      const canBuy = gameState.gold >= u.cost;

      row.innerHTML = `
        <div class="upgrade-icon" title="${u.desc}">${u.icon}</div>
        <div class="upgrade-details">
          <div class="upgrade-name">${u.name}</div>
          <div class="upgrade-effect">${goldBonusText}</div>
          <div class="upgrade-cost">🪙 ${u.cost}</div>
        </div>
        <button class="upgrade-action-btn btn-buy" onclick="comprarUpgrade('${u.id}')" ${canBuy ? '' : 'disabled'}>
          COMPRAR
        </button>
      `;
      container.appendChild(row);
    });
  } else if (currentHudTab === 'arsenal') {
    const itensPossuidos = gameState.upgrades.filter(u => u.count > 0);

    if (itensPossuidos.length === 0) {
      container.innerHTML = '<div class="info-empty">Nenhum equipamento adquirido. Visite a Loja!</div>';
      return;
    }

    itensPossuidos.forEach(u => {
      const row = document.createElement('div');
      row.className = `upgrade-row ${u.equipped ? 'equipped' : ''}`;

      const totalBonusText = u.passiveBonus > 0 
        ? `Total: +${u.passiveBonus * u.count} ouro/h` 
        : `Total: +${u.clickBonus * u.count} p/ clique`;

      let actionButton = '';
      if (u.equipped) {
        actionButton = `<button class="upgrade-action-btn btn-unequip" onclick="desequiparUpgrade('${u.id}')">REMOVER</button>`;
      } else {
        const totalEquipped = gameState.upgrades.filter(x => x.equipped).length;
        const canEquip = totalEquipped < 4;
        actionButton = `<button class="upgrade-action-btn btn-equip" onclick="equiparUpgrade('${u.id}')" ${canEquip ? '' : 'disabled'}>EQUIPAR</button>`;
      }

      row.innerHTML = `
        <div class="upgrade-icon" title="${u.desc}">${u.icon}</div>
        <div class="upgrade-details">
          <div class="upgrade-name">${u.name}</div>
          <div class="upgrade-count">Qtd: ${u.count}</div>
          <div class="upgrade-effect">${totalBonusText}</div>
        </div>
        ${actionButton}
      `;
      container.appendChild(row);
    });
  }
}

// --- ACOES DO UPGRADE DE HUD ---
function comprarUpgrade(id) {
  const item = gameState.upgrades.find(x => x.id === id);
  if (gameState.gold >= item.cost) {
    gameState.gold -= item.cost;
    item.count++;
    item.cost = Math.floor(item.cost * 1.3);

    mostrarToast(`✔ ${item.name} adquirido!`, 'ok');
    atualizarUI();
    salvarJogo();
  } else {
    mostrarToast('✖ Ouro insuficiente!', 'erro');
  }
}

function equiparUpgrade(id) {
  const item = gameState.upgrades.find(x => x.id === id);
  const totalEquipped = gameState.upgrades.filter(u => u.equipped).length;

  if (totalEquipped < 4) {
    item.equipped = true;
    mostrarToast(`🛡️ ${item.name} equipado!`, 'ok');
    atualizarUI();
    salvarJogo();
  } else {
    mostrarToast('✖ Limite de slots atingido!', 'erro');
  }
}

function desequiparUpgrade(id) {
  const item = gameState.upgrades.find(x => x.id === id);
  item.equipped = false;
  mostrarToast(`📦 ${item.name} guardado.`, 'info');
  atualizarUI();
  salvarJogo();
}

// --- CONFIGURAÇÕES E MODAIS DE SISTEMA ---
function openModal(modalId) {
  const modal = document.getElementById(`${modalId}-modal`);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(`${modalId}-modal`);
  if (modal) modal.classList.remove('active');
}

// --- LIMPAR PROGRESSO (DEBUG/TESTE) ---
function resetProgress() {
  if (confirm("Deseja realmente resetar TODO o progresso da oficina?")) {
    gameState.gold = 0;
    gameState.xp = 0;
    gameState.upgrades = JSON.parse(JSON.stringify(UPGRADE_TYPES));
    gameState.lastSaveTime = Date.now();

    localStorage.removeItem('taberna_idle_state');
    salvarJogo();

    mostrarToast('✔ Oficina resetada com sucesso!', 'ok');
    atualizarUI();
  }
}

// --- INSTA LEVEL UP DEBUG ---
function instaLevelUp() {
  let nextRank = null;

  for (let i = 0; i < RANKS.length; i++) {
    if (gameState.xp < RANKS[i].minXp) {
      nextRank = RANKS[i];
      break;
    }
  }

  if (!nextRank) {
    gameState.gold += 50000;
    gameState.xp += 50000;
    mostrarToast('✨ Adicionado +50.000 ouro/XP!', 'ok');
  } else {
    const diff = nextRank.minXp - gameState.xp + 1;
    gameState.gold += diff;
    gameState.xp += diff;
    mostrarToast(`✨ Nível avançado para ${nextRank.name}!`, 'ok');
  }

  atualizarUI();
  salvarJogo();
}
