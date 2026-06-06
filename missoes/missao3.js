// --- TOAST FEEDBACK ---
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

// --- DIFICULDADES E MULTIPLICADORES ---
const DIFFICULTY_CONFIG = {
  facil: {
    barHeight: 95,
    fishAccel: 0.04,
    fishFriction: 0.92,
    targetChangeInterval: 1600,
    multiplier: 1.0,
    reactionWindow: 1200,
    title: 'Fácil'
  },
  medio: {
    barHeight: 75,
    fishAccel: 0.09,
    fishFriction: 0.89,
    targetChangeInterval: 1100,
    multiplier: 1.5,
    reactionWindow: 950,
    title: 'Médio'
  },
  dificil: {
    barHeight: 55,
    fishAccel: 0.17,
    fishFriction: 0.86,
    targetChangeInterval: 700,
    multiplier: 2.5,
    reactionWindow: 700,
    title: 'Difícil'
  },
  lendario: {
    barHeight: 38,
    fishAccel: 0.28,
    fishFriction: 0.83,
    targetChangeInterval: 350,
    multiplier: 4.0,
    reactionWindow: 500,
    title: 'Lendário'
  }
};

// --- ESTADO DO JOGO ---
let user = null;
let score = 0;
let timeLeft = 90; // 1m 30s
let isPlaying = false;
let gameTimerInterval = null;

// Máquina de Estados do Minigame:
// 'WAITING_START' | 'CASTING_HOLD' | 'CASTING_FLIGHT' | 'WAITING_BITE' | 'BITE_ACTIVE' | 'REELING' | 'GAME_OVER'
let gameState = 'WAITING_START';

let selectedDifficulty = 'facil';
let castPower = 0;
let castDirection = 1;
let isPressing = false;
let castMultiplier = 1.0; // Bônus de arremesso (Regular=1x, Bom=1.2x, Perfeito=1.5x)

// Coordenadas e física do arremesso
const ROD_TIP = { x: 65, y: 290 }; // Posição da ponta da vara no canvas
let bobberPos = { x: ROD_TIP.x, y: ROD_TIP.y };
let targetBobberPos = { x: 0, y: 0 };
let castProgress = 0; // 0 a 1 para interpolação do vôo

// Tempos e timeouts da fisgada
let biteTimeout = null;
let biteStartTime = 0;

// Variáveis da Física de Pesca Vertical
let barHeight = DIFFICULTY_CONFIG.facil.barHeight;
let barY = 0; // Posição inferior da barra verde (0 a 320 - barHeight)
let barVelocity = 0;
const LIFT = 0.32;
const GRAVITY = 0.20;
const BOUNCE = -0.40;

let fishY = 150; // Posição inferior do peixe (0 a 320 - 24)
let fishVelocity = 0;
let fishTargetY = 150;
let lastTargetChange = 0;

let catchProgress = 0; // Barra lateral de captura (0 a 100)
let animationFrameId = null;

// Bolhas decorativas
let bubbles = [];

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

  // Bind dos controles de clique e teclado
  const playArea = document.querySelector('.m3-play-area');
  
  // Eventos de clique do mouse
  playArea.addEventListener('mousedown', (e) => {
    if (e.button === 0) onInputDown(e);
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) onInputUp(e);
  });
  
  // Eventos de teclado (barra de espaço)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault(); // Evita scroll da tela
      onInputDown(e);
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      onInputUp(e);
    }
  });

  // Atualizar HUD do multiplicador inicial
  updateMultiplierHUD();
  
  // Inicializa bolhas
  initBubbles();
});

// --- CONTROLES DE DIFICULDADE (HUD LATERAL) ---
function selectDifficulty(diff) {
  if (isPlaying && gameState !== 'WAITING_START') return; // Não muda no meio do jogo
  
  selectedDifficulty = diff;
  
  // Atualizar visual dos botões
  const options = ['facil', 'medio', 'dificil', 'lendario'];
  options.forEach(opt => {
    const el = document.getElementById(`opt-${opt}`);
    if (opt === diff) {
      el.classList.add('selected');
      el.querySelector('input').checked = true;
    } else {
      el.classList.remove('selected');
    }
  });

  // Atualizar HUD do multiplicador
  updateMultiplierHUD();
}

function updateMultiplierHUD() {
  const config = DIFFICULTY_CONFIG[selectedDifficulty];
  const multVal = document.getElementById('multiplier-value');
  multVal.textContent = `x${config.multiplier.toFixed(1)}`;
}

