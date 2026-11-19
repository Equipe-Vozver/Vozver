# vozver — guia do projeto para o Claude Code

## O que é o projeto

O **vozver** é um app de acessibilidade para pessoas com baixa visão terem a autonomia de fazerem compras no mercado ("Ouça, Encontre, Escolha"). É uma **PWA** (site que funciona como app) feita por estudantes do Pró-Profissão (Instituto PROA + SENAC). O critério do curso é **Desenvolvimento web com Python**.

- Site no ar: https://vozver.onrender.com (Render grátis; dorme após 15 min sem uso)
- Demoday em **01/12/2026**.
- Plano e pendências: veja [PROXIMOS-PASSOS.md](PROXIMOS-PASSOS.md).

## Regras para o Claude (importante)

1. **Os alunos querem aprender e digitar o código.** Explique em português simples, passe o código pronto em pedaços (arquivo, onde colar, o que faz e por quê) e depois confira o que a pessoa fez. Só edite arquivos direto se ela pedir.
2. **Nunca coloque `Co-Authored-By: Claude`** nas mensagens de commit, nem "Generated with Claude Code" nos Pull Requests.
3. **Nunca faça commit direto na `main`** nem `push --force` sem o grupo combinar.
4. **LGPD como projeto comercial:** coletar o mínimo de dados (não há conta nem cadastro), câmera e microfone só com permissão, não guardar imagem, áudio nem buscas no servidor, senhas só no `.env`. Toda mudança no uso de dados atualiza a Política de Privacidade (tela `politica` no `index.html` e o resumo falado em `js/telas/politica.js`).
5. Não adicione funções fora do MVP sem o grupo pedir.

## Tecnologias

- **Front-end (`frontend/`):** HTML, CSS e JavaScript puros, sem framework.
  - `index.html`: todas as telas; cada `<section class="tela">` é uma tela.
  - `css/base.css`: cores (variáveis por tema), fontes e regras gerais; `css/telas/`: um arquivo por tela (mesmo nome do JS em `js/telas/`).
  - `js/`: `ajustes.js` (configurações e `falar()`), `navegacao.js` (troca de telas), `api.js` (chamadas à API), `telas/` (uma lógica por tela).
  - `vendor/`: leitor de código de barras (ZXing).
  - `manifest.json` e `sw.js`: instalar como app e funcionar sem internet.
- **Back-end (`backend/`):** Python 3.11 + FastAPI. O `main.py` entrega o site e a API (`/api/produtos/codigo/...`, `/busca`, `/categoria/...`). Os produtos de teste estão em `produtos_teste.py` até o banco MySQL do grupo ficar pronto; quando ficar, trocar só essas funções, mantendo as rotas e o formato do JSON.

## Como rodar

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Abra http://localhost:8000. Código de teste: `7890000000011`.

## Padrões de código

- **Tudo em português:** variáveis, funções e comentários. Comentários didáticos que explicam o "porquê".
- Indentação de 4 espaços; aspas simples no JavaScript.
- Cores sempre pelas variáveis do CSS (`var(--fundo)`, `var(--texto)`...), para o tema escuro funcionar.
- Tamanho de letra sempre com `--tamanho`.
- **Não apague os `id` do HTML:** o JavaScript usa eles.
- **Acessibilidade é o centro do app:** todo botão tem texto ou `aria-label`; toda tela fala ao abrir; respeitar o TalkBack e o "reduzir movimento".
- Back-end: SQL sempre com `%s` (nunca juntar strings) e credenciais só no `.env`.

## Colaboração (Git)

1. Antes de começar: `git checkout main` e `git pull`.
2. Uma branch por tarefa: `feat/nome-curto` (coisa nova) ou `fix/nome-curto` (correção).
3. Commits pequenos, com mensagem em português.
4. `git push -u origin nome-da-branch` e abrir Pull Request; o merge só depois de outra pessoa aprovar.
5. Cada merge na `main` atualiza o site no Render sozinho.