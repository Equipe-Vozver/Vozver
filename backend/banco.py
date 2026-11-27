# =====================================================================
# Produtos do vozver vindos do banco MySQL
#
# Tem as MESMAS funções do produtos_teste.py (buscar_por_codigo,
# buscar_por_nome e buscar_por_categoria) e devolve o produto no MESMO
# formato. Por isso o front-end não precisa mudar nada.
#
# Os dados de acesso ao banco vêm do arquivo .env (nunca do código).
# Todo SQL usa %s: o PyMySQL coloca o valor com segurança (sem SQL injection).
# =====================================================================

import os

import pymysql
from dotenv import load_dotenv

from corredores import com_onde_fica
# As regras de "entender o que a pessoa falou" são as mesmas da lista de teste
from produtos_teste import mais_parecidos

load_dotenv()   # lê o backend/.env


def certificado_ssl():
    """Caminho do ca.pem, quando o banco exige conexão segura (SSL), como o da Aiven.
    No XAMPP a variável DB_SSL_CA fica vazia e a conexão é normal."""
    nome = os.getenv("DB_SSL_CA")
    if not nome:
        return None
    # O ca.pem fica na mesma pasta deste arquivo (backend/)
    return os.path.join(os.path.dirname(__file__), nome)


def conectar():
    """Abre uma conexão com o banco usando os dados do .env."""
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_SENHA", ""),
        database=os.getenv("DB_NOME", "vozver"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,   # cada linha vem como dicionário
        ssl_ca=certificado_ssl(),                 # None = sem SSL (XAMPP)
    )


def consultar(sql, parametros=()):
    """Roda um SELECT e devolve a lista de linhas. Sempre fecha a conexão."""
    conexao = conectar()
    try:
        with conexao.cursor() as cursor:
            cursor.execute(sql, parametros)
            return cursor.fetchall()
    finally:
        conexao.close()


# ---------- Transformar os números do banco em frases faladas ----------

def numero_falado(valor):
    """500.00 vira "500" e 0.80 vira "0,8" (vírgula, como se fala no Brasil)."""
    if valor is None:
        return "0"
    numero = float(valor)
    if numero == int(numero):
        return str(int(numero))
    return f"{numero:.1f}".replace(".", ",")


def peso_falado(quantidade, unidade):
    """(350, "g") vira "350 gramas"; (1000, "ml") vira "1 litro"."""
    numero = float(quantidade)
    if unidade == "g" and numero >= 1000:
        numero, unidade = numero / 1000, "kg"
    if unidade == "ml" and numero >= 1000:
        numero, unidade = numero / 1000, "L"

    texto = numero_falado(numero)
    um = numero == 1
    nomes = {
        "g": "gramas",
        "kg": "quilo" if um else "quilos",
        "ml": "mililitros",
        "L": "litro" if um else "litros",
        "un": "unidade" if um else "unidades",
    }
    return f"{texto} {nomes.get(unidade, unidade)}"


def preco_por_quilo(preco, quantidade, unidade):
    """Quanto custaria 1 quilo (ou 1 litro), em centavos.
    Ex.: 350 g por 949 centavos -> 2711 centavos o quilo.
    Devolve None quando não dá para comparar (ex.: "un")."""
    numero = float(quantidade)
    if numero <= 0:
        return None
    if unidade in ("g", "ml"):
        return round(preco * 1000 / numero)
    if unidade in ("kg", "L"):
        return round(preco / numero)
    return None


def texto_nutricional(linha):
    """Monta a frase da tabela nutricional (ou o aviso, se não for alimento)."""
    if not linha["alimento"]:
        return "Não é alimento. Não ingerir. Mantenha longe de crianças."
    if linha["porcao_descricao"] is None:
        return "Este produto não tem tabela nutricional cadastrada."

    frase = (
        f'Porção de {linha["porcao_descricao"]}: '
        f'{numero_falado(linha["valor_energetico"])} calorias, '
        f'{numero_falado(linha["carboidratos"])} gramas de carboidratos, '
        f'{numero_falado(linha["acucares"])} gramas de açúcares, '
        f'{numero_falado(linha["proteinas"])} gramas de proteínas, '
        f'{numero_falado(linha["gorduras_totais"])} gramas de gorduras e '
        f'{numero_falado(linha["sodio"])} miligramas de sódio.'
    )
    if linha["gluten"] is not None:
        frase += " Contém glúten." if linha["gluten"] else " Não contém glúten."
    return frase


def montar_produto(linha):
    """Transforma uma linha da vw_produtos no produto que o app espera."""
    unidade = linha["unidade"]
    return {
        "codigo": linha["codigo"],
        "nome": linha["nome"],
        "marca": linha["marca"],
        "peso": peso_falado(linha["quantidade"], unidade),
        "preco": linha["preco"],
        "preco_por_quilo": preco_por_quilo(linha["preco"], linha["quantidade"], unidade),
        "medida_comparacao": "litro" if unidade in ("ml", "L") else "quilo",
        "categoria": linha["categoria"],
        "corredor": linha["corredor"],
        "secao": linha["secao"],
        "ingredientes": linha["ingredientes"] or "Ingredientes não cadastrados.",
        "nutricional": texto_nutricional(linha),
    }


def ordem_de_preco(produto):
    """Para ordenar do mais em conta para o mais caro: pelo preço por quilo,
    ou pelo preço da embalagem quando não dá para calcular o quilo."""
    if produto["preco_por_quilo"] is not None:
        return produto["preco_por_quilo"]
    return produto["preco"]


# ---------- As 3 funções que o main.py usa ----------

def buscar_por_codigo(codigo):
    """Procura um produto pelo código de barras. Devolve None se não achar."""
    linhas = consultar("SELECT * FROM vw_produtos WHERE codigo = %s", (codigo,))
    if not linhas:
        return None
    return com_onde_fica(montar_produto(linhas[0]))


def buscar_por_nome(texto, de=0):
    """Procura pelo que a pessoa falou ou digitou, do mais em conta para o mais caro.
    São poucos produtos: pega todos e compara no Python, com a mesma regra da lista de teste."""
    produtos = [montar_produto(linha) for linha in consultar("SELECT * FROM vw_produtos")]
    return [com_onde_fica(produto, de) for produto in mais_parecidos(produtos, texto, ordem_de_preco)]


def buscar_por_categoria(categoria):
    """Produtos da mesma categoria, do mais em conta para o mais caro (a balança).
    Compara pelo preço por quilo (ou litro), porque as embalagens têm pesos diferentes."""
    linhas = consultar("SELECT * FROM vw_produtos WHERE categoria = %s", (categoria,))
    lista = [montar_produto(linha) for linha in linhas]
    lista.sort(key=ordem_de_preco)
    return [com_onde_fica(produto) for produto in lista]