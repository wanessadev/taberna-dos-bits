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
let isPlaying = false;
let board = [];
let timeElapsed = 0;
let timerInterval = null;

const ROWS = 5;
const COLS = 5;
const NUM_MINES = 5;

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

// --- INICIALIZAR JOGO ---
function iniciarJogo() {
  if (isPlaying) return;
  if (!user) {
    mostrarToast('Aguardando autenticação...', 'erro');
    return;
  }

  isPlaying = true;
  timeElapsed = 0;
  board = [];

  document.getElementById('board-overlay').style.display = 'none';
  document.getElementById('btn-restart').style.display = 'inline-block';
  document.getElementById('game-timer').textContent = '0s';
  document.getElementById('mines-count').textContent = String(NUM_MINES);

  // Iniciar timer
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeElapsed++;
    document.getElementById('game-timer').textContent = `${timeElapsed}s`;
  }, 1000);

  gerarTabuleiro();
}

function reiniciarJogo() {
  clearInterval(timerInterval);
  isPlaying = false;
  
  // Limpar grid visual
  const grid = document.getElementById('mines-grid');
  grid.innerHTML = '';

  // Mostrar Overlay de início
  const overlay = document.getElementById('board-overlay');
  const oTitle = document.getElementById('overlay-title');
  const oDesc = document.getElementById('overlay-desc');
  const btnStart = document.getElementById('btn-start');

  oTitle.textContent = '[ MISSÃO PERIGOSA! ]';
  oDesc.textContent = 'Revele as células seguras na grade 5x5. Cuidado com as 5 minas ocultas!';
  btnStart.textContent = '⚔ ENTRAR NO CAMPO';
  btnStart.disabled = false;
  
  overlay.style.display = 'flex';
  document.getElementById('btn-restart').style.display = 'none';
}

// --- TABULEIRO ---
function gerarTabuleiro() {
  const grid = document.getElementById('mines-grid');
  grid.innerHTML = '';

  // 1. Criar células vazias
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      board.push({
        row: r,
        col: c,
        isMine: false,
        neighborMines: 0,
        isRevealed: false,
        isFlagged: false
      });
    }
  }

  // 2. Colocar as minas aleatoriamente
  let minesPlaced = 0;
  while (minesPlaced < NUM_MINES) {
    const randomIndex = Math.floor(Math.random() * board.length);
    if (!board[randomIndex].isMine) {
      board[randomIndex].isMine = true;
      minesPlaced++;
    }
  }

  // 3. Calcular vizinhos
  for (let i = 0; i < board.length; i++) {
    if (board[i].isMine) continue;
    
    let count = 0;
    const neighbors = obterVizinhos(board[i].row, board[i].col);
    neighbors.forEach(n => {
      if (n.isMine) count++;
    });
    board[i].neighborMines = count;
  }

  // 4. Renderizar células na UI
  board.forEach((cell, index) => {
    const cellEl = document.createElement('div');
    cellEl.className = 'mines-cell';
    cellEl.id = `cell-${index}`;

    // Clique normal: Revelar
    cellEl.addEventListener('click', () => revelarCelula(index));

    // Clique direito: Bandeira (Sinalizar perigo)
    cellEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      sinalizarCelula(index);
    });

    grid.appendChild(cellEl);
  });
}

function obterVizinhos(row, col) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        const neighbor = board.find(cell => cell.row === nr && cell.col === nc);
        if (neighbor) neighbors.push(neighbor);
      }
    }
  }
  return neighbors;
}

// --- AÇÕES DO JOGADOR ---
function revelarCelula(index) {
  if (!isPlaying) return;
  const cell = board[index];

  if (cell.isRevealed || cell.isFlagged) return;

  const cellEl = document.getElementById(`cell-${index}`);
  cell.isRevealed = true;

  if (cell.isMine) {
    // Game Over! Detonou mina
    cellEl.classList.add('mine');
    cellEl.textContent = '💣';
    detonarMina(index);
    return;
  }

  // Revelação bem sucedida
  cellEl.classList.add('revealed');
  
  if (cell.neighborMines > 0) {
    cellEl.textContent = cell.neighborMines;
    cellEl.classList.add(`num-${cell.neighborMines}`);
  } else {
    // Vizinho livre: Revelar adjacentes em cascata
    const neighbors = obterVizinhos(cell.row, cell.col);
    neighbors.forEach(n => {
      const idx = board.indexOf(n);
      revelarCelula(idx);
    });
  }

  verificarVitoria();
}

