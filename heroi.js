// --- CONFIGURAÇÃO DO SUPABASE ---
const SUPABASE_URL      = 'https://SUA_URL_AQUI.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_AQUI';
const supabase          = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const estado = { arquivoAvatar: null, classeSelecionada: null };

// --- UI / SELEÇÕES ---
function selecionarClasse(classe) {
  estado.classeSelecionada = classe;
  document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`class-${classe.toLowerCase()}`).classList.add('selected');
}

function handleAvatarSelect(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;
  estado.arquivoAvatar = arquivo;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('avatar-preview').src = e.target.result;
    document.getElementById('preview-wrap').style.display = 'block';
    document.getElementById('upload-placeholder').style.display = 'none';
  };
  reader.readAsDataURL(arquivo);
}

// --- SISTEMA DE PROGRESSO ---
function avancarProgresso(porcentagem, mensagem, tipo = 'info') {
  document.getElementById('progress-container').style.display = 'block';
  document.getElementById('progress-bar').style.width = `${porcentagem}%`;
  const log = document.getElementById('progress-log');
  log.innerHTML += `<span class="log-${tipo}">> ${mensagem}</span><br>`;
}

// --- AÇÃO PRINCIPAL: STORAGE + DATABASE ---
async function finalizarHeroi() {
  if (!estado.arquivoAvatar || !estado.classeSelecionada) {
    alert('Escolha sua classe e brasão!');
    return;
  }

  const btn = document.getElementById('btn-finalizar');
  btn.disabled = true;

  try {
    // 1. Obter Usuário Logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    // 2. Upload para o Storage (Requirement: Storage)
    avancarProgresso(30, 'Enviando Brasão para a nuvem...', 'info');
    const caminho = `avatars/${user.id}-${Date.now()}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(caminho, estado.arquivoAvatar);

    if (uploadError) throw uploadError;

    // 3. Gerar URL Pública
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(caminho);
    avancarProgresso(70, 'Brasão guardado no inventário!', 'ok');

    // 4. Salvar no Database (Requirement: Database)
    avancarProgresso(85, 'Registrando perfil na guilda...', 'info');
    const { error: dbError } = await supabase
      .from('perfis')
      .insert({
        id: user.id,
        classe: estado.classeSelecionada,
        avatar_url: urlData.publicUrl
      });

    if (dbError) throw dbError;

    avancarProgresso(100, '✔ Herói finalizado!', 'ok');
    setTimeout(() => window.location.href = 'mural.html', 2000);

  } catch (erro) {
    avancarProgresso(100, `✖ Erro: ${erro.message}`, 'erro');
  } finally {
    btn.disabled = false;
  }
}