// --- CONTROLES DE PRESSÃO (LIFT / CARGA) ---
function onInputDown(e) {
  if (!isPlaying) return;
  isPressing = true;

  if (gameState === 'CASTING_HOLD') {
    // Começa a carregar a barra
    castPower = 0;
    castDirection = 1;
    document.getElementById('cast-bar-container').style.display = 'flex';
  } else if (gameState === 'BITE_ACTIVE') {
    // Jogador reagiu a tempo! Fisgou o peixe!
    hookFish();
  }
}

function onInputUp(e) {
  if (!isPlaying) return;
  isPressing = false;

  if (gameState === 'CASTING_HOLD' && castPower > 0) {
    // Lança a linha
    releaseLine();
  }
}

// --- INICIALIZAR MISSÃO ---
function iniciarJogo() {
  if (isPlaying) return;
  if (!user) {
    mostrarToast('Aguardando autenticação...', 'erro');
    return;
  }

  score = 0;
  timeLeft = 90;
  isPlaying = true;
  gameState = 'CASTING_HOLD';

  document.getElementById('game-score').textContent = '0';
  
  const timerVal = document.getElementById('game-timer');
  timerVal.textContent = '90s';
  timerVal.classList.remove('timer-low');

  // Esconder overlay de início
  document.getElementById('board-overlay').style.display = 'none';
  
  // Mostrar visualização da lagoa e esconder vertical
  document.getElementById('pond-view').style.display = 'flex';
  document.getElementById('reel-view').style.display = 'none';
  
  // Garantir HUD desabilitado para cliques de dificuldade
  disableDifficultySelection(true);

  // Iniciar loop de renderização do jogo
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(gameLoop);

  // Iniciar timer regressivo
  gameTimerInterval = setInterval(() => {
    timeLeft--;
    timerVal.textContent = `${timeLeft}s`;

    if (timeLeft <= 10) {
      timerVal.classList.add('timer-low');
    }

    if (timeLeft === 0) {
      finalizarJogo();
    }
  }, 1000);
}

function disableDifficultySelection(disable) {
  const options = document.querySelectorAll('.difficulty-option');
  options.forEach(opt => {
    if (disable) {
      opt.style.pointerEvents = 'none';
      opt.style.opacity = '0.6';
    } else {
      opt.style.pointerEvents = 'auto';
      opt.style.opacity = '1';
    }
  });
}

