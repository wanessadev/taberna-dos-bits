# taberna-dos-bits

⚔️ **Taberna dos Bits — Guilda de RPG**

Projeto desenvolvido para a disciplina de Desenvolvimento de Software em Nuvem, pelo Grupo 3, com o objetivo de explorar funcionalidades de uma plataforma BaaS usando **Supabase**.

A aplicação simula uma guilda de aventureiros onde os usuários podem se cadastrar, fazer login, criar missões e anexar arquivos relacionados às missões.

## Funcionalidades implementadas

1. **Autenticação**
   - Cadastro de usuário com e-mail e senha.
   - Login de usuário.
   - Logout.
   - Usuários visíveis no painel do Supabase em Authentication > Users.

2. **Banco de Dados**
   - Tabela `missoes` no PostgreSQL do Supabase.
   - CRUD completo: criar, listar, editar e excluir missões.
   - Cada usuário visualiza apenas suas próprias missões.

3. **Armazenamento de Arquivos**
   - Bucket `arquivos-taberna` no Supabase Storage.
   - Upload de arquivos para cada missão.
   - Visualização/download do arquivo anexado.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript Vanilla
- Supabase Auth
- Supabase Database/PostgreSQL
- Supabase Storage

## Como configurar

1. Crie um projeto no Supabase.
2. Copie a Project URL e a anon public key.
3. Cole esses dados no arquivo `supabaseClient.js`.
4. Rode o SQL da tabela `missoes` no SQL Editor do Supabase.
5. Crie o bucket `arquivos-taberna` no Supabase Storage.
6. Abra o `index.html` com Live Server.

## Demonstração esperada

- Criar usuário no frontend e mostrar em Authentication > Users.
- Criar missão no frontend e mostrar em Table Editor > missoes.
- Subir arquivo no frontend e mostrar em Storage > arquivos-taberna.
- Editar e excluir missão para demonstrar o CRUD completo.
