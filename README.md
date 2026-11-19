# vozver (PWA)

App web de acessibilidade para pessoas com deficiência visual fazerem compras no mercado: o celular fala o que está na tela, lê o código de barras dos produtos e diz em qual corredor cada um fica. *Ouça, Encontre, Escolha.*

Feito com **HTML, CSS e JavaScript** (o site) e **Python + FastAPI** (o servidor e a API).
Funciona no navegador do celular e pode ser **instalado como app** (PWA).

## Como rodar

Precisa do **Python 3.11**.

No terminal, dentro da pasta `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0
```

Depois abra:
- **http://localhost:8000**: o vozver
- **http://localhost:8000/docs**: a página para testar a API

Códigos de barras para testar (campo "Digitar o código", na tela da câmera):
`7890000000011` (café 500 g), `7890000000035` (leite condensado), `7890000000042` (biscoito), `7890000000097` (arroz).

> A câmera só funciona em `localhost` (no próprio computador) ou num endereço **https**.

## Pastas

```
PWA VozVer/
├── frontend/                 # o site (o que aparece no celular)
│   ├── index.html            # TODAS as telas; cada <section class="tela"> é uma tela
│   ├── css/                  # base.css (cores, fontes, temas) + telas/ (um arquivo por tela)
│   ├── js/                   
│   │   ├── ajustes.js        # escolhas salvas (tema, fonte, voz) e a função falar()
│   │   ├── navegacao.js      # troca de telas e o botão VOLTAR
│   │   ├── api.js            # conversa com o servidor Python (fetch)
│   │   ├── icones.js         # ícones do Figma em SVG
│   │   ├── telas/            # o que cada tela faz (menu, ajustes, leitor, busca...)
│   │   └── app.js            # liga tudo (carregado por último)
│   ├── manifest.json         # nome, ícone e cores para instalar como app
│   ├── sw.js                 # service worker: guarda os arquivos no celular
│   ├── img/, fontes/         # imagens e fontes (funcionam sem internet)
│   └── vendor/               # leitor de código de barras (ZXing) para quem não usa o Chrome do Android
└── backend/                  # o servidor em Python
    ├── main.py               # FastAPI: rotas da API + entrega o site
    ├── produtos_teste.py     # produtos de teste (até o MySQL ter preço e corredor)
    ├── banco.sql             # banco MySQL (vai substituir os produtos de teste)
    └── requirements.txt
```

## Telas

1. **Carregamento**: logo piscando
2. **Boas-vindas**: "Olá". O primeiro toque libera a voz (regra do navegador)
3. **Prepare seu vozver**: só na primeira vez
4. **Menu**: 3 botões com confirmação em dois toques
5. **Ajustes**: tema claro/escuro, **Fonte** e **Voz**
6. **Ler código de barras**: câmera + cartão do produto (ouvir detalhes, comparar, ler outro)
7. **Comparar preços**: mesma categoria, do mais barato para o mais caro
8. **Buscar por voz**: ditado ou texto; fala o corredor e como chegar
9. **Política de Privacidade**

## API

| Rota | O que faz |
|---|---|
| `GET /api/produtos/codigo/{codigo}` | produto pelo código de barras |
| `GET /api/produtos/busca?texto=arroz` | busca pelo nome (busca por voz) |
| `GET /api/produtos/categoria/{categoria}` | produtos da mesma categoria, do mais barato ao mais caro |

## Equipe

Alexsandra, Daniel, Gabriel, Isabella, Laryssa, Melissa e Samuel. Projeto de Demoday do Pró-Profissão (Instituto PROA + SENAC).
