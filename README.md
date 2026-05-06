# taberna-dos-bits

⚔️ Taberna dos Bits — 
Guilda de RPGBem-vindo à Taberna dos Bits! Este é um projeto desenvolvido para a disciplina de Desenvolvimento de Software em Nuvem (Unifor) pelo Grupo 3. 
O objetivo é explorar as capacidades de uma plataforma BaaS (Backend as a Service) utilizando o Supabase como motor principal.  
A aplicação simula uma guilda de aventureiros onde os usuários podem se registrar, definir suas classes e gerenciar suas missões épicas.

🛠️ Tecnologias Utilizadas
Front-end: HTML5, CSS3 e JavaScript Vanilla.
Estética: Design inspirado em Pixel Art (8-bit) com tipografia clássica de RPG.
BaaS (Backend): Supabase.  
Auth: Gerenciamento de acesso dos aventureiros.  
Storage: Armazenamento de brasões e avatares personalizados.  
Database (PostgreSQL): CRUD para o Quadro de Missões da guilda.

🚀 Funcionalidades Implementadas (Requisitos)
Seguindo as diretrizes do projeto, implementamos as três funcionalidades principais exigidas:  
Portal da Taberna (Autenticação):
Sistema de login e cadastro integrado ao Supabase Auth.  
Validação de identidade para acesso às áreas restritas da guilda.
Forja do Herói (Storage):
Nossa funcionalidade principal! O usuário faz o upload de uma imagem que serve como seu brasão.  
O arquivo é enviado diretamente para um bucket no Supabase Storage e a URL pública é vinculada ao perfil no banco de dados.  
Quadro de Missões (Database/CRUD):
Um mural interativo onde o aventureiro pode criar, visualizar, editar e remover suas missões (tarefas).  
Sincronização em tempo real com o banco de dados PostgreSQL.
