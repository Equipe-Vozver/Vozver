# =====================================================================
# Produtos de teste do vozver
#
# Enquanto o banco MySQL ainda não tem preço e corredor, a API usa esta lista.
# Os campos aqui (preco, corredor...) são os que o banco vai precisar ter.
# Na fase do banco de dados, estas funções passam a buscar no MySQL
# (o main.py não precisa mudar: ele só chama estas funções).
#
# O preço fica em centavos (1890 = R$ 18,90) para não ter erro de conta com vírgula.
# =====================================================================

import re
import unicodedata

from corredores import com_onde_fica

PRODUTOS = [
    # ---------- Corredor 1: bebidas ----------
    {
        "codigo": "7890000000073",
        "nome": "Água Mineral sem Gás Crystal",
        "marca": "Crystal",
        "peso": "500 mililitros",
        "preco": 249,
        "categoria": "Água",
        "corredor": 1,
        "ingredientes": "Água mineral natural.",
        "nutricional": "Não tem calorias.",
    },
    {
        "codigo": "7890000000080",
        "nome": "Água Mineral sem Gás Minalba",
        "marca": "Minalba",
        "peso": "500 mililitros",
        "preco": 299,
        "categoria": "Água",
        "corredor": 1,
        "ingredientes": "Água mineral natural.",
        "nutricional": "Não tem calorias.",
    },
    # ---------- Corredor 2: matinais ----------
    {
        "codigo": "7890000000011",
        "nome": "Leite Integral Italac",
        "marca": "Italac",
        "peso": "1 litro",
        "preco": 549,
        "categoria": "Leite",
        "corredor": 2,
        "ingredientes": "Leite integral e estabilizantes. Contém lactose.",
        "nutricional": "Porção de 200 mililitros: 120 calorias, 6 gramas de proteínas e 9 gramas de carboidratos.",
    },
    {
        "codigo": "7890000000028",
        "nome": "Leite Integral Piracanjuba",
        "marca": "Piracanjuba",
        "peso": "1 litro",
        "preco": 619,
        "categoria": "Leite",
        "corredor": 2,
        "ingredientes": "Leite integral e estabilizantes. Contém lactose.",
        "nutricional": "Porção de 200 mililitros: 118 calorias, 6 gramas de proteínas e 9 gramas de carboidratos.",
    },
    {
        "codigo": "7890000000035",
        "nome": "Achocolatado em Pó Nescau",
        "marca": "Nestlé",
        "peso": "370 gramas",
        "preco": 899,
        "categoria": "Achocolatado",
        "corredor": 2,
        "ingredientes": "Açúcar, cacau em pó, maltodextrina, vitaminas e minerais. Pode conter leite.",
        "nutricional": "Porção de 20 gramas: 76 calorias, 17 gramas de carboidratos e 14 gramas de açúcares.",
    },
    {
        "codigo": "7890000000042",
        "nome": "Achocolatado em Pó Toddy",
        "marca": "PepsiCo",
        "peso": "370 gramas",
        "preco": 849,
        "categoria": "Achocolatado",
        "corredor": 2,
        "ingredientes": "Açúcar, cacau em pó, vitaminas e minerais. Pode conter leite.",
        "nutricional": "Porção de 20 gramas: 75 calorias, 17 gramas de carboidratos e 15 gramas de açúcares.",
    },
    # ---------- Corredor 3: enlatados ----------
    {
        "codigo": "7890000000059",
        "nome": "Milho Verde em Lata Quero",
        "marca": "Quero",
        "peso": "170 gramas",
        "preco": 449,
        "categoria": "Milho verde",
        "corredor": 3,
        "ingredientes": "Milho verde, água e sal.",
        "nutricional": "Porção de 130 gramas: 90 calorias, 17 gramas de carboidratos e 290 miligramas de sódio.",
    },
    {
        "codigo": "7890000000066",
        "nome": "Milho Verde em Lata Predilecta",
        "marca": "Predilecta",
        "peso": "170 gramas",
        "preco": 389,
        "categoria": "Milho verde",
        "corredor": 3,
        "ingredientes": "Milho verde, água e sal.",
        "nutricional": "Porção de 130 gramas: 88 calorias, 17 gramas de carboidratos e 280 miligramas de sódio.",
    },
    # ---------- Corredor 4: limpeza ----------
    # Produto de limpeza não é alimento: no lugar da tabela nutricional vai o aviso de segurança
    {
        "codigo": "7890000000097",
        "nome": "Detergente Líquido Ypê Neutro",
        "marca": "Ypê",
        "peso": "500 mililitros",
        "preco": 279,
        "categoria": "Detergente",
        "corredor": 4,
        "ingredientes": "Tensoativo aniônico, conservante, corante e água.",
        "nutricional": "Não é alimento. Não ingerir. Mantenha longe de crianças.",
    },
    {
        "codigo": "7890000000103",
        "nome": "Detergente Líquido Limpol Neutro",
        "marca": "Bombril",
        "peso": "500 mililitros",
        "preco": 299,
        "categoria": "Detergente",
        "corredor": 4,
        "ingredientes": "Tensoativo aniônico, conservante, corante e água.",
        "nutricional": "Não é alimento. Não ingerir. Mantenha longe de crianças.",
    },
    {
        "codigo": "7890000000110",
        "nome": "Desinfetante Pinho Sol Original",
        "marca": "Pinho Sol",
        "peso": "500 mililitros",
        "preco": 899,
        "categoria": "Desinfetante",
        "corredor": 4,
        "ingredientes": "Óleo de pinho, tensoativo, álcool e água.",
        "nutricional": "Não é alimento. Não ingerir. Mantenha longe de crianças.",
    },
    {
        "codigo": "7890000000127",
        "nome": "Desinfetante Pinho Bril",
        "marca": "Bombril",
        "peso": "500 mililitros",
        "preco": 549,
        "categoria": "Desinfetante",
        "corredor": 4,
        "ingredientes": "Óleo de pinho, tensoativo, álcool e água.",
        "nutricional": "Não é alimento. Não ingerir. Mantenha longe de crianças.",
    },
]


