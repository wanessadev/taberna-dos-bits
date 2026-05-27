// --- CONFIGURAÇÃO DO SUPABASE ---
// Substitua pelos seus valores reais
const SUPABASE_URL      = 'https://SUA_URL_AQUI.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_AQUI';
const supabase          = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const estado = { classeSelecionada: null };

const ICONES_CLASSE = {
  Guerreiro: '⚔️',
  Mago:      '🧙',
  Arqueiro:  '🏹'
};

// --- UI / SELEÇÃO DE CLASSE ---
function selecionarClasse(classe) {
  estado.classeSelecionada = classe;

  // Atualiza visual dos cards
  document.querySelectorAll('.class-card').forEach(c => {
    c.classList.remove('selected');
    c.setAttribute('aria-pressed', 'false');
  });

  const card = document.getElementById(`class-${classe.toLowerCase()}`);
  card.classList.add('selected');
  card.setAttribute('aria-pressed', 'true');

  // Atualiza ícone do header
  document.getElementById('class-icon').textContent = ICONES_CLASSE[classe] || '⚔️';

  // Mostra info da classe selecionada
  const info = document.getElementById('class-selected-info');
  info.style.display = 'flex';
  document.getElementById('class-selected-name').textContent = classe.toUpperCase();
}

// --- TOAST DE FEEDBACK ---
function mostrarToast(mensagem, tipo = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = mensagem;
  toast.className = `toast toast-${tipo} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- AÇÃO PRINCIPAL: SALVAR CLASSE NO DATABASE ---
async function finalizarHeroi() {
  if (!estado.classeSelecionada) {
    mostrarToast('▶ Escolha sua classe, aventureiro!', 'erro');
    return;
  }

  const btn = document.getElementById('btn-finalizar');
  btn.disabled = true;
  btn.textContent = '⏳ FORJANDO...';

  try {
    // 1. Obter usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Herói não autenticado. Retorne à taverna!');

    // 2. Salvar/atualizar classe na tabela de perfis
    const { error } = await supabase
      .from('perfis')
      .upsert({
        id:     user.id,
        classe: estado.classeSelecionada
      });

    if (error) throw error;

    mostrarToast(`✔ ${estado.classeSelecionada} forjado com sucesso!`, 'ok');
    setTimeout(() => window.location.href = 'mural.html', 2000);

  } catch (erro) {
    mostrarToast(`✖ ${erro.message}`, 'erro');
    btn.disabled = false;
    btn.textContent = '✨ FORJAR HERÓI';
  }
}