// --- CONFIGURAÇÃO DO SUPABASE ---
// (Carregado de forma compartilhada através do supabaseClient.js)

```js
// --- CONFIGURAÇÃO DO SUPABASE ---
// Supabase é carregado de forma compartilhada através do supabaseClient.js

const estado = { classeSelecionada: null };

const ICONES_CLASSE = {
  Guerreiro: '⚔️',
  Mago: '🧙',
  Arqueiro: '🏹'
};

// Cliente Supabase compartilhado
const supabaseClient = window.supabaseClient || window.supabase;

// --- UI / SELEÇÃO DE CLASSE ---
function selecionarClasse(classe) {
  estado.classeSelecionada = classe;

  document.querySelectorAll('.class-card').forEach(c => {
    c.classList.remove('selected');
    c.setAttribute('aria-pressed', 'false');
  });

  const card = document.getElementById(`class-${classe.toLowerCase()}`);
  if (card) {
    card.classList.add('selected');
    card.setAttribute('aria-pressed', 'true');
  }

  const classIcon = document.getElementById('class-icon');
  if (classIcon) {
    classIcon.textContent = ICONES_CLASSE[classe] || '⚔️';
  }

  const info = document.getElementById('class-selected-info');
  if (info) {
    info.style.display = 'flex';
  }

  const className = document.getElementById('class-selected-name');
  if (className) {
    className.textContent = classe.toUpperCase();
  }
}

// --- TOAST DE FEEDBACK ---
function mostrarToast(mensagem, tipo = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = mensagem;
  toast.className = `toast toast-${tipo} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// --- AÇÃO PRINCIPAL: SALVAR CLASSE NO DATABASE ---
async function finalizarHeroi() {
  if (!supabaseClient) {
    mostrarToast('✖ Erro: Supabase não foi carregado corretamente.', 'erro');
    return;
  }

  if (!estado.classeSelecionada) {
    mostrarToast('▶ Escolha sua classe, aventureiro!', 'erro');
    return;
  }

  const btn = document.getElementById('btn-finalizar');

  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ FORJANDO...';
  }

  try {
    // 1. Obter usuário logado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error('Herói não autenticado. Retorne à taverna!');

    // 2. Definir nome do herói
    const nomeHeroi =
      user.user_metadata?.nome_aventureiro ||
      user.user_metadata?.nome ||
      user.email?.split('@')[0] ||
      'Aventureiro';

    // 3. Salvar/atualizar perfil na tabela perfis
    const { error } = await supabaseClient
      .from('perfis')
      .upsert({
        id: user.id,
        nome: nomeHeroi,
        classe: estado.classeSelecionada,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    mostrarToast(`✔ ${estado.classeSelecionada} forjado com sucesso!`, 'ok');

    setTimeout(() => {
      window.location.href = 'missoes.html';
    }, 2000);

  } catch (erro) {
    mostrarToast(`✖ ${erro.message}`, 'erro');

    if (btn) {
      btn.disabled = false;
      btn.textContent = '✨ FORJAR HERÓI';
    }
  }
}
```