# Palavras que a pessoa fala, mas que não são o produto ("onde fica O arroz?")
PALAVRAS_IGNORADAS = {
    "onde", "fica", "ficam", "o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das",
    "tem", "quero", "procuro", "procurar", "comprar", "e", "eu", "me", "mostra", "preciso",
    "cade", "qual", "quais", "corredor", "no", "na", "por", "favor", "esta", "estao", "achar", "em",
}


def simplificar(texto):
    """Tira acentos e pontuação e deixa minúsculo: "Café!" vira "cafe"."""
    sem_acento = unicodedata.normalize("NFD", texto)
    sem_acento = "".join(letra for letra in sem_acento if unicodedata.category(letra) != "Mn")
    sem_pontuacao = re.sub(r"[^\w\s]", " ", sem_acento)
    return sem_pontuacao.lower().strip()


# Apelidos: o jeito que a pessoa fala -> o nome que está no mercado.
# Ex.: muita gente chama o lava-roupas de "sabão em pó" ou "sabão líquido".
# Para ensinar um apelido novo, é só acrescentar uma linha aqui (sem acento e minúsculo).
APELIDOS = {
    "sabao": "lava roupas",
}


def palavras_da_busca(texto):
    """Separa o que a pessoa falou em palavras, tira as que não ajudam
    ("onde fica O...") e troca os apelidos pelo nome do mercado."""
    palavras = []
    for palavra in simplificar(texto).split():
        if palavra in PALAVRAS_IGNORADAS:
            continue
        palavras.extend(APELIDOS.get(palavra, palavra).split())
    return palavras


def buscar_por_codigo(codigo):
    """Procura um produto pelo código de barras. Devolve None se não achar."""
    for produto in PRODUTOS:
        if produto["codigo"] == codigo:
            return com_onde_fica(produto)
    return None


def palavra_aparece(palavra, texto):
    """Confere se a palavra está no texto como palavra INTEIRA.
    Antes bastava aparecer um pedaço: "agua" achava "mAGUAry" (o suco).
    Aceita plural nos dois sentidos: "biscoitos" acha "biscoito" e "roupa" acha "roupas"."""
    for palavra_do_texto in texto.split():
        if palavra in (palavra_do_texto, palavra_do_texto + "s") or palavra + "s" == palavra_do_texto:
            return True
    return False


def mais_parecidos(produtos, texto, ordem):
    """Os produtos que mais combinam com o que a pessoa falou (no nome, na marca ou na categoria).
    Quem acerta mais palavras ganha. Os que empatam vêm na "ordem" pedida (ex.: do mais barato).
    O banco.py usa esta mesma função: assim a regra da busca fica escrita num lugar só."""
    palavras = palavras_da_busca(texto)
    encontrados = []
    for produto in produtos:
        onde_procurar = simplificar(f'{produto["nome"]} {produto["marca"]} {produto["categoria"]}')
        acertos = sum(1 for palavra in palavras if palavra_aparece(palavra, onde_procurar))
        if acertos > 0:
            encontrados.append((acertos, produto))
    if not encontrados:
        return []
    melhor = max(acertos for acertos, produto in encontrados)
    return sorted((produto for acertos, produto in encontrados if acertos == melhor), key=ordem)


def buscar_por_nome(texto, de=0):
    """Procura pelo que a pessoa falou ou digitou. Empate: o mais barato primeiro."""
    return [com_onde_fica(produto, de) for produto in mais_parecidos(PRODUTOS, texto, lambda p: p["preco"])]


def buscar_por_categoria(categoria):
    """Produtos da mesma categoria, do mais barato para o mais caro (a balança)."""
    procurada = simplificar(categoria)
    lista = [p for p in PRODUTOS if simplificar(p["categoria"]) == procurada]
    lista.sort(key=lambda produto: produto["preco"])
    return [com_onde_fica(produto) for produto in lista]
