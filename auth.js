// --- ALTERNÂNCIA DE ABAS ---
function switchTab(aba) {
  const painelLogin    = document.getElementById('form-login');
  const painelCadastro = document.getElementById('form-register');
  const btnLogin       = document.getElementById('tab-login');
  const btnCadastro    = document.getElementById('tab-register');
  esconderToast();
  if (aba === 'login') {
    painelLogin.classList.add('active');
    painelCadastro.classList.remove('active');
    btnLogin.classList.add('active');
    btnCadastro.classList.remove('active');
  } else {
    painelCadastro.classList.add('active');
    painelLogin.classList.remove('active');
    btnCadastro.classList.add('active');
    btnLogin.classList.remove('active');
  }
}

// --- TOAST (FEEDBACK) ---
function mostrarToast(mensagem, tipo = 'ok', duracao = 3500) {
  const toast = document.getElementById('toast');
  toast.textContent = mensagem;
  toast.className = `toast show toast-${tipo}`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(esconderToast, duracao);
}
function esconderToast() {
  document.getElementById('toast').classList.remove('show');
}

// --- LOGIN ---
async function handleLogin() {
  if (!window.supabaseClient?.auth) {
    mostrarToast('✖ Erro: cliente Supabase não inicializado.', 'erro');
    return;
  }
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-password').value;
  const btn = document.querySelector('#form-login .btn-primary');
  btn.textContent = '⏳ VALIDANDO...';
  btn.disabled = true;
  try {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ 
      email, 
      password: senha 
    });
    if (error) throw error;
    mostrarToast('✔ ACESSO CONCEDIDO!', 'ok');
    setTimeout(() => window.location.href = 'mural.html', 1500);
  } catch (erro) {
    mostrarToast(`✖ Erro: ${erro.message}`, 'erro');
  } finally {
    btn.textContent = '⚔ ENTRAR NA TABERNA';
    btn.disabled = false;
  }
}

// --- CADASTRO ---
async function handleRegister() {
  if (!window.supabaseClient?.auth) {
    mostrarToast('✖ Erro: cliente Supabase não inicializado.', 'erro');
    return;
  }
  const nome    = document.getElementById('reg-name').value.trim();
  const email   = document.getElementById('reg-email').value.trim();
  const senha   = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  if (senha !== confirm) {
    mostrarToast('⚠ Senhas não coincidem!', 'erro');
    return;
  }
  const btn = document.querySelector('#form-register .btn-primary');
  btn.textContent = '⏳ FORJANDO...';
  btn.disabled = true;
  try {
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password: senha,
      options: { data: { nome_aventureiro: nome } }
    });
    if (error) throw error;
    mostrarToast('✔ HERÓI CRIADO!', 'ok');
    setTimeout(() => window.location.href = 'forja.html', 2000);
  } catch (erro) {
    mostrarToast(`✖ Erro: ${erro.message}`, 'erro');
  } finally {
    btn.textContent = '✨ FORJAR PERSONAGEM';
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.supabaseClient) {
    console.error('⚠ Supabase não encontrado. Verifique a ordem dos scripts no HTML.');
  }
  switchTab('login');
});
