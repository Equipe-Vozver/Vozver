-- =====================================================================
-- Banco de dados do vozver (MySQL 8, MariaDB do XAMPP ou MySQL da Aiven)
-- Feito a partir do modelo lógico do grupo (Desktop/VOZVER/Lógico_vozver.brM3),
-- com corredor, preço e ingredientes para o app.
--
-- Como usar: abra este arquivo no MySQL Workbench e clique no raio (⚡)
-- para rodar tudo. Ele APAGA e cria de novo o banco "vozver",
-- então só rode de novo se quiser começar do zero.
-- CUIDADO: confira o nome da conexão na aba (vozver-xampp ou vozver-aiven)
-- antes de rodar.
--
-- LGPD: o banco guarda só PRODUTOS. Nenhum dado de quem usa o app.
-- =====================================================================

DROP DATABASE IF EXISTS vozver;
-- utf8mb4_general_ci funciona no MySQL 8 e no MariaDB (XAMPP)
CREATE DATABASE vozver CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE vozver;

-- ---------------------------------------------------------------------
-- corredor: os corredores do mercado e o nome da seção de cada um
-- (o mesmo que está escrito nas plaquinhas da banca)
-- ---------------------------------------------------------------------
CREATE TABLE corredor (
    numero TINYINT PRIMARY KEY,      -- 1, 2, 3, 4
    secao  VARCHAR(40) NOT NULL      -- Bebidas, Matinais...
);

-- ---------------------------------------------------------------------
-- categoria: tipo do produto (Achocolatado, Feijão, Detergente...)
-- Cada categoria fica num corredor.
-- ---------------------------------------------------------------------
CREATE TABLE categoria (
    id_categoria       INT AUTO_INCREMENT PRIMARY KEY,
    nome_categoria     VARCHAR(60) NOT NULL UNIQUE,
    alimento           BOOLEAN NOT NULL DEFAULT TRUE,   -- FALSE = limpeza (não é para comer)
    fk_corredor_numero TINYINT NOT NULL,
    FOREIGN KEY (fk_corredor_numero) REFERENCES corredor (numero)
);