function sinalizarCelula(index) {
  if (!isPlaying) return;
  const cell = board[index];

  if (cell.isRevealed) return;

  cell.isFlagged = !cell.isFlagged;
  const cellEl = document.getElementById(`cell-${index}`);

  if (cell.isFlagged) {
    cellEl.classList.add('flagged');
    cellEl.textContent = '🚩';
  } else {
    cellEl.classList.remove('flagged');
    cellEl.textContent = '';
  }

  // Atualizar contagem de minas restantes na UI
  const flaggedCount = board.filter(c => c.isFlagged).length;
  document.getElementById('mines-count').textContent = String(Math.max(0, NUM_MINES - flaggedCount));
}

// --- FIM DE JOGO ---
function detonarMina(indexMinaExplodida) {
  isPlaying = false;
  clearInterval(timerInterval);

  // Revelar todas as outras minas
  board.forEach((cell, idx) => {
    if (cell.isMine && idx !== indexMinaExplodida) {
      const cellEl = document.getElementById(`cell-${idx}`);
      cellEl.classList.add('revealed');
      cellEl.textContent = '💣';
    }
  });

  // Calcular pontuação de derrota (100 pontos por célula segura revelada)
  const safeRevealed = board.filter(c => c.isRevealed && !c.isMine).length;
  const scoreDerrota = safeRevealed * 100;

  finalizarJogo(false, scoreDerrota);
}

function verificarVitoria() {
  const safeCount = board.filter(c => !c.isMine).length;
  const revealedSafeCount = board.filter(c => c.isRevealed && !c.isMine).length;

  if (revealedSafeCount === safeCount) {
    isPlaying = false;
    clearInterval(timerInterval);

    // Pontuação de vitória: Baseada no tempo (Max 1000, Mínimo 100)
    const scoreVitoria = Math.max(100, 1000 - (timeElapsed * 10));
    finalizarJogo(true, scoreVitoria);
  }
}

async function finalizarJogo(vitoria, score) {
  // Desativar tabuleiro na UI
  isPlaying = false;
  clearInterval(timerInterval);

  const overlay = document.getElementById('board-overlay');
  const oTitle = document.getElementById('overlay-title');
  const oDesc = document.getElementById('overlay-desc');
  const btnStart = document.getElementById('btn-start');

  oTitle.textContent = vitoria ? '[ VITÓRIA INCRÍVEL! ]' : '[ DERROTA NO CAMPO ]';
  
  oDesc.innerHTML = vitoria
    ? `Você varreu todas as minas em <span class="status-value">${timeElapsed}s</span> e forjou <span class="status-value">${score} pontos</span>!`
    : `Uma mina detonou seus planos! Você conseguiu revelar ${board.filter(c => c.isRevealed && !c.isMine).length} células seguras e marcou <span class="status-value">${score} pontos</span>.`;

  oDesc.innerHTML += `<br/><br/>⏳ Enviando pontuação para a guilda...`;
  
  btnStart.textContent = '⚔ SALVANDO...';
  btnStart.disabled = true;
  overlay.style.display = 'flex';

  try {
    // Salvar placar
    const { error: dbError } = await supabase
      .from('placar')
      .insert({
        user_id: user.id,
        missao: 'missao2',
        pontuacao: score
      });

    if (dbError) throw dbError;

    oDesc.innerHTML = vitoria
      ? `Vitória de <span class="status-value">${score} pontos</span> registrada no Placar da Guilda!`
      : `Pontuação de <span class="status-value">${score} pontos</span> registrada com sucesso no mural.`;
      
    mostrarToast('✔ Pontuação salva no Placar!', 'ok');
  } catch (err) {
    console.error(err);
    oDesc.innerHTML += `<br/><br/>✖ Erro ao registrar pontuação no database.`;
    mostrarToast('✖ Falha ao salvar no banco de dados.', 'erro');
  } finally {
    btnStart.textContent = '⚔ TENTAR NOVAMENTE';
    btnStart.disabled = false;
  }
}