// --- LOOP GERAL DO JOGO (RENDER / FÍSICA) ---
function gameLoop() {
  if (!isPlaying) return;

  const now = Date.now();

  if (gameState === 'CASTING_HOLD') {
    // Oscilar a barra de arremesso se o jogador estiver segurando
    if (isPressing) {
      castPower += 2.5 * castDirection;
      if (castPower >= 100) {
        castPower = 100;
        castDirection = -1;
      } else if (castPower <= 0) {
        castPower = 0;
        castDirection = 1;
      }
      document.getElementById('cast-bar-fill').style.width = `${castPower}%`;
    }
  } 
  
  else if (gameState === 'CASTING_FLIGHT') {
    // Interpolação parabólica do arremesso do bobber
    castProgress += 0.035;
    if (castProgress >= 1) {
      castProgress = 1;
      gameState = 'WAITING_BITE';
      triggerSplash();
    }
    
    // Calcular coordenadas
    const startX = ROD_TIP.x;
    const startY = ROD_TIP.y;
    const endX = targetBobberPos.x;
    const endY = targetBobberPos.y;
    
    const x = startX + (endX - startX) * castProgress;
    // Parábola (curva de arremesso)
    const arcHeight = 65;
    const y = startY + (endY - startY) * castProgress - Math.sin(castProgress * Math.PI) * arcHeight;
    
    bobberPos = { x, y };
    updateBobberUI();
  } 
  
  else if (gameState === 'WAITING_BITE') {
    // Flutuação sutil do bobber na água
    const wave = Math.sin(now / 180) * 2;
    bobberPos.y = targetBobberPos.y + wave;
    updateBobberUI();
  } 
  
  else if (gameState === 'BITE_ACTIVE') {
    // Piscadas rápidas do bobber indicando a mordida
    const wave = Math.sin(now / 60) * 3;
    bobberPos.y = targetBobberPos.y + wave;
    updateBobberUI();

    // Se passou do tempo da janela de reação
    const config = DIFFICULTY_CONFIG[selectedDifficulty];
    if (now - biteStartTime > config.reactionWindow) {
      fishMissed();
    }
  } 
  
  else if (gameState === 'REELING') {
    // Física do Green Bar (Bobber)
    if (isPressing) {
      barVelocity += LIFT;
    } else {
      barVelocity -= GRAVITY;
    }
    
    barY += barVelocity;
    
    // Colisão das bordas (Canal vertical de 320px)
    if (barY <= 0) {
      barY = 0;
      barVelocity = barVelocity * BOUNCE;
      if (Math.abs(barVelocity) < 0.2) barVelocity = 0;
    } else if (barY >= 320 - barHeight) {
      barY = 320 - barHeight;
      barVelocity = 0;
    }
    
    // Atualizar UI do Green Bar
    const barEl = document.getElementById('fishing-bar');
    barEl.style.bottom = `${barY}px`;
    barEl.style.height = `${barHeight}px`;

    // Física e Movimento IA do Peixe
    const config = DIFFICULTY_CONFIG[selectedDifficulty];
    if (now - lastTargetChange > config.targetChangeInterval) {
      lastTargetChange = now;
      
      // Escolher nova posição alvo
      fishTargetY = Math.floor(Math.random() * (320 - 30)) + 5;
      
      // Em dificuldades maiores, probabilidade de movimentos repentinos e agressivos
      if (selectedDifficulty === 'dificil' && Math.random() < 0.35) {
        fishTargetY = Math.random() < 0.5 ? 20 : 280;
      } else if (selectedDifficulty === 'lendario' && Math.random() < 0.5) {
        fishTargetY = Math.random() < 0.5 ? 10 : 290;
      }
    }
    
    // Interpolar peixe até o alvo com aceleração
    const diff = fishTargetY - fishY;
    fishVelocity += diff * config.fishAccel;
    fishVelocity *= config.fishFriction;
    fishY += fishVelocity;
    
    // Garantir limites do peixe (altura 24px)
    if (fishY <= 0) {
      fishY = 0;
      fishVelocity = 0;
    } else if (fishY >= 320 - 24) {
      fishY = 320 - 24;
      fishVelocity = 0;
    }

    // Atualizar UI do Peixe
    const fishEl = document.getElementById('fishing-fish');
    fishEl.style.bottom = `${fishY}px`;

    // Verificar se o Peixe está dentro da Barra Verde
    const isInside = (fishY + 24 >= barY) && (fishY <= barY + barHeight);
    
    if (isInside) {
      catchProgress += 0.38; // Ganho rápido
      barEl.style.borderColor = '#2ecc71';
      barEl.style.boxShadow = '0 0 12px rgba(46, 204, 113, 0.8)';
    } else {
      catchProgress -= 0.22; // Perda mais lenta
      barEl.style.borderColor = '#e74c3c';
      barEl.style.boxShadow = '0 0 12px rgba(231, 76, 60, 0.8)';
    }
    
    catchProgress = Math.max(0, Math.min(100, catchProgress));
    
    // Atualizar UI da barra de captura
    const indicator = document.getElementById('catch-bar-fill-indicator');
    indicator.style.height = `${catchProgress}%`;

    // Condições de fim da Luta (Vitória ou Fuga)
    if (catchProgress >= 100) {
      fishCaught();
    } else if (catchProgress <= 0) {
      fishEscaped();
    }
    
    // Atualiza bolhas decorativas
    updateBubbles();
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

// --- RENDERIZAÇÃO DO BOBBER ---
function updateBobberUI() {
  const bobberEl = document.getElementById('pond-bobber');
  const lineEl = document.getElementById('bobber-line-svg');
  
  bobberEl.style.display = 'block';
  bobberEl.style.left = `${bobberPos.x}px`;
  bobberEl.style.top = `${bobberPos.y}px`;
  
  // Atualizar a linha de pesca
  lineEl.style.display = 'block';
  lineEl.setAttribute('x1', ROD_TIP.x);
  lineEl.setAttribute('y1', ROD_TIP.y);
  lineEl.setAttribute('x2', bobberPos.x + 4);
  lineEl.setAttribute('y2', bobberPos.y + 4);
}

// --- AÇÕES DO ARREMESSO ---
function releaseLine() {
  gameState = 'CASTING_FLIGHT';
  castProgress = 0;
  isPressing = false;

  // Esconder instrução de arremesso
  document.getElementById('cast-bar-container').style.display = 'none';

  // Avaliar qualidade do arremesso
  let feedbackText = 'BOM!';
  let feedbackColor = '#ffd700';
  castMultiplier = 1.2;

  if (castPower >= 94 && castPower <= 98) {
    feedbackText = 'PERFEITO!';
    feedbackColor = '#2ecc71';
    castMultiplier = 1.5;
  } else if (castPower > 98) {
    feedbackText = 'FORTE DEMAIS!';
    feedbackColor = '#e74c3c';
    castMultiplier = 1.0;
  } else if (castPower < 40) {
    feedbackText = 'FRACO!';
    feedbackColor = '#a07840';
    castMultiplier = 1.0;
  } else if (castPower < 75) {
    feedbackText = 'REGULAR';
    feedbackColor = '#fff';
    castMultiplier = 1.0;
  }

  // Feedback flutuante na tela
  spawnFeedbackText(feedbackText, feedbackColor);

  // Calcular ponto de queda do bobber (distância proporcional ao power)
  // Largura máxima da play-area útil é aproximadamente de x=100 a x=290
  const maxDistance = 180;
  const targetX = 100 + (castPower / 100) * maxDistance;
  const targetY = 320; // Plano da água

  targetBobberPos = { x: targetX, y: targetY };
}

function spawnFeedbackText(txt, color) {
  const container = document.getElementById('pond-view');
  const textEl = document.createElement('div');
  textEl.className = 'cast-feedback';
  textEl.style.color = color;
  textEl.textContent = txt;
  container.appendChild(textEl);
  setTimeout(() => textEl.remove(), 1000);
}

function triggerSplash() {
  const splash = document.getElementById('bobber-splash');
  splash.style.display = 'block';
  setTimeout(() => {
    splash.style.display = 'none';
  }, 800);

  // Agendar a mordida do peixe após delay randômico (1 a 3 segundos)
  const delay = 1000 + Math.random() * 2000;
  biteTimeout = setTimeout(() => {
    triggerBite();
  }, delay);
}

// --- FASE 2: MORDIDA ---
function triggerBite() {
  if (gameState !== 'WAITING_BITE') return;
  
  gameState = 'BITE_ACTIVE';
  biteStartTime = Date.now();

  // Mostrar aviso de mordida (!) acima do bobber
  const alertEl = document.getElementById('bite-alert');
  alertEl.style.left = `${bobberPos.x - 6}px`;
  alertEl.style.top = `${bobberPos.y - 28}px`;
  alertEl.style.display = 'flex';

  // Mostrar splash repetido para indicar vibração
  const splash = document.getElementById('bobber-splash');
  splash.style.display = 'block';
}

function hookFish() {
  if (gameState !== 'BITE_ACTIVE') return;
  
  // Limpar timeouts
  clearTimeout(biteTimeout);
  
  // Resetar avisos
  document.getElementById('bite-alert').style.display = 'none';
  document.getElementById('bobber-splash').style.display = 'none';

  mostrarToast('✔ Fisgado! Segure para pescar!', 'ok', 1000);

  // Transição de visualizações
  document.getElementById('pond-view').style.display = 'none';
  document.getElementById('reel-view').style.display = 'flex';

  // Configurar jogo de luta
  const config = DIFFICULTY_CONFIG[selectedDifficulty];
  barHeight = config.barHeight;
  barY = 0;
  barVelocity = 0;
  
  fishY = 140;
  fishVelocity = 0;
  fishTargetY = 140;
  lastTargetChange = Date.now();
  
  catchProgress = 30; // Começa com 30% de lambuja
  gameState = 'REELING';
}

function fishMissed() {
  // O jogador não reagiu a tempo
  gameState = 'CASTING_HOLD';
  
  document.getElementById('bite-alert').style.display = 'none';
  document.getElementById('bobber-splash').style.display = 'none';
  
  mostrarToast('✖ Tarde demais! O peixe fugiu com a isca.', 'erro', 2000);

  // Recolher linha
  recolherLinha();
}

function recolherLinha() {
  const lineEl = document.getElementById('bobber-line-svg');
  const bobberEl = document.getElementById('pond-bobber');
  
  lineEl.style.display = 'none';
  bobberEl.style.display = 'none';
}

// --- FASE 3: LUTA (FINALIZAÇÕES) ---
function fishCaught() {
  gameState = 'CASTING_HOLD';
  
  // Mostrar visualização da lagoa e esconder vertical
  document.getElementById('pond-view').style.display = 'flex';
  document.getElementById('reel-view').style.display = 'none';
  
  recolherLinha();

  // Calcular pontos obtidos
  const config = DIFFICULTY_CONFIG[selectedDifficulty];
  const pointsEarned = Math.round(100 * config.multiplier * castMultiplier);
  score += pointsEarned;
  
  document.getElementById('game-score').textContent = score;

  // Texto descritivo do bônus
  let bonusMsg = '';
  if (castMultiplier > 1.21) bonusMsg = ' (Bônus Perfeito +50%)';
  else if (castMultiplier > 1.01) bonusMsg = ' (Bônus Bom +20%)';

  mostrarToast(`🎣 PEIXE CAPTURADO! +${pointsEarned} pts${bonusMsg}`, 'ok', 2200);
}

function fishEscaped() {
  gameState = 'CASTING_HOLD';

  document.getElementById('pond-view').style.display = 'flex';
  document.getElementById('reel-view').style.display = 'none';

  recolherLinha();

  mostrarToast('💨 O peixe escapou da linha...', 'info', 2000);
}

// --- FINALIZAR TODA A MISSÃO (GAME OVER) ---
async function finalizarJogo() {
  isPlaying = false;
  gameState = 'GAME_OVER';
  
  clearInterval(gameTimerInterval);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  
  // Limpar elementos visuais na lagoa
  recolherLinha();
  document.getElementById('bite-alert').style.display = 'none';

  // Mostrar painel de encerramento
  const overlay = document.getElementById('board-overlay');
  const oTitle = document.getElementById('overlay-title');
  const oDesc = document.getElementById('overlay-desc');
  const btnStart = document.getElementById('btn-start');

  oTitle.textContent = '[ MISSÃO CONCLUÍDA! ]';
  
  const multInfo = DIFFICULTY_CONFIG[selectedDifficulty].title;
  oDesc.innerHTML = `Você encheu o balde! Pontuação total de <span class="status-value">${score} pontos</span> na dificuldade <strong>${multInfo}</strong>.<br/><br/>⏳ Enviando registro para a guilda...`;
  
  btnStart.textContent = '⚔ SALVANDO...';
  btnStart.disabled = true;
  overlay.style.display = 'flex';

  // Re-habilitar seleção de dificuldade
  disableDifficultySelection(false);

  try {
    // Gravar pontuação no Supabase
    const { error: dbError } = await supabase
      .from('placar')
      .insert({
        user_id: user.id,
        missao: 'missao3',
        pontuacao: score
      });

    if (dbError) throw dbError;

    oDesc.innerHTML = `Pontuação de <span class="status-value">${score} pontos</span> (${multInfo}) registrada com sucesso no Placar da Guilda!`;
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

// --- SISTEMA DE BOLHAS DECORATIVAS ---
function initBubbles() {
  const container = document.getElementById('channel-bubbles');
  bubbles = [];
  container.innerHTML = '';
  
  // Cria 6 bolhas iniciais
  for (let i = 0; i < 6; i++) {
    const bubble = document.createElement('div');
    bubble.style.position = 'absolute';
    bubble.style.width = `${Math.floor(Math.random() * 4) + 2}px`;
    bubble.style.height = bubble.style.width;
    bubble.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    bubble.style.borderRadius = '50%';
    bubble.style.left = `${Math.floor(Math.random() * 54) + 3}px`;
    
    // Propriedades de física
    const bObj = {
      el: bubble,
      x: parseFloat(bubble.style.left),
      y: Math.random() * 320,
      speed: Math.random() * 0.8 + 0.4,
      drift: Math.random() * 0.15 - 0.075
    };
    
    container.appendChild(bubble);
    bubbles.push(bObj);
  }
}

function updateBubbles() {
  if (gameState !== 'REELING') return;
  
  bubbles.forEach(b => {
    b.y -= b.speed;
    b.x += Math.sin(b.y / 20) * 0.3; // Oscilação sutil
    
    // Se saiu do topo, reseta no fundo
    if (b.y < -10) {
      b.y = 325;
      b.x = Math.floor(Math.random() * 54) + 3;
      b.speed = Math.random() * 0.8 + 0.4;
    }
    
    b.el.style.bottom = `${b.y}px`;
    b.el.style.left = `${b.x}px`;
  });
}
