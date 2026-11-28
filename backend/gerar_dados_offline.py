# =====================================================================
# Gera o arquivo de produtos para o app funcionar SEM INTERNET
#
# O vozver normalmente pergunta os produtos ao servidor (Render + banco Aiven).
# No Demoday não vai ter internet. Então copiamos tudo o que a busca precisa
# para um arquivo dentro do site (frontend/dados/produtos_offline.json).
# O celular guarda esse arquivo e usa quando o servidor não responde.
#
# Quando rodar: SEMPRE que mudar algum produto ou preço no banco.
# Como rodar (dentro da pasta backend, com o .venv ativado):
#     python gerar_dados_offline.py
# =====================================================================

import json
from datetime import date
from pathlib import Path

import banco
from corredores import CORREDORES, como_chegar
from produtos_teste import APELIDOS, PALAVRAS_IGNORADAS

DESTINO = Path(__file__).parent.parent / "frontend" / "dados" / "produtos_offline.json"


def gerar():
    produtos = [banco.montar_produto(linha) for linha in banco.consultar("SELECT * FROM vw_produtos")]

    # As frases de "como chegar" de cada lugar (0 = entrada) para cada corredor.
    # Assim o JavaScript não precisa repetir as regras do corredores.py: só escolhe a frase.
    caminhos = {}
    for de in [0, *CORREDORES]:
        caminhos[de] = {para: como_chegar(de, para) for para in CORREDORES}

    dados = {
        "gerado_em": date.today().isoformat(),
        "produtos": produtos,
        "caminhos": caminhos,
        "palavras_ignoradas": sorted(PALAVRAS_IGNORADAS),
        "apelidos": APELIDOS,
    }
    DESTINO.parent.mkdir(exist_ok=True)
    # ensure_ascii=False: os acentos ficam legíveis no arquivo
    DESTINO.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Pronto: {len(produtos)} produtos salvos em {DESTINO}")


if __name__ == "__main__":
    gerar()
