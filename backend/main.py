# =====================================================================
# Servidor do vozver (Python + FastAPI)
#
# Ele faz duas coisas:
#   1) API: responde os produtos em JSON (rotas que começam com /api)
#   2) Site: entrega os arquivos da pasta frontend/ (HTML, CSS, JS, imagens)
# Assim o site e a API ficam no mesmo endereço.
#
# Para rodar (dentro da pasta backend, com o .venv ativado):
#     uvicorn main:app --reload --host 0.0.0.0
# Depois abra no navegador:
#     http://localhost:8000        -> o vozver
#     http://localhost:8000/docs   -> a página para testar a API
# =====================================================================

import mimetypes
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

import produtos_teste

# O Windows às vezes não conhece o tipo do arquivo .wasm (o "motor" do leitor de código)
mimetypes.add_type("application/wasm", ".wasm")

# Pasta do site: ../frontend (ao lado da pasta backend)
PASTA_DO_SITE = Path(__file__).parent.parent / "frontend"

# Frase falada quando o produto não está cadastrado
NAO_ENCONTRADO = "Não consegui identificar o produto. Vamos tentar de novo?"

app = FastAPI(title="API vozver")


@app.get("/api")
def inicio():
    """Rota de teste: se aparecer esta mensagem, a API está no ar."""
    return {"mensagem": "API do vozver funcionando"}


@app.get("/api/produtos/codigo/{codigo}")
def produto_pelo_codigo(codigo: str):
    """Procura o produto pelo número do código de barras (tela Ler código)."""
    produto = produtos_teste.buscar_por_codigo(codigo)
    if produto is None:
        # 404 = "não encontrado"
        raise HTTPException(status_code=404, detail=NAO_ENCONTRADO)
    return produto


@app.get("/api/produtos/busca")
def produtos_pelo_nome(texto: str):
    """Procura pelo que a pessoa falou ou digitou (tela Buscar por voz).
    Exemplo: /api/produtos/busca?texto=onde fica o arroz"""
    return produtos_teste.buscar_por_nome(texto)


@app.get("/api/produtos/categoria/{categoria}")
def produtos_da_categoria(categoria: str):
    """Produtos da mesma categoria, do mais barato para o mais caro (tela Comparar)."""
    return produtos_teste.buscar_por_categoria(categoria)


# O site: qualquer endereço que não seja da API entrega um arquivo da pasta frontend.
# html=True: o endereço "/" entrega o index.html.
# Fica por último, para não "esconder" as rotas da API.
app.mount("/", StaticFiles(directory=PASTA_DO_SITE, html=True), name="site")
