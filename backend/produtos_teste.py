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

PRODUTOS = [
    {
        "codigo": "7890000000011",
        "nome": "Café Melitta Tradicional",
        "marca": "Melitta",
        "peso": "500 gramas",
        "preco": 1890,
        "categoria": "Café",
        "corredor": 1,
        "ingredientes": "Café torrado e moído.",
        "nutricional": "Não tem valor nutricional significativo.",
    },
    {
        "codigo": "7890000000028",
        "nome": "Café Melitta Tradicional",
        "marca": "Melitta",
        "peso": "250 gramas",
        "preco": 1050,
        "categoria": "Café",
        "corredor": 1,
        "ingredientes": "Café torrado e moído.",
        "nutricional": "Não tem valor nutricional significativo.",
    },
    {
        "codigo": "7890000000035",
        "nome": "Leite Condensado Moça",
        "marca": "Nestlé",
        "peso": "395 gramas",
        "preco": 749,
        "categoria": "Leite condensado",
        "corredor": 2,
        "ingredientes": "Leite integral, açúcar e lactose.",
        "nutricional": "Porção de 20 gramas: 65 calorias, 13 gramas de carboidratos e 10 gramas de açúcares.",
    },
    {
        "codigo": "7890000000042",
        "nome": "Biscoito Cream Cracker",
        "marca": "Marilan",
        "peso": "200 gramas",
        "preco": 529,
        "categoria": "Biscoito",
        "corredor": 3,
        "ingredientes": "Farinha de trigo, gordura vegetal, sal e fermento. Contém glúten.",
        "nutricional": "Porção de 30 gramas: 130 calorias, 20 gramas de carboidratos e 210 miligramas de sódio.",
    },
    # Produtos de outras marcas, para a comparação de preços ter com quem comparar
    {
        "codigo": "7890000000059",
        "nome": "Café Pilão Tradicional",
        "marca": "Pilão",
        "peso": "500 gramas",
        "preco": 2190,
        "categoria": "Café",
        "corredor": 1,
        "ingredientes": "Café torrado e moído.",
        "nutricional": "Não tem valor nutricional significativo.",
    },
    {
        "codigo": "7890000000066",
        "nome": "Café 3 Corações Tradicional",
        "marca": "3 Corações",
        "peso": "500 gramas",
        "preco": 1790,
        "categoria": "Café",
        "corredor": 1,
        "ingredientes": "Café torrado e moído.",
        "nutricional": "Não tem valor nutricional significativo.",
    },
    {
        "codigo": "7890000000073",
        "nome": "Leite Condensado Italac",
        "marca": "Italac",
        "peso": "395 gramas",
        "preco": 599,
        "categoria": "Leite condensado",
        "corredor": 2,
        "ingredientes": "Leite integral, açúcar e lactose.",
        "nutricional": "Porção de 20 gramas: 64 calorias e 11 gramas de carboidratos.",
    },
    {
        "codigo": "7890000000080",
        "nome": "Biscoito Cream Cracker Vitarella",
        "marca": "Vitarella",
        "peso": "350 gramas",
        "preco": 649,
        "categoria": "Biscoito",
        "corredor": 3,
        "ingredientes": "Farinha de trigo, gordura vegetal, sal e fermento. Contém glúten.",
        "nutricional": "Porção de 30 gramas: 128 calorias e 200 miligramas de sódio.",
    },
    # Arroz e feijão: os exemplos da busca por voz ("onde fica o arroz?")
    {
        "codigo": "7890000000097",
        "nome": "Arroz Tio João Tipo 1",
        "marca": "Tio João",
        "peso": "1 quilo",
        "preco": 799,
        "categoria": "Arroz",
        "corredor": 4,
        "ingredientes": "Arroz agulhinha tipo 1.",
        "nutricional": "Porção de 50 gramas cru: 175 calorias e 39 gramas de carboidratos.",
    },
    {
        "codigo": "7890000000103",
        "nome": "Arroz Camil Tipo 1",
        "marca": "Camil",
        "peso": "1 quilo",
        "preco": 749,
        "categoria": "Arroz",
        "corredor": 4,
        "ingredientes": "Arroz agulhinha tipo 1.",
        "nutricional": "Porção de 50 gramas cru: 174 calorias e 39 gramas de carboidratos.",
    },
    {
        "codigo": "7890000000110",
        "nome": "Feijão Carioca Camil",
        "marca": "Camil",
        "peso": "1 quilo",
        "preco": 849,
        "categoria": "Feijão",
        "corredor": 4,
        "ingredientes": "Feijão carioca tipo 1.",
        "nutricional": "Porção de 60 gramas cru: 196 calorias, 14 gramas de proteínas e 15 gramas de fibras.",
    },
]

