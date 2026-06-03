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

// --- CONFIGURAÇÃO DA PÁGINA ---
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificar se o Supabase está ativo
  if (typeof supabase === 'undefined' || !supabase) {
    mostrarToast('✖ Erro: Conexão com Supabase falhou.', 'erro');
    return;
  }

  try {
    // 2. Obter usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      mostrarToast('⚠ Aventureiro não autenticado! Retornando à taverna...', 'erro', 2000);
      setTimeout(() => window.location.href = 'index.html', 1500);
      return;
    }

    // 3. Buscar perfil do usuário no database
    const { data: perfil, error: dbError } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (dbError) {
      console.error(dbError);
      mostrarToast('✖ Erro ao carregar perfil do database.', 'erro');
      return;
    }

    // Se não tem perfil criado ou não escolheu classe, vai para a forja
    if (!perfil || !perfil.classe) {
      mostrarToast('▶ Você precisa forjar seu herói primeiro! Viajando à forja...', 'info', 2000);
      setTimeout(() => window.location.href = 'forja.html', 1800);
      return;
    }

    // 4. Preencher dados do aventureiro no cabeçalho
    const icones = {
      Guerreiro: '⚔️',
      Mago:      '🧙',
      Arqueiro:  '🏹'
    };
    
    const nomeHeroi = perfil.nome || user.user_metadata.nome_aventureiro || 'Aventureiro';
    const icone = icones[perfil.classe] || '⚔️';

    document.getElementById('hero-nome').textContent = `🗡️ ${nomeHeroi}`;
    
    const classeBadge = document.getElementById('hero-classe');
    classeBadge.textContent = `${icone} ${perfil.classe.toUpperCase()}`;
    classeBadge.className = `hero-classe-badge ${perfil.classe.toLowerCase()}`;

  } catch (err) {
    console.error(err);
    mostrarToast('✖ Erro inesperado ao carregar sessão.', 'erro');
  }
});
