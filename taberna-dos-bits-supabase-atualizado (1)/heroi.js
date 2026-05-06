// =====================================================
// heroi.js — CRUD + Storage com Supabase
// =====================================================

const BUCKET_NAME = "arquivos-taberna";

let currentUser = null;
let missionsCache = [];

const userInfo = document.getElementById("user-info");
const logoutBtn = document.getElementById("logout-btn");
const missionForm = document.getElementById("mission-form");
const missionIdInput = document.getElementById("mission-id");
const titleInput = document.getElementById("titulo");
const descriptionInput = document.getElementById("descricao");
const difficultyInput = document.getElementById("dificuldade");
const fileInput = document.getElementById("arquivo");
const missionsList = document.getElementById("missions-list");
const formTitle = document.getElementById("form-title");
const saveBtn = document.getElementById("save-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanFileName(fileName) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .toLowerCase();
}

async function initPage() {
  if (!validateSupabaseConfig()) return;

  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
    window.location.href = "index.html";
    return;
  }

  currentUser = data.session.user;
  const heroName = currentUser.user_metadata?.nome_aventureiro || currentUser.email;
  userInfo.textContent = `Aventureiro conectado: ${heroName}`;

  await loadMissions();
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

async function uploadMissionFile(file) {
  if (!file) return null;

  const fileName = `${Date.now()}-${cleanFileName(file.name)}`;
  const filePath = `${currentUser.id}/${fileName}`;

  const { error } = await supabaseClient.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) throw error;

  const { data } = supabaseClient.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    arquivo_nome: file.name,
    arquivo_path: filePath,
    arquivo_url: data.publicUrl
  };
}

async function saveMission(event) {
  event.preventDefault();

  const id = missionIdInput.value;
  const titulo = titleInput.value.trim();
  const descricao = descriptionInput.value.trim();
  const dificuldade = difficultyInput.value;
  const file = fileInput.files[0];

  if (!titulo) {
    showToast("Digite o título da missão.", "erro");
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = "Salvando...";

    const fileData = await uploadMissionFile(file);

    const payload = {
      titulo,
      descricao,
      dificuldade,
      user_id: currentUser.id
    };

    if (fileData) {
      Object.assign(payload, fileData);
    }

    if (id) {
      const { error } = await supabaseClient
        .from("missoes")
        .update(payload)
        .eq("id", id)
        .eq("user_id", currentUser.id);

      if (error) throw error;
      showToast("Missão atualizada com sucesso!", "ok");
    } else {
      const { error } = await supabaseClient
        .from("missoes")
        .insert(payload);

      if (error) throw error;
      showToast("Missão criada com sucesso!", "ok");
    }

    resetForm();
    await loadMissions();
  } catch (error) {
    showToast(error.message, "erro");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = missionIdInput.value ? "Atualizar missão" : "Salvar missão";
  }
}

async function loadMissions() {
  const { data, error } = await supabaseClient
    .from("missoes")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    showToast(error.message, "erro");
    return;
  }

  missionsCache = data || [];
  renderMissions();
}

function renderMissions() {
  if (!missionsCache.length) {
    missionsList.innerHTML = `<p class="empty-message">Nenhuma missão cadastrada ainda.</p>`;
    return;
  }

  missionsList.innerHTML = missionsCache.map((mission) => {
    const fileLink = mission.arquivo_url
      ? `<a class="mission-link" href="${escapeHtml(mission.arquivo_url)}" target="_blank" rel="noopener">📎 Ver arquivo: ${escapeHtml(mission.arquivo_nome || "arquivo")}</a>`
      : `<p class="empty-message">Sem arquivo anexado.</p>`;

    return `
      <article class="mission-card">
        <h3>${escapeHtml(mission.titulo)}</h3>
        <p>${escapeHtml(mission.descricao || "Sem descrição.")}</p>
        <p class="mission-meta">Dificuldade: ${escapeHtml(mission.dificuldade || "Normal")}</p>
        ${fileLink}
        <div class="card-actions">
          <button class="card-btn edit" data-action="edit" data-id="${mission.id}">Editar</button>
          <button class="card-btn delete" data-action="delete" data-id="${mission.id}">Excluir</button>
        </div>
      </article>
    `;
  }).join("");
}

function startEdit(id) {
  const mission = missionsCache.find((item) => item.id === id);
  if (!mission) return;

  missionIdInput.value = mission.id;
  titleInput.value = mission.titulo || "";
  descriptionInput.value = mission.descricao || "";
  difficultyInput.value = mission.dificuldade || "Normal";
  fileInput.value = "";

  formTitle.textContent = "Editar missão";
  saveBtn.textContent = "Atualizar missão";
  cancelEditBtn.style.display = "inline-block";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  missionForm.reset();
  missionIdInput.value = "";
  formTitle.textContent = "Nova missão";
  saveBtn.textContent = "Salvar missão";
  cancelEditBtn.style.display = "none";
}

async function deleteMission(id) {
  const mission = missionsCache.find((item) => item.id === id);
  const confirmDelete = confirm("Deseja excluir esta missão?");

  if (!confirmDelete) return;

  try {
    if (mission?.arquivo_path) {
      await supabaseClient.storage
        .from(BUCKET_NAME)
        .remove([mission.arquivo_path]);
    }

    const { error } = await supabaseClient
      .from("missoes")
      .delete()
      .eq("id", id)
      .eq("user_id", currentUser.id);

    if (error) throw error;

    showToast("Missão excluída.", "ok");
    await loadMissions();
  } catch (error) {
    showToast(error.message, "erro");
  }
}

missionsList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "edit") startEdit(id);
  if (action === "delete") deleteMission(id);
});

logoutBtn.addEventListener("click", logout);
missionForm.addEventListener("submit", saveMission);
cancelEditBtn.addEventListener("click", resetForm);

initPage();