# Os corredores do mercado de teste e como chegar neles a partir da entrada
CORREDORES = {
    1: "Da entrada, é o primeiro corredor à sua esquerda.",
    2: "Da entrada, siga em frente e entre no segundo corredor à esquerda.",
    3: "Da entrada, siga em frente e entre no terceiro corredor à esquerda.",
    4: "Da entrada, siga em frente até o fundo da loja e vire à direita. É o primeiro corredor.",
}

# Palavras que a pessoa fala, mas que não são o produto ("onde fica O arroz?")
PALAVRAS_IGNORADAS = {
    "onde", "fica", "ficam", "o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das",
    "tem", "quero", "procuro", "procurar", "comprar", "e", "eu", "me", "mostra", "preciso",
    "cade", "qual", "quais", "corredor", "no", "na", "por", "favor", "esta", "estao", "achar",
}


def simplificar(texto):
    """Tira acentos e pontuação e deixa minúsculo: "Café!" vira "cafe"."""
    sem_acento = unicodedata.normalize("NFD", texto)
    sem_acento = "".join(letra for letra in sem_acento if unicodedata.category(letra) != "Mn")
    sem_pontuacao = re.sub(r"[^\w\s]", " ", sem_acento)
    return sem_pontuacao.lower().strip()


def com_onde_fica(produto):
    """Devolve uma cópia do produto com a frase de onde ele fica no mercado."""
    copia = dict(produto)
    copia["onde_fica"] = (
        f'{produto["categoria"]} fica no corredor {produto["corredor"]}. '
        f'{CORREDORES[produto["corredor"]]}'
    )
    return copia


def buscar_por_codigo(codigo):
    """Procura um produto pelo código de barras. Devolve None se não achar."""
    for produto in PRODUTOS:
        if produto["codigo"] == codigo:
            return com_onde_fica(produto)
    return None


def palavra_aparece(palavra, texto):
    """Confere se a palavra está no texto. Aceita plural: "biscoitos" acha "biscoito"."""
    if palavra in texto:
        return True
    return palavra.endswith("s") and len(palavra) > 3 and palavra[:-1] in texto


def buscar_por_nome(texto):
    """Procura pelo que a pessoa falou ou digitou (no nome, na marca ou na categoria).
    Devolve os produtos que mais combinam, do mais barato para o mais caro."""
    palavras = [p for p in simplificar(texto).split() if p not in PALAVRAS_IGNORADAS]
    if not palavras:
        return []

    encontrados = []
    for produto in PRODUTOS:
        onde_procurar = simplificar(f'{produto["nome"]} {produto["marca"]} {produto["categoria"]}')
        acertos = sum(1 for palavra in palavras if palavra_aparece(palavra, onde_procurar))
        if acertos > 0:
            encontrados.append((acertos, produto))

    # Quem acertou mais palavras vem primeiro; empate: o mais barato primeiro
    encontrados.sort(key=lambda par: (-par[0], par[1]["preco"]))
    melhor = encontrados[0][0] if encontrados else 0
    return [com_onde_fica(produto) for acertos, produto in encontrados if acertos == melhor]


def buscar_por_categoria(categoria):
    """Produtos da mesma categoria, do mais barato para o mais caro (a balança)."""
    procurada = simplificar(categoria)
    lista = [p for p in PRODUTOS if simplificar(p["categoria"]) == procurada]
    lista.sort(key=lambda produto: produto["preco"])
    return [com_onde_fica(produto) for produto in lista]
