# TaskFlow

TaskFlow é uma aplicação web **Full Stack para gerenciamento de tarefas**, desenvolvida para permitir que cada usuário organize suas atividades em um ambiente individual e seguro.

O sistema possui autenticação, gerenciamento de tarefas e categorias, dashboard de acompanhamento, prioridades, prazos e diferentes status de execução.

O projeto foi desenvolvido com **React no frontend, Flask no backend e PostgreSQL como banco de dados**, utilizando Neon para hospedagem do banco e Vercel para publicação da aplicação.

---

## 🚀 Demonstração

🔗 **Aplicação:** [Acessar TaskFlow](https://tasksflow-sigma.vercel.app/)

🔗 **Repositório:** [GitHub](https://github.com/Everttoncrd/Tasksflow)

---

## 📸 Preview

> Screenshots da aplicação serão adicionados aqui.

<!--
Exemplo:

![Dashboard](docs/dashboard.png)
![Tarefas](docs/tasks.png)
-->

---

## ✨ Funcionalidades

- Cadastro de usuários
- Login e logout
- Alteração de senha
- Sessão autenticada
- Dashboard individual
- Criação de tarefas
- Edição de tarefas
- Exclusão de tarefas
- Alteração do status das tarefas
- Definição de prioridade
- Definição de prazo
- Organização por categorias
- Criação de categorias personalizadas
- Edição de categorias
- Exclusão controlada de categorias
- Separação dos dados entre usuários
- Proteção de rotas privadas
- Proteção contra requisições CSRF
- Limitação de tentativas de acesso

---

## 🛠️ Tecnologias

### Frontend

- React
- JavaScript
- Vite
- React Router
- Lucide React
- CSS

### Backend

- Python
- Flask
- Flask-CORS
- Flask-Limiter
- Psycopg

### Banco de dados

- PostgreSQL
- Neon

### Deploy e versionamento

- Vercel
- Git
- GitHub

---

## 🏗️ Arquitetura

O TaskFlow utiliza uma arquitetura separada entre frontend, API e banco de dados.

```text
┌──────────────────┐
│     Usuário      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   React + Vite   │
│     Frontend     │
└────────┬─────────┘
         │
         │ /api
         ▼
┌──────────────────┐
│      Flask       │
│    REST API      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    PostgreSQL    │
│      Neon        │
└──────────────────┘
```

O frontend é responsável pela interface e interação com o usuário.

O backend Flask concentra as regras de negócio, autenticação, validações e acesso aos dados.

O PostgreSQL mantém usuários, tarefas e categorias.

---

## 🔐 Segurança

Algumas medidas de segurança implementadas no projeto:

- Hash de senhas antes do armazenamento
- Cookies de sessão `HttpOnly`
- Cookies seguros em produção
- Proteção CSRF para operações autenticadas
- Rate limiting em endpoints sensíveis
- Bloqueio temporário após sucessivas tentativas incorretas de login
- Validação dos dados recebidos pela API
- Controle de acesso às tarefas pelo usuário autenticado
- Controle de acesso às categorias pelo usuário autenticado
- Variáveis sensíveis armazenadas em variáveis de ambiente
- Arquivos `.env` ignorados pelo Git
- CORS configurado para a origem autorizada

O frontend não define qual usuário é proprietário de uma tarefa. Essa identificação é feita no backend a partir da sessão autenticada.

---

## 📂 Estrutura do projeto

```text
taskflow/
│
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── README.md
└── vercel.json
```

---

## ⚙️ Executando localmente

### 1. Clone o repositório

```bash
git clone https://github.com/Everttoncrd/Tasksflow.git
cd Tasksflow
```

### 2. Configure o backend

Entre na pasta:

```bash
cd backend
```

Crie um ambiente virtual:

```bash
python -m venv venv
```

No Windows:

```bash
venv\Scripts\activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Crie um arquivo `.env` utilizando `.env.example` como referência.

Exemplo:

```env
SECRET_KEY=sua_chave_secreta
FRONTEND_ORIGIN=http://localhost:5173
FLASK_ENV=development
DATABASE_URL=sua_url_postgresql
```

> Nunca envie o arquivo `.env` ou suas credenciais para o GitHub.

Execute:

```bash
python app.py
```

A API estará disponível localmente em:

```text
http://localhost:5000
```

---

## 💻 Executando o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend ficará disponível em:

```text
http://localhost:5173
```

---

## 🔌 Principais endpoints

| Método | Endpoint | Função |
|---|---|---|
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Fazer login |
| GET | `/auth/me` | Obter usuário autenticado |
| GET | `/auth/csrf` | Obter token CSRF |
| POST | `/auth/logout` | Encerrar sessão |
| PUT | `/auth/change-password` | Alterar senha |
| GET | `/tasks` | Listar tarefas |
| POST | `/tasks` | Criar tarefa |
| PUT | `/tasks/:id` | Editar tarefa |
| PUT | `/tasks/:id/status` | Alterar status |
| DELETE | `/tasks/:id` | Excluir tarefa |
| GET | `/categories` | Listar categorias |
| POST | `/categories` | Criar categoria |
| PUT | `/categories/:id` | Editar categoria |
| DELETE | `/categories/:id` | Excluir categoria |
| GET | `/dashboard` | Dados do dashboard |

Em produção, o frontend acessa a API utilizando o prefixo `/api`.

---

## 🗄️ Banco de dados

O projeto utiliza PostgreSQL.

As principais entidades são:

### Users

Armazena as contas e informações necessárias para autenticação.

### Tasks

Armazena as tarefas e relaciona cada registro ao seu proprietário.

Entre os dados de uma tarefa estão:

- título
- descrição
- categoria
- prioridade
- status
- prazo
- data de criação

### Categories

Mantém as categorias individuais de cada usuário.

A relação por usuário impede que as tarefas e categorias de uma conta sejam tratadas como dados globais da aplicação.

---

## 🌐 Deploy

A aplicação está publicada utilizando:

- **Vercel** — frontend e backend
- **Neon** — PostgreSQL

O ambiente de produção utiliza variáveis de ambiente para armazenar configurações e credenciais que não devem fazer parte do código-fonte.

---

## 🎯 Objetivo do projeto

O TaskFlow foi criado como projeto de estudo e portfólio com o objetivo de aplicar, em uma aplicação real, conceitos de:

- Desenvolvimento frontend com React
- Desenvolvimento backend com Python e Flask
- APIs REST
- PostgreSQL
- Autenticação e autorização
- Segurança de aplicações web
- Integração frontend/backend
- Git e GitHub
- Deploy de aplicações Full Stack

---

## 🔮 Próximas melhorias

Algumas possibilidades para evolução futura:

- Recuperação de senha
- Verificação de e-mail
- Filtros e busca avançada
- Notificações de tarefas próximas do prazo
- Melhorias de acessibilidade
- Testes automatizados
- Melhorias na experiência mobile

---

## 👨‍💻 Autor

**Everton Cardoso da Silva**

Desenvolvedor em formação com foco em desenvolvimento web e construção de aplicações Full Stack.

- GitHub: [Everttoncrd](https://github.com/Everttoncrd)

---

## 📄 Licença

Projeto desenvolvido para fins de estudo e portfólio.
