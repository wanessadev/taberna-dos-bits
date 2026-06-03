// --- SEÇÃO DE TOAST ---
function mostrarToast(mensagem, tipo = 'info', duracao = 3500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = mensagem;
  toast.className = `toast show toast-${tipo}`;
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

let activeSelectedId = null;

// --- SVGS DILIGENTES PARA A FORJA ---
const FORGE_SVGS = {
  MADEIRA: `
    <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
      <!-- Fundo de pedra cinza rachado -->
      <rect x="16" y="24" width="32" height="32" fill="#555"/>
      <rect x="14" y="28" width="36" height="28" fill="#444"/>
      
      <!-- Suportes de Madeira podre nas laterais -->
      <rect x="10" y="24" width="6" height="32" fill="#5a3d28"/>
      <rect x="8" y="28" width="2" height="28" fill="#422c1d"/>
      <rect x="48" y="24" width="6" height="32" fill="#5a3d28"/>
      <rect x="54" y="28" width="2" height="28" fill="#422c1d"/>
      
      <!-- Viga superior de madeira com rachaduras -->
      <rect x="8" y="20" width="48" height="6" fill="#6d4930"/>
      <rect x="12" y="22" width="4" height="2" fill="#321e10"/>
      <rect x="40" y="21" width="3" height="1" fill="#321e10"/>

      <!-- Entrada da Fornalha -->
      <rect x="22" y="32" width="20" height="24" fill="#000"/>
      <!-- Fogo fraco de madeira -->
      <g class="fire-layer">
        <path d="M26,56 Q32,36 38,56 Z" fill="#d946ef"/>
        <path d="M27,56 Q32,42 37,56 Z" fill="#ea580c"/>
        <path d="M29,56 Q32,48 35,56 Z" fill="#facc15"/>
      </g>
      <!-- Detalhes de teias de aranha -->
      <rect x="16" y="26" width="4" height="1" fill="#bbb" opacity="0.5"/>
      <rect x="16" y="27" width="1" height="4" fill="#bbb" opacity="0.5"/>
    </svg>
  `,
  PEDRA: `
    <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
      <!-- Estrutura de pedra cinza completa -->
      <rect x="16" y="16" width="32" height="40" fill="#7a828a"/>
      <rect x="12" y="24" width="40" height="32" fill="#61686e"/>
      <rect x="8" y="36" width="48" height="20" fill="#474d52"/>

      <!-- Chaminé reta de pedra -->
      <rect x="24" y="0" width="16" height="16" fill="#7a828a"/>
      <rect x="22" y="2" width="20" height="3" fill="#474d52"/>

      <!-- Detalhes de Tijolos -->
      <rect x="18" y="20" width="6" height="3" fill="#9ca3af"/>
      <rect x="40" y="28" width="6" height="3" fill="#9ca3af"/>
      <rect x="14" y="44" width="8" height="4" fill="#374151"/>

      <!-- Entrada de Forja com Arco -->
      <rect x="20" y="30" width="24" height="26" fill="#000"/>
      
      <!-- Fogo regular -->
      <g class="fire-layer">
        <path d="M24,56 Q32,28 40,56 Z" fill="#ea580c"/>
        <path d="M26,56 Q32,36 38,56 Z" fill="#f97316"/>
        <path d="M28,56 Q32,44 36,56 Z" fill="#fbbf24"/>
      </g>
    </svg>
  `,
  COBRE: `
    <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
      <!-- Forja de pedra -->
      <rect x="16" y="16" width="32" height="40" fill="#7a828a"/>
      <rect x="12" y="24" width="40" height="32" fill="#61686e"/>
      <rect x="8" y="36" width="48" height="20" fill="#474d52"/>
      <rect x="24" y="0" width="16" height="16" fill="#7a828a"/>

      <!-- Reforços e Tubos de Cobre Dourado -->
      <rect x="20" y="10" width="24" height="4" fill="#b45309"/>
      <rect x="22" y="8" width="20" height="2" fill="#d97706"/>
      <rect x="10" y="24" width="4" height="32" fill="#b45309"/>
      <rect x="50" y="24" width="4" height="32" fill="#b45309"/>
      
      <!-- Rebites nos tubos de cobre -->
      <rect x="11" y="28" width="2" height="2" fill="#f59e0b"/>
      <rect x="11" y="40" width="2" height="2" fill="#f59e0b"/>
      <rect x="51" y="28" width="2" height="2" fill="#f59e0b"/>
      <rect x="51" y="40" width="2" height="2" fill="#f59e0b"/>

      <!-- Entrada de Forja -->
      <rect x="20" y="28" width="24" height="28" fill="#000"/>
      <!-- Fogo forte com faíscas cobre -->
      <g class="fire-layer">
        <path d="M22,56 Q32,24 42,56 Z" fill="#e11d48"/>
        <path d="M24,56 Q32,30 40,56 Z" fill="#ea580c"/>
        <path d="M27,56 Q32,40 37,56 Z" fill="#facc15"/>
      </g>
    </svg>
  `,
  FERRO: `
    <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
      <!-- Estrutura de Ferro Negro Reforçado -->
      <rect x="14" y="12" width="36" height="44" fill="#374151"/>
      <rect x="10" y="20" width="44" height="36" fill="#1f2937"/>
      <rect x="6" y="32" width="52" height="24" fill="#111827"/>
      
      <!-- Chaminé industrial com aneis de ferro -->
      <rect x="22" y="0" width="20" height="12" fill="#374151"/>
      <rect x="20" y="4" width="24" height="3" fill="#111827"/>
      <rect x="20" y="9" width="24" height="3" fill="#111827"/>

      <!-- Detalhes de Grades e Escudos de Aço -->
      <rect x="14" y="22" width="6" height="6" fill="#4b5563"/>
      <rect x="44" y="22" width="6" height="6" fill="#4b5563"/>

      <!-- Entrada de Forja industrial em arco -->
      <rect x="18" y="26" width="28" height="30" fill="#000"/>
      <!-- Fogo super quente (chama azul na base) -->
      <g class="fire-layer">
        <path d="M20,56 Q32,20 44,56 Z" fill="#ea580c"/>
        <path d="M23,56 Q32,28 41,56 Z" fill="#facc15"/>
        <path d="M26,56 Q32,45 38,56 Z" fill="#60a5fa"/> <!-- Chama azul de alta temperatura -->
      </g>
    </svg>
  `,
  OURO: `
    <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
      <!-- Forja folheada a ouro reluzente -->
      <rect x="14" y="12" width="36" height="44" fill="#d97706"/>
      <rect x="10" y="20" width="44" height="36" fill="#f59e0b"/>
      <rect x="6" y="32" width="52" height="24" fill="#d97706"/>
      
      <!-- Chaminé majestosa com cúpula dourada -->
      <rect x="22" y="0" width="20" height="12" fill="#f59e0b"/>
      <rect x="18" y="0" width="28" height="3" fill="#fbbf24"/>
      
      <!-- Pilares laterais dourados -->
      <rect x="8" y="20" width="4" height="36" fill="#fbbf24"/>
      <rect x="52" y="20" width="4" height="36" fill="#fbbf24"/>

      <!-- Detalhes de pedras preciosas vermelhas embutidas -->
      <rect x="9" y="30" width="2" height="4" fill="#dc2626"/>
      <rect x="53" y="30" width="2" height="4" fill="#dc2626"/>

      <!-- Entrada de Forja com portal dourado -->
      <rect x="18" y="26" width="28" height="30" fill="#000"/>
      <!-- Fogo divino brilhante -->
      <g class="fire-layer">
        <path d="M20,56 Q32,18 44,56 Z" fill="#dc2626"/>
        <path d="M22,56 Q32,25 42,56 Z" fill="#f97316"/>
        <path d="M25,56 Q32,32 39,56 Z" fill="#fef08a"/>
      </g>
    </svg>
  `,
  CRISTAL: `
    <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
      <!-- Forja lendária de obsidiana e cristal mágico -->
      <rect x="14" y="12" width="36" height="44" fill="#2d004d"/>
      <rect x="10" y="20" width="44" height="36" fill="#1a0033"/>
      <rect x="6" y="32" width="52" height="24" fill="#0c001f"/>
      
      <!-- Chaminé esculpida em cristal com fumaça estelar -->
      <rect x="22" y="0" width="20" height="12" fill="#2d004d"/>
      <rect x="20" y="4" width="24" height="4" fill="#9d4edd"/>
      
      <!-- Cristais roxos e azuis brotando das laterais -->
      <polygon points="6,40 10,32 10,48" fill="#a2d2ff" class="magical-glow"/>
      <polygon points="58,40 54,32 54,48" fill="#a2d2ff" class="magical-glow"/>
      <polygon points="10,24 14,18 14,30" fill="#c77dff" class="magical-glow"/>
      <polygon points="54,24 50,18 50,30" fill="#c77dff" class="magical-glow"/>

      <!-- Entrada da Fornalha -->
      <rect x="18" y="26" width="28" height="30" fill="#000"/>
      
      <!-- Fogo cósmico/mágico (cores roxa, azul e branca) -->
      <g class="fire-layer">
        <path d="M20,56 Q32,15 44,56 Z" fill="#7b2cbf"/>
        <path d="M22,56 Q32,25 42,56 Z" fill="#3a86c8"/>
        <path d="M25,56 Q32,35 39,56 Z" fill="#e0aaff"/>
      </g>
    </svg>
  `
};

// --- FUNÇÃO DO LOOP DO JOGO (TICK DE 1 SEGUNDO) ---
setInterval(() => {
  if (gameState.gold === undefined) return;

  const passiveRate = obterTotalOuroPassivo();
  if (passiveRate > 0) {
    const ganho = passiveRate / 3600; // Fração de ouro gerado em 1s
    gameState.gold += ganho;
    gameState.xp += ganho;

    atualizarUI();
  }
}, 1000);

// --- SALVAR AUTOMÁTICO EM LOCAL STORAGE ---
setInterval(() => {
  salvarJogo();
}, 5000);

function salvarJogo() {
  gameState.lastSaveTime = Date.now();
  localStorage.setItem('taberna_idle_state', JSON.stringify(gameState));
}

// --- CARREGAR JOGO E CALCULAR PRODUTIVIDADE OFFLINE ---
document.addEventListener('DOMContentLoaded', async () => {
  // Inicialização básica do Supabase (para evitar erros se não estiver logado)
  let loggedInUser = null;
  if (typeof supabase !== 'undefined' && supabase) {
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      loggedInUser = u;
    } catch(e) {
      console.warn("Sem conexão Supabase autenticada na sandbox.");
    }
  }

  const salvo = localStorage.getItem('taberna_idle_state');
  if (salvo) {
    try {
      const parsed = JSON.parse(salvo);
      if (parsed) {
        gameState.gold = parsed.gold || 0;
        gameState.xp = parsed.xp || 0;
        // Se as chaves de upgrade do salvo forem antigas, mescla com as novas
        if (parsed.upgrades) {
          parsed.upgrades.forEach(uSalvo => {
            const uState = gameState.upgrades.find(x => x.id === uSalvo.id);
            if (uState) {
              uState.count = uSalvo.count || 0;
              uState.equipped = uSalvo.equipped || false;
              uState.cost = uSalvo.cost || uState.cost; // Preserva inflação do custo se comprado
            }
          });
        }
        gameState.lastSaveTime = parsed.lastSaveTime || Date.now();
      }
    } catch (e) {
      console.error("Falha ao restaurar save local:", e);
    }
  }

  // Calcular ganhos offline
  const now = Date.now();
  const tempoOfflineSec = (now - gameState.lastSaveTime) / 1000;
  const passiveRate = obterTotalOuroPassivo();

  if (tempoOfflineSec > 10 && passiveRate > 0) {
    const ouroGanho = Math.floor(tempoOfflineSec * (passiveRate / 3600));
    if (ouroGanho > 0) {
      gameState.gold += ouroGanho;
      gameState.xp += ouroGanho;
      
      // Mostrar Popup offline
      document.getElementById('offline-message').innerHTML = `
        Sua forja gerou <span class="status-value">🪙 ${ouroGanho} de ouro</span> enquanto você esteve fora da guilda!
      `;
      openModal('offline');
    }
  }

  atualizarUI();
  
  // Garantir que salva ao fechar a aba
  window.addEventListener('beforeunload', () => {
    salvarJogo();
  });
});

