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

// --- ESTADO DO JOGO ---
let user = null;
let score = 0;
let timeLeft = 30;
let isPlaying = false;
let gameInterval = null;
const targetSize = 32;

// --- CONFIGURAÇÃO INICIAL E AUTENTICAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof supabase === 'undefined' || !supabase) {
    mostrarToast('✖ Erro: Supabase não inicializado.', 'erro');
    return;
  }

  try {
    const { data: { user: loggedInUser }, error } = await supabase.auth.getUser();
    if (error || !loggedInUser) {
      mostrarToast('⚠ Aventureiro não autenticado! Retornando...', 'erro', 2000);
      setTimeout(() => window.location.href = '../index.html', 1500);
      return;
    }
    user = loggedInUser;
  } catch (err) {
    console.error(err);
    mostrarToast('✖ Erro ao obter dados de sessão.', 'erro');
  }
});

// --- LÓGICA DO JOGO ---
function iniciarJogo() {
  if (isPlaying) return;
  if (!user) {
    mostrarToast('Aguardando autenticação...', 'erro');
    return;
  }

  score = 0;
  timeLeft = 30;
  isPlaying = true;

  document.getElementById('game-score').textContent = '0';
  
  const timerVal = document.getElementById('game-timer');
  timerVal.textContent = '30s';
  timerVal.classList.remove('timer-low');

  // Esconder overlay
  document.getElementById('board-overlay').style.display = 'none';

  // Spawna primeiro alvo
  spawnTarget();

  // Iniciar timer
  gameInterval = setInterval(() => {
    timeLeft--;
    timerVal.textContent = `${timeLeft}s`;

    if (timeLeft <= 5) {
      timerVal.classList.add('timer-low');
    }

    if (timeLeft === 0) {
      finalizarJogo();
    }
  }, 1000);
}

function spawnTarget() {
  if (!isPlaying) return;

  const board = document.getElementById('game-board');
  
  // Limpar alvos antigos
  const alvosAntigos = board.querySelectorAll('.game-target');
  alvosAntigos.forEach(a => a.remove());

  // Calcular limites
  const maxX = board.clientWidth - targetSize - 20;
  const maxY = board.clientHeight - targetSize - 20;

  const randomX = Math.floor(Math.random() * maxX) + 10;
  const randomY = Math.floor(Math.random() * maxY) + 10;

  // Criar alvo
  const target = document.createElement('div');
  target.className = 'game-target';
  target.style.left = `${randomX}px`;
  target.style.top = `${randomY}px`;

  // Moeda Pixel Art dourada em SVG
  target.innerHTML = `
    <svg viewBox="0 0 16 16" width="32" height="32" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <!-- Borda externa preta -->
      <rect x="5" y="0" width="6" height="1" fill="#000"/>
      <rect x="3" y="1" width="10" height="1" fill="#000"/>
      <rect x="2" y="2" width="12" height="1" fill="#000"/>
      <rect x="1" y="3" width="14" height="2" fill="#000"/>
      <rect x="0" y="5" width="16" height="6" fill="#000"/>
      <rect x="1" y="11" width="14" height="2" fill="#000"/>
      <rect x="2" y="13" width="12" height="1" fill="#000"/>
      <rect x="3" y="14" width="10" height="1" fill="#000"/>
      <rect x="5" y="15" width="6" height="1" fill="#000"/>
      
      <!-- Corpo dourado -->
      <rect x="5" y="1" width="6" height="14" fill="#c8a000"/>
      <rect x="3" y="2" width="10" height="12" fill="#c8a000"/>
      <rect x="2" y="3" width="12" height="10" fill="#c8a000"/>
      <rect x="1" y="5" width="14" height="6" fill="#c8a000"/>
      
      <!-- Brilho Dourado Claro -->
      <rect x="5" y="2" width="6" height="12" fill="#ffd700"/>
      <rect x="3" y="3" width="10" height="10" fill="#ffd700"/>
      <rect x="2" y="5" width="12" height="6" fill="#ffd700"/>
      
      <!-- Centro Sombreado -->
      <rect x="5" y="5" width="6" height="6" fill="#cc8800"/>
      <!-- Ponto central de brilho -->
      <rect x="7" y="7" width="2" height="2" fill="#ffd700"/>
    </svg>
  `;

  target.addEventListener('click', (e) => {
    e.stopPropagation();
    onTargetClick();
  });

  board.appendChild(target);
}

function onTargetClick() {
  if (!isPlaying) return;
  
  score += 100;
  document.getElementById('game-score').textContent = score;

  // Spawna próxima moeda
  spawnTarget();
}

async function finalizarJogo() {
  isPlaying = false;
  clearInterval(gameInterval);

  // Limpar alvos
  const board = document.getElementById('game-board');
  const alvos = board.querySelectorAll('.game-target');
  alvos.forEach(a => a.remove());

  // Atualizar Overlay com status de envio
  const overlay = document.getElementById('board-overlay');
  const oTitle = document.getElementById('overlay-title');
  const oDesc = document.getElementById('overlay-desc');
  const btnStart = document.getElementById('btn-start');

  oTitle.textContent = '[ MISSÃO CONCLUÍDA! ]';
  oDesc.innerHTML = `Você forjou um placar de <span class="status-value">${score} pontos</span>!<br/><br/>⏳ Enviando registro para a guilda...`;
  
  btnStart.textContent = '⚔ SALVANDO...';
  btnStart.disabled = true;
  overlay.style.display = 'flex';

  try {
    // Gravar pontuação no Supabase
    const { error: dbError } = await supabase
      .from('placar')
      .insert({
        user_id: user.id,
        missao: 'missao1',
        pontuacao: score
      });

    if (dbError) throw dbError;

    oDesc.innerHTML = `Pontuação de <span class="status-value">${score} pontos</span> registrada com sucesso no Placar da Guilda!`;
    mostrarToast('✔ Pontuação salva no Placar!', 'ok');
  } catch (err) {
    console.error(err);
    oDesc.innerHTML = `Missão cumprida com <span class="status-value">${score} pontos</span>!<br/><br/>✖ Erro ao registrar no database da guilda.`;
    mostrarToast('✖ Falha ao salvar no banco de dados.', 'erro');
  } finally {
    btnStart.textContent = '⚔ JOGAR NOVAMENTE';
    btnStart.disabled = false;
  }
}
