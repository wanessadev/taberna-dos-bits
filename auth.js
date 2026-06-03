// --- OBTENER CLIENTE SUPABASE ---
function getSupabaseClient() {
  return window.supabaseClient || window.supabase;
}

// --- TOAST (FEEDBACK) ---
function mostrarToast(mensagem, tipo = 'ok', duracao = 3500) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = mensagem;
  toast.className = `toast show toast-${tipo}`;

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(esconderToast, duracao);
}

function esconderToast() {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.classList.remove('show');
}

// --- ALTERNÂNCIA DE ABAS ---
function switchTab(aba) {
  const painelLogin = document.getElementById('form-login');
  const painelCadastro = document.getElementById('form-register');
  const btnLogin = document.getElementById('tab-login');
  const btnCadastro = document.getElementById('tab-register');

  esconderToast();

  if (!painelLogin || !painelCadastro || !btnLogin || !btnCadastro) return;

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

// --- VALIDAR SUPABASE ---
function validarSupabase() {
  const client = getSupabaseClient();

  if (!client || !client.auth) {
    mostrarToast(
      '✖ Erro: Conexão com Supabase falhou. Recarregue com Ctrl + F5.',
      'erro',
      6000
    );
    return null;
  }

  return client;
}

// --- LOGIN ---
async function handleLogin() {
  const client = validarSupabase();
  if (!client) return;

  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-password').value;

  if (!email || !senha) {
    mostrarToast('⚠ Preencha e-mail e senha para entrar.', 'erro');
    return;
  }

  const btn = document.querySelector('#form-login .btn-primary');

  if (btn) {
    btn.textContent = '⏳ VALIDANDO...';
    btn.disabled = true;
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('E-mail ou senha incorretos.');
      }

      if (error.message.includes('Email not confirmed')) {
        throw new Error('Confirme seu e-mail antes de entrar.');
      }

      throw error;
    }

    if (!data.user) {
      throw new Error('Usuário não encontrado.');
    }

    mostrarToast('✔ ACESSO CONCEDIDO!', 'ok');

    setTimeout(() => {
      window.location.href = 'missoes.html';
    }, 1500);

  } catch (erro) {
    mostrarToast(`✖ Erro: ${erro.message}`, 'erro', 5000);
  } finally {
    if (btn) {
      btn.textContent = '⚔ ENTRAR NA TABERNA';
      btn.disabled = false;
    }
  }
}

// --- CADASTRO ---
async function handleRegister() {
  const client = validarSupabase();
  if (!client) return;

  const nome = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const senha = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (!nome || !email || !senha || !confirm) {
    mostrarToast('⚠ Preencha todos os campos.', 'erro');
    return;
  }

  if (senha.length < 6) {
    mostrarToast('⚠ A senha deve ter pelo menos 6 caracteres.', 'erro');
    return;
  }

  if (senha !== confirm) {
    mostrarToast('⚠ Senhas não coincidem!', 'erro');
    return;
  }

  const btn = document.querySelector('#form-register .btn-primary');

  if (btn) {
    btn.textContent = '⏳ FORJANDO...';
    btn.disabled = true;
  }

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome_aventureiro: nome
        }
      }
    });

    if (error) {
      if (
        error.message.includes('already registered') ||
        error.message.includes('User already registered') ||
        error.message.includes('already exists')
      ) {
        mostrarToast(
          '⚠ Esse e-mail já está cadastrado. Use a aba ENTRAR.',
          'erro',
          5000
        );

        switchTab('login');

        const loginEmail = document.getElementById('login-email');
        const loginSenha = document.getElementById('login-password');

        if (loginEmail) loginEmail.value = email;
        if (loginSenha) loginSenha.value = senha;

        return;
      }

      throw error;
    }

    if (!data.user) {
      throw new Error('Não foi possível criar o usuário.');
    }

    if (!data.session) {
      mostrarToast(
        '✔ Herói criado! Agora confirme seu e-mail e depois entre na taverna.',
        'ok',
        6000
      );

      switchTab('login');

      const loginEmail = document.getElementById('login-email');
      if (loginEmail) loginEmail.value = email;

      return;
    }

    mostrarToast('✔ HERÓI CRIADO!', 'ok');

    setTimeout(() => {
      window.location.href = 'forja.html';
    }, 2000);

  } catch (erro) {
    mostrarToast(`✖ Erro: ${erro.message}`, 'erro', 5000);
  } finally {
    if (btn) {
      btn.textContent = '✨ FORJAR PERSONAGEM';
      btn.disabled = false;
    }
  }
}

// --- DEIXAR FUNÇÕES DISPONÍVEIS PARA OS BOTÕES DO HTML ---
window.switchTab = switchTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
  switchTab('login');
  validarSupabase();
});