-- ---------------------------------------------------------------------
-- marca: fabricante (Nestlé, Ypê...)
-- ---------------------------------------------------------------------
CREATE TABLE marca (
    id_marca   INT AUTO_INCREMENT PRIMARY KEY,
    nome_marca VARCHAR(60) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- produto: o produto "em geral" (ex.: Achocolatado em Pó Nescau)
-- Se a categoria ou a marca for apagada, o produto vai junto (CASCADE),
-- como está no modelo.
-- ---------------------------------------------------------------------
CREATE TABLE produto (
    id_produto                INT AUTO_INCREMENT PRIMARY KEY,
    nome                      VARCHAR(120) NOT NULL,
    descricao                 VARCHAR(255),
    ingredientes              TEXT,
    fk_categoria_id_categoria INT NOT NULL,
    fk_marca_id_marca         INT NOT NULL,
    FOREIGN KEY (fk_categoria_id_categoria) REFERENCES categoria (id_categoria) ON DELETE CASCADE,
    FOREIGN KEY (fk_marca_id_marca)         REFERENCES marca (id_marca)         ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- embalagem: o tamanho vendido (o mesmo produto em 350 g e em 1 kg)
-- O preço fica aqui, porque cada tamanho tem o seu preço.
-- ---------------------------------------------------------------------
CREATE TABLE embalagem (
    id_embalagem          INT AUTO_INCREMENT PRIMARY KEY,
    quantidade            DECIMAL(10,2) NOT NULL,   -- ex.: 500
    unidade_medida        VARCHAR(10)   NOT NULL,   -- ex.: g, kg, ml, L, un
    preco                 INT           NOT NULL,   -- em centavos: 949 = R$ 9,49
    fk_produto_id_produto INT NOT NULL,
    FOREIGN KEY (fk_produto_id_produto) REFERENCES produto (id_produto) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- codigodebarras: cada embalagem tem 1 ou mais códigos (EAN-13)
-- RESTRICT: não deixa apagar uma embalagem que ainda tem código.
-- ---------------------------------------------------------------------
CREATE TABLE codigodebarras (
    id_codigo                 INT AUTO_INCREMENT PRIMARY KEY,
    codigo                    VARCHAR(20) NOT NULL UNIQUE,
    fk_embalagem_id_embalagem INT NOT NULL,
    FOREIGN KEY (fk_embalagem_id_embalagem) REFERENCES embalagem (id_embalagem) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------
-- informacao_nutricional: tabela nutricional de uma embalagem
-- Valores por porção (a porção fica escrita em porcao_descricao).
-- ---------------------------------------------------------------------
CREATE TABLE informacao_nutricional (
    id_nutricional            INT AUTO_INCREMENT PRIMARY KEY,
    porcao_descricao          VARCHAR(60),       -- ex.: "20 gramas"
    valor_energetico          DECIMAL(7,2),      -- kcal
    carboidratos              DECIMAL(7,2),      -- g
    acucares                  DECIMAL(7,2),      -- g
    proteinas                 DECIMAL(7,2),      -- g
    gorduras_totais           DECIMAL(7,2),      -- g
    gorduras_saturadas        DECIMAL(7,2),      -- g
    gorduras_trans            DECIMAL(7,2),      -- g
    fibra_alimentar           DECIMAL(7,2),      -- g
    sodio                     DECIMAL(7,2),      -- mg
    gluten                    BOOLEAN,           -- TRUE = contém glúten
    fk_embalagem_id_embalagem INT NOT NULL UNIQUE,
    FOREIGN KEY (fk_embalagem_id_embalagem) REFERENCES embalagem (id_embalagem) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- vw_produtos: junta todas as tabelas numa "tabela virtual".
-- O Python só faz SELECT nela, sem precisar repetir os JOINs toda vez.
-- LEFT JOIN na nutricional: produto de limpeza não tem tabela nutricional.
-- ---------------------------------------------------------------------
CREATE VIEW vw_produtos AS
SELECT
    cb.codigo,
    p.nome,
    m.nome_marca     AS marca,
    e.quantidade,
    e.unidade_medida AS unidade,
    e.preco,
    c.nome_categoria AS categoria,
    c.alimento,
    co.numero        AS corredor,
    co.secao,
    p.ingredientes,
    n.porcao_descricao,
    n.valor_energetico,
    n.carboidratos,
    n.acucares,
    n.proteinas,
    n.gorduras_totais,
    n.sodio,
    n.gluten
FROM codigodebarras cb
JOIN embalagem e  ON e.id_embalagem = cb.fk_embalagem_id_embalagem
JOIN produto p    ON p.id_produto   = e.fk_produto_id_produto
JOIN marca m      ON m.id_marca     = p.fk_marca_id_marca
JOIN categoria c  ON c.id_categoria = p.fk_categoria_id_categoria
JOIN corredor co  ON co.numero      = c.fk_corredor_numero
LEFT JOIN informacao_nutricional n ON n.fk_embalagem_id_embalagem = e.id_embalagem;


-- =====================================================================
-- PRODUTOS DA BANCA DO DEMODAY (todos reais, das fotos das embalagens)
-- Regra: o nome do produto vai SEM a marca (o app já fala a marca depois).
-- Cada tabela conta os ids a partir do 1, na ordem das linhas.
-- O comentário "-- 7" no fim da linha mostra o id dela, para não se perder.
-- =====================================================================

-- Os 4 corredores da banca (iguais às plaquinhas)
INSERT INTO corredor (numero, secao) VALUES
    (1, 'Bebidas'), (2, 'Matinais'), (3, 'Mercearia'), (4, 'Limpeza');

-- Cada categoria precisa de 2 produtos ou mais para a balança comparar.
-- alimento = FALSE: o app fala o aviso de segurança no lugar da tabela nutricional
INSERT INTO categoria (nome_categoria, alimento, fk_corredor_numero) VALUES
    ('Água',                 TRUE,  1),   -- 1
    ('Suco',                 TRUE,  1),   -- 2
    ('Achocolatado',         TRUE,  2),   -- 3
    ('Cereal',               TRUE,  2),   -- 4
    ('Iogurte',              TRUE,  2),   -- 5
    ('Açúcar',               TRUE,  3),   -- 6
    ('Sal',                  TRUE,  3),   -- 7
    ('Macarrão Instantâneo', TRUE,  3),   -- 8
    ('Multiuso',             FALSE, 4),   -- 9
    ('Desinfetante',         FALSE, 4),   -- 10
    ('Detergente',           FALSE, 4),   -- 11
    ('Amaciante',            FALSE, 4),   -- 12
    ('Lava-Roupas',          FALSE, 4);   -- 13

-- A marca é o nome que a pessoa conhece e fala na busca ("Toddy", "Omo")
INSERT INTO marca (nome_marca) VALUES
    ('Crystal'),       -- 1
    ('Bioleve'),       -- 2
    ('Lindoya'),       -- 3
    ('Del Valle'),     -- 4
    ('Maguary'),       -- 5
    ('Toddy'),         -- 6
    ('Nescau'),        -- 7
    ('Kellogg''s'),    -- 8  (duas aspas '' = o jeito de escrever ' dentro do texto)
    ('Nestlé'),        -- 9
    ('Verde Campo'),   -- 10
    ('Vigor'),         -- 11
    ('Da Barra'),      -- 12
    ('União'),         -- 13
    ('Master'),        -- 14
    ('Nissin Miojo'),  -- 15
    ('Panco'),         -- 16
    ('Coala Zulu'),    -- 17
    ('Veja'),          -- 18
    ('Agi Fácil'),     -- 19
    ('Lysoform'),      -- 20
    ('Limpol'),        -- 21
    ('Ypê'),           -- 22
    ('Comfort'),       -- 23
    ('Omo'),           -- 24
    ('Plush');         -- 25

-- (nome, ingredientes, id da categoria, id da marca)
-- Na limpeza, "ingredientes" guarda a composição do rótulo.
INSERT INTO produto (nome, ingredientes, fk_categoria_id_categoria, fk_marca_id_marca) VALUES
    -- ---------- Corredor 1: Bebidas ----------
    ('Água Mineral sem Gás', 'Água mineral fluoretada. Sódio: 35,66 miligramas por litro.', 1, 1),   -- 1
    ('Água Mineral sem Gás', 'Água mineral natural.', 1, 2),                                         -- 2
    ('Água Mineral sem Gás', 'Água mineral natural.', 1, 3),                                         -- 3
    ('Suco 100% de Laranja',
     'Suco concentrado reconstituído de laranja, vitamina C e aroma natural. Sem adição de açúcares. ALÉRGICOS: pode conter soja, aveia, castanha-de-caju, castanha-do-pará, amêndoa, amendoim e macadâmias.',
     2, 4),                                                                                          -- 4
    ('Suco 100% de Uva',
     'Suco concentrado reconstituído de uva, vitamina C e aroma natural. Sem adição de açúcares. ALÉRGICOS: pode conter soja, aveia, castanha-de-caju, castanha-do-pará, amêndoa, amendoim e macadâmias.',
     2, 4),                                                                                          -- 5
    ('Suco de Maracujá',
     'Água, açúcar, suco concentrado de maracujá, vitamina C, acidulante ácido cítrico, aromatizante natural, corante betacaroteno, estabilizante goma xantana, edulcorantes sucralose e acessulfame de potássio e antiespumante.',
     2, 5),                                                                                          -- 6

    -- ---------- Corredor 2: Matinais ----------
    ('Achocolatado em Pó',
     'Açúcar, cacau, carbonato de cálcio, maltodextrina, extrato de malte de cevada, sal, vitaminas B1 e B6, aromatizantes e emulsificante lecitina. ALÉRGICOS: contém derivados de soja e de cevada. Pode conter leite, aveia, centeio e trigo.',
     3, 6),                                                                                          -- 7
    ('Achocolatado em Pó 2.0',
     'ALÉRGICOS: contém derivados de leite e de soja. Pode conter trigo, aveia e cevada. Contém lactose.',
     3, 7),                                                                                          -- 8
    ('Cereal Matinal Sucrilhos',
     'Milho transgênico, açúcar, extrato de malte, sal, ferro, vitaminas D, B12, B1 e B6 e ácido fólico. ALÉRGICOS: contém derivados de cevada. Pode conter aveia, centeio, soja e trigo.',
     4, 8),                                                                                          -- 9
    ('Cereal Matinal Crunch',
     'Açúcar, farinha de arroz, farinha de trigo integral, milho, oleína de palma, cacau em pó, xarope de glicose, cálcio, ferro, xarope de açúcar, sal, vitaminas, aromatizante e antioxidante. ALÉRGICOS: contém derivados de trigo e de soja. Pode conter leite, cevada, aveia e centeio.',
     4, 9),                                                                                          -- 10
    ('Iogurte Whey Sabor Morango',
     'Leite pasteurizado desnatado, concentrado proteico de soro de leite, concentrado de beterraba, fermento lácteo, espessante pectina e edulcorante estévia. ALÉRGICOS: contém leite e derivados.',
     5, 10),                                                                                         -- 11
    ('Iogurte Grego Protein Sabor Cappuccino',
     'Leite desnatado, concentrado proteico de leite, preparado sabor cappuccino, creme de leite, amido modificado, espessantes gelatina e pectina e edulcorante sucralose. ALÉRGICOS: contém leite e derivados.',
     5, 11),                                                                                         -- 12

    -- ---------- Corredor 3: Mercearia ----------
    ('Açúcar Refinado', 'Açúcar refinado.', 6, 12),                                                  -- 13
    ('Açúcar Refinado', 'Açúcar refinado.', 6, 13),                                                  -- 14
    ('Sal Marinho Refinado Iodado',
     'Cloreto de sódio, iodato de potássio e antiumectante ferrocianeto de sódio.',
     7, 14),                                                                                         -- 15
    ('Macarrão Instantâneo Sabor Galinha Caipira',
     'Macarrão: farinha de trigo enriquecida com ferro e ácido fólico, gordura vegetal, sal, reguladores de acidez, estabilizantes e corante betacaroteno. Tempero: tempero sabor galinha caipira, realçadores de sabor, antiumectante, aromatizantes, ácido cítrico e corantes caramelo e urucum. ALÉRGICOS: contém derivados de trigo, cevada e soja. Pode conter centeio, aveia, crustáceos, ovos, peixes, leite, gergelim e látex natural.',
     8, 15),                                                                                         -- 16
    ('Macarrão Instantâneo Sabor Galinha Caipira',
     'Macarrão: farinha de trigo enriquecida com ferro e ácido fólico, sal, óleo de palma, reguladores de acidez, estabilizantes e corante betacaroteno. Tempero: farinha de arroz, sal, caldo de galinha, condimentos desidratados, açúcar, carne de galinha em pó, realçadores de sabor, aromatizante, antiumectantes e acidulante ácido cítrico. ALÉRGICOS: contém derivados de trigo, soja e cevada. Pode conter centeio, aveia, triticale e leite.',
     8, 16),                                                                                         -- 17

    -- ---------- Corredor 4: Limpeza (composição no lugar dos ingredientes) ----------
    ('Limpador Multiuso Paixão',
     'Bicarbonato de sódio, butilglicol, nonilfenol etoxilado, sequestrantes, conservantes, fragrância e veículo. Princípio ativo: ácido acético. Sem corantes.',
     9, 17),                                                                                         -- 18
    ('Limpador Multiuso Gold',
     'Cloreto de alquil dimetil benzil amônio, 0,12 por cento, lauramina óxida, solventes, alcalinizantes, sequestrantes, fragrância e água.',
     9, 18),                                                                                         -- 19
    ('Desinfetante Lavanda',
     'Nonilfenol etoxilado, atenuador de espuma, conservante, corante, fragrância e veículo. Princípio ativo: cloreto de alquil dimetil benzil amônio, 0,25 por cento.',
     10, 19),                                                                                        -- 20
    ('Desinfetante para Superfícies Suave Odor',
     'Ativo, veículo, fragrância, conservante e quelante. Componente ativo: cloreto de alquil dimetil benzil amônio, 0,28 por cento.',
     10, 20),                                                                                        -- 21
    ('Detergente Lava-Louças Neutro',
     'Componente ativo, glicerina, coadjuvantes, conservantes, sequestrantes, espessantes, corante, fragrância e água. Componente ativo: linear alquilbenzeno sulfonato de sódio, tensoativo biodegradável.',
     11, 21),                                                                                        -- 22
    ('Detergente Lava-Louças Clear',
     'Dodecilbenzeno sulfonato de sódio, benzeno sulfonato de trietanolamina, lauril éter sulfato de sódio, coadjuvante, sequestrante, espessante, conservantes, clarificantes, fragrância e água.',
     11, 22),                                                                                        -- 23
    ('Amaciante Explosão Azul',
     'Metilsulfato de dialquil éster hidroxietil metil amônio, tensoativo não iônico, coadjuvantes, conservante, fragrâncias, corantes e água. Contém benzisotiazolinona.',
     12, 23),                                                                                        -- 24
    ('Amaciante Aconchego Ultra',
     'Cloreto de dialquildimetilamônio, coadjuvantes, conservantes, corantes, fragrância e água.',
     12, 22),                                                                                        -- 25
    ('Lava-Roupas Lavagem Perfeita',
     'Tensoativos aniônicos, estabilizantes, coadjuvantes, corante, enzima, fragrância, conservantes e água. Princípios ativos: linear alquil benzeno sulfonato de sódio e lauril éter sulfato de sódio. Contém isotiazolinonas.',
     13, 24),                                                                                        -- 26
    ('Lava-Roupas Biopower Tradicional',
     'Alquilbenzeno sulfonato de sódio, espessante, alcalinizante, branqueador óptico, conservante, corante, lauril éter sulfato de sódio, fragrância e veículo.',
     13, 25);                                                                                        -- 27

-- (quantidade, unidade, preço em centavos, id do produto). 1999 = R$ 19,99
-- Cada produto tem 1 embalagem, então a embalagem tem o mesmo id do produto.
INSERT INTO embalagem (quantidade, unidade_medida, preco, fk_produto_id_produto) VALUES
    (500,  'ml',  199,  1),   -- Crystal
    (510,  'ml',  158,  2),   -- Bioleve
    (510,  'ml',  179,  3),   -- Lindoya
    (1000, 'ml', 1999,  4),   -- Del Valle Laranja
    (1000, 'ml', 1999,  5),   -- Del Valle Uva
    (1000, 'ml',  599,  6),   -- Maguary
    (370,  'g',  1099,  7),   -- Toddy
    (350,  'g',  1199,  8),   -- Nescau
    (240,  'g',   999,  9),   -- Sucrilhos
    (230,  'g',  1799, 10),   -- Crunch
    (250,  'g',  1049, 11),   -- Verde Campo
    (220,  'g',   799, 12),   -- Vigor
    (1000, 'g',   379, 13),   -- Da Barra
    (1000, 'g',   365, 14),   -- União
    (1000, 'g',   139, 15),   -- Master
    (85,   'g',   249, 16),   -- Nissin Miojo
    (85,   'g',   299, 17),   -- Panco
    (500,  'ml',  399, 18),   -- Coala Zulu
    (500,  'ml',  399, 19),   -- Veja
    (500,  'ml',  398, 20),   -- Agi Fácil
    (1000, 'ml', 1942, 21),   -- Lysoform
    (500,  'ml',  259, 22),   -- Limpol
    (500,  'ml',  219, 23),   -- Ypê Clear
    (1800, 'ml', 2549, 24),   -- Comfort
    (500,  'ml',  379, 25),   -- Ypê Aconchego
    (3000, 'ml', 3299, 26),   -- Omo
    (1000, 'ml',  999, 27);   -- Plush

-- Códigos de barras lidos das fotos (todos conferidos pelo dígito verificador)
INSERT INTO codigodebarras (codigo, fk_embalagem_id_embalagem) VALUES
    ('7894900530001',  1),   -- Crystal
    ('7896843200157',  2),   -- Bioleve
    ('7896089500202',  3),   -- Lindoya
    ('7894900610017',  4),   -- Del Valle Laranja
    ('7894900611014',  5),   -- Del Valle Uva
    ('7896000530363',  6),   -- Maguary
    ('7892840819507',  7),   -- Toddy
    ('7891000412855',  8),   -- Nescau
    ('7896004007618',  9),   -- Sucrilhos
    ('7891000356791', 10),   -- Crunch
    ('7898205924220', 11),   -- Verde Campo
    ('7896625214181', 12),   -- Vigor
    ('7896032501010', 13),   -- Da Barra
    ('7891910000197', 14),   -- União
    ('7898002360115', 15),   -- Master
    ('7891079000229', 16),   -- Nissin Miojo
    ('7891203057525', 17),   -- Panco
    ('7896090700202', 18),   -- Coala Zulu
    ('7891035210006', 19),   -- Veja
    ('7898005490666', 20),   -- Agi Fácil
    ('7894650939659', 21),   -- Lysoform
    ('7891022638004', 22),   -- Limpol
    ('7896098900253', 23),   -- Ypê Clear
    ('7891150070974', 24),   -- Comfort
    ('7896098900406', 25),   -- Ypê Aconchego
    ('7891150020689', 26),   -- Omo
    ('7896183304270', 27);   -- Plush

-- Tabela nutricional com os valores da PORÇÃO (a coluna do meio do rótulo).
-- As águas não têm tabela no rótulo, e a limpeza não é alimento.
-- glúten: TRUE = contém, FALSE = não contém.
-- (Os sucos Del Valle dizem mesmo "CONTÉM GLÚTEN" na embalagem.)
INSERT INTO informacao_nutricional
    (porcao_descricao, valor_energetico, carboidratos, acucares, proteinas,
     gorduras_totais, gorduras_saturadas, gorduras_trans, fibra_alimentar,
     sodio, gluten, fk_embalagem_id_embalagem)
VALUES
    ('200 mililitros',  88, 21,  21,   0,   0,   0,   0, 0,      0,   TRUE,   4),   -- Del Valle Laranja
    ('200 mililitros', 115, 29,  29,   0,   0,   0,   0, 0,      6.2, TRUE,   5),   -- Del Valle Uva
    ('200 mililitros',  24,  5.9, 5.9, 0,   0,   0,   0, 0,      0,   FALSE,  6),   -- Maguary
    ('20 gramas',       75, 18,  17,   0.3, 0.2, 0.1, 0, 0,     28,   TRUE,   7),   -- Toddy
    ('20 gramas',       76, 17,  15,   0.6, 0.4, 0.2, 0, 0.9,   10,   TRUE,   8),   -- Nescau
    ('30 gramas',      110, 26,  12,   1.4, 0,   0,   0, 0.3,   85,   TRUE,   9),   -- Sucrilhos
    ('30 gramas',      119, 22,   9.3, 2,   2.1, 0.9, 0, 1.9,   58,   TRUE,  10),   -- Crunch
    ('250 gramas',     127, 14,  14,  15,   1.3, 0.8, 0, 0,    170,   FALSE, 11),   -- Verde Campo
    ('220 gramas',     120, 11,  10,  10,   2.8, 1.8, 0, 0,    114,   FALSE, 12),   -- Vigor
    ('5 gramas',        20,  5,   5,   0,   0,   0,   0, 0,      0,   FALSE, 13),   -- Da Barra
    ('5 gramas',        20,  5,   5,   0,   0,   0,   0, 0,      0,   FALSE, 14),   -- União
    ('1 grama',          0,  0,   0,   0,   0,   0,   0, 0,    390,   FALSE, 15),   -- Master
    ('85 gramas',      381, 53,   1.4, 8.3, 15,  6.9, 0, 1.7, 1408,   TRUE,  16),   -- Nissin Miojo
    ('85 gramas',      385, 54,   4,   8.5, 15,  7,   0, 2.1, 1289,   TRUE,  17);   -- Panco

-- =====================================================================
-- FALTA: o segundo sal (Sal Refinado Extra Iodado, 1 kg, R$ 3,69).
-- Quando chegarem as fotos, é só acrescentar uma linha em cada tabela:
--   marca (vai ser a 26), produto (vai ser o 28, categoria 7),
--   embalagem (1000, 'g', 369, 28), codigodebarras ('código', 28)
--   e informacao_nutricional (..., 28).
-- =====================================================================