// --- OPERAÇÕES DA BIGORNA (CLIQUE MANUAL) ---
function handleAnvilClick(event) {
  const clickPower = obterTotalClick();
  gameState.gold += clickPower;
  gameState.xp += clickPower;

  // Criar indicador flutuante na posição do clique
  const anvilWrapper = document.getElementById('anvil-wrapper');
  const rect = anvilWrapper.getBoundingClientRect();
  
  // Spawn do texto flutuante
  const floating = document.createElement('div');
  floating.className = 'floating-points';
  floating.textContent = `+${clickPower}`;
  
  // Posicionar próximo ao clique ou no centro da bigorna
  const leftPos = event ? event.clientX - rect.left : rect.width / 2;
  const topPos = event ? event.clientY - rect.top : rect.height / 2;
  
  floating.style.left = `${leftPos}px`;
  floating.style.top = `${topPos}px`;
  
  anvilWrapper.appendChild(floating);
  
  // Remover após animação terminar
  setTimeout(() => floating.remove(), 700);

  atualizarUI();
}

// --- CÁLCULO DE ATRIBUTOS ---
function obterTotalOuroPassivo() {
  let rate = 0;
  gameState.upgrades.forEach(u => {
    if (u.equipped) {
      rate += (u.count * u.passiveBonus);
    }
  });
  return rate;
}

