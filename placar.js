// --- TOAST FEEDBACK ---
function mostrarToast(mensagem, tipo = 'info', duracao = 3500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = mensaje;
  toast.className = `toast show toast-${tipo}`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(esconderToast, duracao);
}

function esconderToast() {
  const toast = document.getElementById('toast');
  if (toast) toast.classList.remove('show');
}

// --- ESTADO DO RANKING ---
let currentMission = 'missao1';

// --- CONFIGURAÇÃO INICIAL ---
document.addEventListener('DOMContentLoaded', () => {
  if (typeof supabase === 'undefined' || !supabase) {
    const table = document.getElementById('leaderboard-table');
    table.innerHTML = '<div class="leaderboard-empty">✖ Erro ao se conectar com a guilda (Supabase offline).</div>';
    return;
  }

  carregarRanking();
});

// --- MUDANÇA DE ABAS ---
function switchMission(missionId) {
  if (currentMission === missionId) return;
  currentMission = missionId;

  // Atualizar visual das abas
  const tabM1 = document.getElementById('tab-missao1');
  const tabM2 = document.getElementById('tab-missao2');

  if (missionId === 'missao1') {
    tabM1.classList.add('active');
    tabM1.setAttribute('aria-selected', 'true');
    tabM2.classList.remove('active');
    tabM2.setAttribute('aria-selected', 'false');
  } else {
    tabM2.classList.add('active');
    tabM2.setAttribute('aria-selected', 'true');
    tabM1.classList.remove('active');
    tabM1.setAttribute('aria-selected', 'false');
  }

  carregarRanking();
}

// --- BUSCAR DADOS DO SUPABASE ---
async function carregarRanking() {
  const table = document.getElementById('leaderboard-table');
  table.innerHTML = '<div class="leaderboard-loading">⏳ CARREGANDO PLACAR...</div>';

  try {
    // Buscar as 10 melhores pontuações da missão atual, relacionando com o perfil do herói
    const { data: rankings, error } = await supabase
      .from('placar')
      .select(`
        pontuacao,
        created_at,
        perfis (
          nome,
          classe
        )
      `)
      .eq('missao', currentMission)
      .order('pontuacao', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!rankings || rankings.length === 0) {
      table.innerHTML = `
        <div class="leaderboard-empty">
          [ NENHUM PLACAR REGISTRADO ]<br/><br/>
          Seja o primeiro aventureiro a completar esta missão e grave seu nome na história!
        </div>
      `;
      return;
    }

    // Ícones das classes
    const icones = {
      Guerreiro: '⚔️',
      Mago:      '🧙',
      Arqueiro:  '🏹'
    };

    // Renderizar tabela de resultados
    table.innerHTML = '';
    rankings.forEach((row, index) => {
      const perfil = row.perfis || {};
      const nome = perfil.nome || 'Aventureiro Oculto';
      const classe = perfil.classe || 'Guerreiro';
      const icone = icones[classe] || '⚔️';
      
      const rank = index + 1;

      const rowEl = document.createElement('div');
      rowEl.className = `leaderboard-row rank-${rank}`;
      rowEl.innerHTML = `
        <div class="rank-badge">#${rank}</div>
        <div class="adventurer-info">
          <span class="class-icon" title="${classe}">${icone}</span>
          <span class="adventurer-name">${nome}</span>
        </div>
        <div class="leaderboard-score">${row.pontuacao} pts</div>
      `;

      table.appendChild(rowEl);
    });

  } catch (err) {
    console.error(err);
    table.innerHTML = '<div class="leaderboard-empty">✖ Erro ao carregar pontuações do database.</div>';
    mostrarToast('Falha ao obter rankings.', 'erro');
  }
}
