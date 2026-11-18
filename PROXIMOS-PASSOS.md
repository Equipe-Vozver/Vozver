# vozver — onde paramos e próximos passos

Atualizado em 16/11/2026. Código congela em **23/11**. Demoday em **01/12**.

## Onde estamos

- **Site no ar:** https://vozver.onrender.com
  - Plano grátis do Render: se ninguém abrir por 15 minutos, o servidor "dorme" e a próxima abertura demora uns 50 segundos.
  - **No Demoday:** abrir o link uns 2 minutos antes de apresentar.
- **GitHub:** https://github.com/Equipe-Vozver/Vozver
  - Cada merge na `main` atualiza o site no Render sozinho.
- **Testado no Chrome do Android em 16/11:** tudo funcionando.
- **Já pronto:**
  - Telas: Boas-vindas, Prepare, Menu (dois toques), Ajustes (tema, fonte, voz), Ler código de barras, Comparar preços, Buscar por voz e Política.
  - API em Python (FastAPI).
  - O app pode ser instalado no celular.

## Configuração do Render (se precisar refazer)

| Campo | Valor |
|---|---|
| Build Command | `pip install -r backend/requirements.txt` |
| Start Command | `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Root Directory | (vazio) |
| Variável de ambiente | `PYTHON_VERSION` = `3.11.9` |

## Próximos passos

### 1. Testes do grupo (agora)
- [ ] Cada pessoa abre o link no próprio celular e testa todas as telas.
- [ ] Testar com o **TalkBack** ligado.
- [ ] Testar num **iPhone**, se alguém tiver.
- [ ] Anotar o que deu errado (tela, o que fez, o que aconteceu) e mandar para o Dan.

### 2. Mudanças no front-end (se o grupo decidir)
O visual pode mudar. Para não quebrar nada:
- Os arquivos ficam em `frontend/`:
  - `index.html` tem as telas;
  - `css/estilo.css` tem as cores e tamanhos;
  - `js/telas/` tem uma lógica para cada tela.
- **Não apague os `id="..."`** do HTML: o JavaScript usa eles para achar os botões.
- Cores sempre pelas variáveis do CSS (`var(--fundo)`, `var(--texto)`...), para o tema escuro continuar funcionando.
- Todo botão novo precisa de texto ou `aria-label`, para o leitor de tela falar.
- Toda mudança vai numa branch nova + Pull Request.

### 3. Banco MySQL (quando o grupo tiver o banco pronto)
**Não precisa criar outro back-end.** A API já existe e o site já usa ela. Só falta trocar de onde vêm os produtos:
- Hoje eles vêm da lista em `backend/produtos_teste.py`.
- Depois vão vir do MySQL.

O banco precisa ter, para cada produto, estas colunas: `codigo`, `nome`, `marca`, `peso`, `preco` (em centavos), `categoria`, `corredor`, `ingredientes` e `nutricional`.

O que fazer:
- [ ] Trocar as funções `buscar_por_codigo`, `buscar_por_nome` e `buscar_por_categoria` por consultas SQL, sempre com `%s`.
  - Manter os mesmos nomes de função e o mesmo formato de resposta.
  - Assim o front-end não muda nada.
- [ ] Senha do banco só no `backend/.env`, nunca no código.
- [ ] Para funcionar no Render, criar um MySQL online grátis e colocar os dados de acesso nas "Environment Variables" do Render.

### 4. LGPD (tratar como projeto comercial)
Regra do grupo: o vozver segue a LGPD como se fosse um produto de verdade.
- [ ] Revisar a Política de Privacidade (tela `politica` no `index.html`):
  - dizer que o site fica hospedado no **Render** (servidor fora do Brasil);
  - dizer que os ajustes ficam guardados **só no celular**;
  - dizer que a câmera e o microfone não gravam nada.
- [ ] Conferir se o reconhecimento de voz do navegador (o Google, no Chrome) precisa ser citado na política, já que o áudio do ditado passa por ele.
- [ ] Manter o mínimo de dados: sem conta, sem analytics, sem guardar buscas no servidor.
  - Se um dia precisar coletar algo, antes definir:
    - para que serve o dado;
    - a base legal;
    - o aviso na política;
    - como a pessoa pede para apagar.
- [ ] Quando ligar o MySQL: o banco guarda **só produtos**, nenhum dado de usuário. A senha fica no `.env` e nas variáveis do Render.
- [ ] Deixar o e-mail de contato do encarregado de dados (vozvercontato@gmail.com) fácil de achar na política.

### 5. Outras pendências
- [ ] Tradução para inglês.
- [ ] Opcional: no GitHub, exigir aprovação antes do merge (Settings → Branches).
- [ ] Opcional: confirmar com o Bigode que PWA + Python atende ao critério do curso.