// Click Power
function obterTotalClick() {
  let power = 1; // Click base
  gameState.upgrades.forEach(u => {
    if (u.equipped) {
      power += (u.count * u.clickBonus);
    }
  });
  return power;
}

// --- DETERMINAR NÍVEL / RANKING E RENDERIZAR A FORJA ---
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

// --- ATUALIZAÇÃO GERAL DA RELAÇÃO COM A UI ---
function atualizarUI() {
  // 1. Contador de Ouro
  document.getElementById('total-gold').textContent = Math.floor(gameState.gold);
  document.getElementById('passive-gold-rate').textContent = obterTotalOuroPassivo();

  // 2. XP & Níveis
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

  // Renderizar o SVG da Forja correspondente
  atualizarForja(rank.name);

  // 3. Atualizar Slots Ativos na Esquerda (MELHORIAS ATIVAS)
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
}

// --- MODAIS / POPUPS DE NAVEGAÇÃO ---
function openModal(modalId) {
  const modal = document.getElementById(`${modalId}-modal`);
  if (!modal) return;
  
  modal.classList.add('active');
  activeSelectedId = null;

  // Carregar dados de grades internas do modal
  if (modalId === 'market') {
    carregarGradeMercado();
    document.getElementById('market-info-panel').innerHTML = '<div class="info-empty">Selecione uma melhoria para comprar</div>';
  } else if (modalId === 'arsenal') {
    carregarGradeArsenal();
    document.getElementById('arsenal-info-panel').innerHTML = '<div class="info-empty">Selecione uma melhoria do arsenal</div>';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(`${modalId}-modal`);
  if (modal) modal.classList.remove('active');
}

// --- MERCADO (SHOP) LOGIC ---
function carregarGradeMercado() {
  const grid = document.getElementById('market-items-grid');
  grid.innerHTML = '';

  gameState.upgrades.forEach(u => {
    const card = document.createElement('div');
    card.className = `upgrade-item-card ${activeSelectedId === u.id ? 'selected' : ''} ${u.equipped ? 'equipped' : ''}`;
    card.innerHTML = `
      <div class="item-icon">${u.icon}</div>
      <div class="item-cost">🪙 ${u.cost}</div>
      <div class="item-count">Owned: ${u.count}</div>
    `;
    card.onclick = () => selecionarItemMercado(u.id);
    grid.appendChild(card);
  });
}

function selecionarItemMercado(id) {
  activeSelectedId = id;
  carregarGradeMercado(); // Redesenhar para atualizar seleção visual
  
  const item = gameState.upgrades.find(x => x.id === id);
  const panel = document.getElementById('market-info-panel');

  const goldBonus = item.passiveBonus > 0 ? `+${item.passiveBonus} ouro/hora` : `+${item.clickBonus} por clique`;
  const canBuy = gameState.gold >= item.cost;

  panel.innerHTML = `
    <div class="info-icon">${item.icon}</div>
    <div class="info-title">${item.name.toUpperCase()}</div>
    <div class="info-desc">${item.desc}</div>
    <div class="info-stats">
      <div class="info-stat-line"><strong>Bônus:</strong> ${goldBonus}</div>
      <div class="info-stat-line"><strong>Custo:</strong> 🪙 ${item.cost}</div>
      <div class="info-stat-line"><strong>Possuído:</strong> ${item.count}</div>
    </div>
    <button class="info-btn btn-buy" onclick="comprarUpgrade('${item.id}')" ${canBuy ? '' : 'disabled'}>
      COMPRAR
    </button>
  `;
}

function comprarUpgrade(id) {
  const item = gameState.upgrades.find(x => x.id === id);
  if (gameState.gold >= item.cost) {
    gameState.gold -= item.cost;
    item.count++;
    item.cost = Math.floor(item.cost * 1.3); // Aumentar custo do item em 30%

    mostrarToast(`✔ ${item.name} adquirido!`, 'ok');
    selecionarItemMercado(id); // Recarregar painel
    atualizarUI();
  } else {
    mostrarToast('✖ Ouro insuficiente!', 'erro');
  }
}

// --- ARSENAL (INVENTORY) LOGIC ---
function carregarGradeArsenal() {
  const grid = document.getElementById('arsenal-items-grid');
  grid.innerHTML = '';

  // Exibir itens possuídos (count > 0)
  const itensPossuidos = gameState.upgrades.filter(u => u.count > 0);

  if (itensPossuidos.length === 0) {
    grid.innerHTML = '<div class="info-empty" style="grid-column: 1/-1;">Nenhuma melhoria comprada ainda. Visite o Mercado!</div>';
    return;
  }

  itensPossuidos.forEach(u => {
    const card = document.createElement('div');
    card.className = `upgrade-item-card ${activeSelectedId === u.id ? 'selected' : ''} ${u.equipped ? 'equipped' : ''}`;
    card.innerHTML = `
      <div class="item-icon">${u.icon}</div>
      <div class="item-count">${u.equipped ? 'EQUIPADO' : 'Guardado'}</div>
      <div class="item-count">Quant: ${u.count}</div>
    `;
    card.onclick = () => selecionarItemArsenal(u.id);
    grid.appendChild(card);
  });
}

function selecionarItemArsenal(id) {
  activeSelectedId = id;
  carregarGradeArsenal(); // Redesenhar
  
  const item = gameState.upgrades.find(x => x.id === id);
  const panel = document.getElementById('arsenal-info-panel');

  const goldBonus = item.passiveBonus > 0 ? `+${item.passiveBonus * item.count} ouro/hora` : `+${item.clickBonus * item.count} por clique`;
  
  // Botão de ação (Equipar/Desequipar)
  let actionBtn = '';
  if (item.equipped) {
    actionBtn = `<button class="info-btn btn-unequip" onclick="desequiparUpgrade('${item.id}')">DESEQUIPAR</button>`;
  } else {
    const totalEquipped = gameState.upgrades.filter(u => u.equipped).length;
    const canEquip = totalEquipped < 4;
    actionBtn = `<button class="info-btn btn-equip" onclick="equiparUpgrade('${item.id}')" ${canEquip ? '' : 'disabled'}>EQUIPAR</button>`;
    if (!canEquip) {
      actionBtn += `<div style="font-size: 5px; color: var(--cor-erro); margin-top: 6px;">Limite de 4 melhorias ativas atingido!</div>`;
    }
  }

  panel.innerHTML = `
    <div class="info-icon">${item.icon}</div>
    <div class="info-title">${item.name.toUpperCase()}</div>
    <div class="info-desc">${item.desc}</div>
    <div class="info-stats">
      <div class="info-stat-line"><strong>Bônus Ativo:</strong> ${goldBonus}</div>
      <div class="info-stat-line"><strong>Unidades:</strong> ${item.count}</div>
      <div class="info-stat-line"><strong>Estado:</strong> ${item.equipped ? 'ATIVO' : 'INATIVO'}</div>
    </div>
    ${actionBtn}
  `;
}

function equiparUpgrade(id) {
  const item = gameState.upgrades.find(x => x.id === id);
  const totalEquipped = gameState.upgrades.filter(u => u.equipped).length;

  if (totalEquipped < 4) {
    item.equipped = true;
    mostrarToast(`🛡️ ${item.name} equipado com sucesso!`, 'ok');
    selecionarItemArsenal(id);
    atualizarUI();
  } else {
    mostrarToast('✖ Limite de slots atingido!', 'erro');
  }
}

function desequiparUpgrade(id) {
  const item = gameState.upgrades.find(x => x.id === id);
  item.equipped = false;
  mostrarToast(`📦 ${item.name} desequipado.`, 'info');
  selecionarItemArsenal(id);
  atualizarUI();
}

// --- DEBUG TEST: INSTA LEVEL UP ---
function instaLevelUp() {
  const rank = obterRankAtual();
  let nextRank = null;

  // Achar o próximo limite de rank
  for (let i = 0; i < RANKS.length; i++) {
    if (gameState.xp < RANKS[i].minXp) {
      nextRank = RANKS[i];
      break;
    }
  }

  // Se já estiver no último rank, adiciona uma quantidade fixa
  if (!nextRank) {
    gameState.gold += 50000;
    gameState.xp += 50000;
    mostrarToast('✨ Adicionado +50.000 ouro/XP!', 'ok');
  } else {
    // Adiciona o ouro necessário para bater o XP do próximo nível + 1 ponto
    const diff = nextRank.minXp - gameState.xp + 1;
    gameState.gold += diff;
    gameState.xp += diff;
    mostrarToast(`✨ Nível avançado para ${nextRank.name}!`, 'ok');
  }

  atualizarUI();
  salvarJogo();
}
