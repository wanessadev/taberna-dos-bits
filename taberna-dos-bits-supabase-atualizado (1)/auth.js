// =====================================================
// auth.js — Login e cadastro da Taberna dos Bits
// =====================================================

function switchTab(tab) {
  const loginPanel = document.getElementById("form-login");
  const registerPanel = document.getElementById("form-register");
  const loginTab = document.getElementById("tab-login");
  const registerTab = document.getElementById("tab-register");

  if (tab === "login") {
    loginPanel.classList.add("active");
    registerPanel.classList.remove("active");
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginTab.setAttribute("aria-selected", "true");
    registerTab.setAttribute("aria-selected", "false");
  } else {
    registerPanel.classList.add("active");
    loginPanel.classList.remove("active");
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerTab.setAttribute("aria-selected", "true");
    loginTab.setAttribute("aria-selected", "false");
  }
}

function showToast(message, type = "ok") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show ${type === "ok" ? "toast-ok" : "toast-erro"}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 4000);
}

function validateSupabaseConfig() {
  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL.includes("COLE_AQUI") ||
    SUPABASE_ANON_KEY.includes("COLE_AQUI")
  ) {
    showToast("Configure a URL e a chave anon do Supabase em supabaseClient.js", "erro");
    return false;
  }

  return true;
}

async function handleRegister() {
  if (!validateSupabaseConfig()) return;

  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;

  if (!name || !email || !password || !confirm) {
    showToast("Preencha todos os campos para forjar seu personagem.", "erro");
    return;
  }

  if (password.length < 6) {
    showToast("O código secreto precisa ter pelo menos 6 caracteres.", "erro");
    return;
  }

  if (password !== confirm) {
    showToast("Os códigos secretos não coincidem.", "erro");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome_aventureiro: name
      }
    }
  });

  if (error) {
    showToast(error.message, "erro");
    return;
  }

  showToast("Personagem criado com sucesso! Entrando na guilda...", "ok");

  if (data.session) {
    setTimeout(() => {
      window.location.href = "forja.html";
    }, 1200);
  } else {
    showToast("Cadastro criado. Verifique o e-mail ou faça login.", "ok");
    switchTab("login");
  }
}

async function handleLogin() {
  if (!validateSupabaseConfig()) return;

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showToast("Digite e-mail e código secreto para entrar.", "erro");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showToast(error.message, "erro");
    return;
  }

  showToast("Entrada autorizada! Abrindo a taberna...", "ok");

  setTimeout(() => {
    window.location.href = "forja.html";
  }, 1000);
}

async function redirectIfLoggedIn() {
  if (!validateSupabaseConfig()) return;

  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    window.location.href = "forja.html";
  }
}

redirectIfLoggedIn();
