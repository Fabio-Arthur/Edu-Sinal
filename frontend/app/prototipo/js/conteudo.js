// CONTEÚDO DAS ETAPAS
// Cada etapa tem 5 atividades e uma prova final. A 1ª e a 3ª são para
// APRENDER (cartões com sinais novos, sem gastar vidas); a 2ª, a 4ª e a 5ª
// são EXERCÍCIOS, com 5 perguntas cada. Para mudar ou criar conteúdo, é só
// editar as listas abaixo. (Conteúdo provisório, para testar a organização.)
//
// Atividade de aprender (kind: "learn"):
//   cards  sinais apresentados: { sign: "Oi", tip: "quando usar" }
//          ("label" troca o nome mostrado, ex.: sign "Letra A" aparece como "A")
//
// Exercício (kind: "practice"), cada pergunta tem um "type":
//   "video-palavra"  mostra o vídeo de "sign"; o aluno escolhe a palavra (options)
//   "palavra-video"  mostra a palavra "sign"; o aluno escolhe o vídeo (options são sinais)
//   "situacao"       pergunta em texto (q) com respostas em texto (options)
//   "vf"             frase (q) para marcar verdadeiro ou falso (answer: true/false)
// Nos tipos com opções, "answer" é a posição da certa (a primeira é 0).
// "explain" aparece depois de conferir.
//
// Os vídeos dos sinais ainda serão gravados (veja SIGN_VIDEOS). As dicas falam
// de quando usar cada sinal, sem descrever como ele é feito. Antes de publicar,
// o conteúdo deve ser revisado por pessoas surdas fluentes em Libras.

// Vídeo de cada sinal. Quando um vídeo for gravado, coloque o caminho aqui,
// por exemplo: "Oi": "../../assets/videos/oi.mp4". Sem vídeo, aparece um espaço reservado.
const SIGN_VIDEOS = {};

// Os ids das etapas e das atividades ficam salvos no progresso do aluno: trocar
// um id faz quem já tinha feito aquela atividade perder o "feito".
const learningTopics = {
  "alfabeto-manual": {
    number: "01",
    title: "Alfabeto",
    subtitle: "Soletrar com as mãos",
    branches: [
      {
        id: "vogais", kind: "learn", icon: "alphabet-uppercase", label: "As vogais", hint: "Aprender · 5 letras",
        cards: [
          { sign: "Letra A", label: "A", tip: "O alfabeto manual (datilologia) serve para soletrar nomes e palavras que ainda não têm sinal." },
          { sign: "Letra E", label: "E", tip: "Com as vogais, você já soletra pedaços de muitas palavras." },
          { sign: "Letra I", label: "I", tip: "Soletre com calma: a outra pessoa precisa ver cada letra." },
          { sign: "Letra O", label: "O", tip: "Já dá para soletrar “OI”!" },
          { sign: "Letra U", label: "U", tip: "Pronto, as 5 vogais! Tente soletrar “UAU”." },
        ],
      },
      {
        id: "pratica-vogais", kind: "practice", icon: "pencil-fill", label: "Pratique: vogais", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "Letra A", options: ["E", "A", "O"], answer: 1, explain: "Essa é a letra A do alfabeto manual." },
          { type: "palavra-video", sign: "Letra I", options: ["Letra U", "Letra I", "Letra E"], answer: 1, explain: "Esse é o sinal da letra I." },
          { type: "situacao", q: "Para que serve o alfabeto manual?", options: ["Para soletrar nomes e palavras que não têm sinal", "Para trocar todos os sinais por letras", "Só para escrever no papel"], answer: 0, explain: "A datilologia ajuda com nomes, siglas e palavras sem sinal. Ela não substitui os sinais." },
          { type: "vf", q: "Em Libras, toda palavra precisa ser soletrada letra por letra.", answer: false, explain: "A Libras tem sinais próprios. A datilologia é para nomes e palavras sem sinal." },
          { type: "video-palavra", sign: "Letra U", options: ["O", "I", "U"], answer: 2, explain: "Essa é a letra U do alfabeto manual." },
        ],
      },
      {
        id: "consoantes", kind: "learn", icon: "alphabet", label: "Primeiras consoantes", hint: "Aprender · 4 letras",
        cards: [
          { sign: "Letra B", label: "B", tip: "Junto com as vogais, já dá para soletrar palavras curtas, como “BOA”." },
          { sign: "Letra C", label: "C", tip: "Soletrar o nome de alguém é um ótimo treino." },
          { sign: "Letra D", label: "D", tip: "Quando não souber o sinal de algo, soletrar é um bom caminho." },
          { sign: "Letra L", label: "L", tip: "As outras letras estão no alfabeto do Dicionário, uma por vez." },
        ],
      },
      {
        id: "pratica-consoantes", kind: "practice", icon: "pencil-fill", label: "Pratique: consoantes", hint: "5 exercícios",
        questions: [
          { type: "palavra-video", sign: "Letra B", options: ["Letra D", "Letra B", "Letra C"], answer: 1, explain: "Esse é o sinal da letra B." },
          { type: "video-palavra", sign: "Letra L", options: ["L", "C", "B"], answer: 0, explain: "Essa é a letra L do alfabeto manual." },
          { type: "situacao", q: "Uma pessoa surda soletrou rápido e você não entendeu. O que fazer?", options: ["Fingir que entendeu", "Pedir, com educação, para repetir mais devagar", "Ir embora"], answer: 1, explain: "Pedir para repetir é normal em qualquer língua, ainda mais quando você está aprendendo." },
          { type: "vf", q: "O nome de uma pessoa que ainda não tem sinal-nome costuma ser soletrado.", answer: true, explain: "Sem sinal-nome, o jeito é soletrar o nome com a datilologia." },
          { type: "video-palavra", sign: "Letra C", options: ["D", "C", "L"], answer: 1, explain: "Essa é a letra C do alfabeto manual." },
        ],
      },
      {
        id: "revisao-alfabeto", kind: "practice", icon: "arrow-repeat", label: "Revisão", hint: "5 exercícios",
        questions: [
          { type: "palavra-video", sign: "Letra E", options: ["Letra A", "Letra E", "Letra I", "Letra O"], answer: 1, explain: "Esse é o sinal da letra E." },
          { type: "video-palavra", sign: "Letra D", options: ["B", "D", "L"], answer: 1, explain: "Essa é a letra D do alfabeto manual." },
          { type: "situacao", q: "Onde ficam as 26 letras do alfabeto aqui no EduSinal?", options: ["No Dicionário, em Alfabeto", "Na Lojinha", "Nas Ligas"], answer: 0, explain: "No Dicionário, o alfabeto tem uma trilha com todas as letras e o Desafia-me." },
          { type: "vf", q: "Datilologia é outro nome para o alfabeto manual.", answer: true, explain: "Datilologia é soletrar com o alfabeto manual." },
          { type: "palavra-video", sign: "Letra O", options: ["Letra U", "Letra O", "Letra A", "Letra C"], answer: 1, explain: "Esse é o sinal da letra O." },
        ],
      },
    ],
  },

  "numeros": {
    number: "02",
    title: "Números",
    subtitle: "Contar de 1 a 10",
    branches: [
      {
        id: "um-a-cinco", kind: "learn", icon: "123", label: "De 1 a 5", hint: "Aprender · 5 sinais",
        cards: [
          { sign: "1", label: "Um (1)", tip: "Para contar e dizer quantidades." },
          { sign: "2", label: "Dois (2)", tip: "Os números aparecem na idade, nos horários e nos preços." },
          { sign: "3", label: "Três (3)", tip: "Para dizer quantas coisas ou pessoas existem." },
          { sign: "4", label: "Quatro (4)", tip: "Alguns números têm um sinal para quantidade e outro para códigos, como telefone." },
          { sign: "5", label: "Cinco (5)", tip: "Metade do caminho até o 10!" },
        ],
      },
      {
        id: "pratica-um-a-cinco", kind: "practice", icon: "pencil-fill", label: "Pratique: 1 a 5", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "3", options: ["2", "3", "5"], answer: 1, explain: "Esse é o sinal do número 3." },
          { type: "palavra-video", sign: "5", options: ["5", "4", "1"], answer: 0, explain: "Esse é o sinal do número 5." },
          { type: "situacao", q: "Alguém pergunta quantos irmãos você tem, e você tem 2. O que responder?", options: ["O sinal do número 2", "O sinal do número 5", "Soletrar D-O-I-S"], answer: 0, explain: "Para quantidades, usamos o sinal do número." },
          { type: "vf", q: "Em Libras, alguns números mudam de sinal quando indicam quantidade ou um código, como o telefone.", answer: true, explain: "Por isso vale prestar atenção ao contexto: quantidade e código podem ter sinais diferentes." },
          { type: "video-palavra", sign: "1", options: ["4", "2", "1"], answer: 2, explain: "Esse é o sinal do número 1." },
        ],
      },
      {
        id: "seis-a-dez", kind: "learn", icon: "calculator-fill", label: "De 6 a 10", hint: "Aprender · 5 sinais",
        cards: [
          { sign: "6", label: "Seis (6)", tip: "Para quantidades maiores que cinco." },
          { sign: "7", label: "Sete (7)", tip: "Uma semana tem 7 dias." },
          { sign: "8", label: "Oito (8)", tip: "Muitas aulas começam às 8 horas." },
          { sign: "9", label: "Nove (9)", tip: "Falta só um para o 10." },
          { sign: "10", label: "Dez (10)", tip: "Agora você conta até 10!" },
        ],
      },
      {
        id: "pratica-seis-a-dez", kind: "practice", icon: "pencil-fill", label: "Pratique: 6 a 10", hint: "5 exercícios",
        questions: [
          { type: "palavra-video", sign: "7", options: ["9", "6", "7"], answer: 2, explain: "Esse é o sinal do número 7." },
          { type: "video-palavra", sign: "10", options: ["10", "8", "6"], answer: 0, explain: "Esse é o sinal do número 10." },
          { type: "situacao", q: "Na feira, a fruta custa 8 reais. Como mostrar o preço para um cliente surdo?", options: ["Fazendo o sinal de 8 ou mostrando escrito", "Falando mais alto", "Não tem como"], answer: 0, explain: "Sinal ou número escrito: o importante é a pessoa entender." },
          { type: "vf", q: "Escrever um número no papel ou no celular também é um jeito válido de se comunicar.", answer: true, explain: "Quando faltar o sinal, escrever ajuda: o importante é a conversa acontecer." },
          { type: "video-palavra", sign: "9", options: ["6", "9", "7"], answer: 1, explain: "Esse é o sinal do número 9." },
        ],
      },
      {
        id: "revisao-numeros", kind: "practice", icon: "arrow-repeat", label: "Revisão", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "4", options: ["4", "6", "2"], answer: 0, explain: "Esse é o sinal do número 4." },
          { type: "palavra-video", sign: "8", options: ["3", "10", "8", "5"], answer: 2, explain: "Esse é o sinal do número 8." },
          { type: "situacao", q: "Você vai passar seu telefone para um colega surdo. O que ajuda?", options: ["Ditar os números em voz alta", "Sinalizar com calma ou digitar no celular dele", "Desistir"], answer: 1, explain: "Sinalizar devagar ou digitar evita erro em um número tão importante." },
          { type: "vf", q: "Para dizer a idade em Libras, usamos os sinais dos números.", answer: true, explain: "Idade, horas e preços usam os números que você aprendeu." },
          { type: "video-palavra", sign: "6", options: ["8", "10", "6"], answer: 2, explain: "Esse é o sinal do número 6." },
        ],
      },
    ],
  },

  "apresentacoes": {
    number: "03",
    title: "Apresentação",
    subtitle: "Seu nome, idade e cidade",
    branches: [
      {
        id: "meu-nome", kind: "learn", icon: "tag-fill", label: "Meu nome", hint: "Aprender · 3 sinais",
        cards: [
          { sign: "Nome", tip: "Para perguntar e dizer o nome. Sem sinal-nome, soletre com o alfabeto manual." },
          { sign: "Sinal-nome", tip: "Sinal que identifica uma pessoa. Costuma ser dado por pessoas surdas da comunidade." },
          { sign: "Prazer", tip: "Para fechar a apresentação: prazer em conhecer." },
        ],
      },
      {
        id: "pratica-nome", kind: "practice", icon: "pencil-fill", label: "Pratique: meu nome", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "Nome", options: ["Prazer", "Nome", "Sinal-nome"], answer: 1, explain: "Esse é o sinal de “nome”." },
          { type: "situacao", q: "Você ainda não tem um sinal para o seu nome. Como se apresenta?", options: ["Soletrando o nome com o alfabeto manual", "Escrevendo no ar com o dedo", "Não dá para se apresentar"], answer: 0, explain: "Antes de ter um sinal-nome, a pessoa soletra o próprio nome com a datilologia." },
          { type: "vf", q: "O sinal-nome costuma ser dado por pessoas surdas da comunidade.", answer: true, explain: "Na cultura surda, o sinal-nome costuma ser dado por pessoas surdas, muitas vezes ligado a uma característica da pessoa." },
          { type: "palavra-video", sign: "Prazer", options: ["Prazer", "Nome", "Sinal-nome"], answer: 0, explain: "“Prazer em conhecer” fecha bem uma apresentação." },
          { type: "situacao", q: "Em Libras, o que ajuda a mostrar que uma frase é uma pergunta?", options: ["A expressão do rosto", "Falar mais alto", "Bater na mesa"], answer: 0, explain: "As expressões do rosto fazem parte da gramática da Libras e marcam as perguntas." },
        ],
      },
      {
        id: "idade-lugar", kind: "learn", icon: "geo-alt-fill", label: "Idade e lugar", hint: "Aprender · 3 sinais",
        cards: [
          { sign: "Idade", tip: "Para perguntar e dizer quantos anos: a resposta usa os sinais dos números." },
          { sign: "Morar", tip: "Para dizer onde você mora." },
          { sign: "Cidade", tip: "Muitas cidades têm sinal próprio, criado pela comunidade surda local." },
        ],
      },
      {
        id: "pratica-idade-lugar", kind: "practice", icon: "pencil-fill", label: "Pratique: idade e lugar", hint: "5 exercícios",
        questions: [
          { type: "palavra-video", sign: "Cidade", options: ["Morar", "Idade", "Cidade"], answer: 2, explain: "Esse é o sinal de “cidade”." },
          { type: "video-palavra", sign: "Morar", options: ["Morar", "Cidade", "Nome"], answer: 0, explain: "Esse é o sinal de “morar”." },
          { type: "situacao", q: "Perguntam onde você mora, e você não sabe o sinal da sua cidade. O que fazer?", options: ["Soletrar o nome da cidade", "Mudar de assunto", "Inventar um sinal"], answer: 0, explain: "Soletre o nome e, se quiser, pergunte se a cidade tem sinal próprio." },
          { type: "vf", q: "Cada país tem a sua própria língua de sinais.", answer: true, explain: "O Brasil usa a Libras; Portugal, por exemplo, usa a Língua Gestual Portuguesa." },
          { type: "video-palavra", sign: "Idade", options: ["Cidade", "Morar", "Idade"], answer: 2, explain: "Esse é o sinal de “idade”." },
        ],
      },
      {
        id: "revisao-apresentacoes", kind: "practice", icon: "arrow-repeat", label: "Revisão", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "Sinal-nome", options: ["Nome", "Sinal-nome", "Prazer"], answer: 1, explain: "Esse é o sinal de “sinal-nome”." },
          { type: "palavra-video", sign: "Idade", options: ["Cidade", "Idade", "Morar", "Nome"], answer: 1, explain: "Esse é o sinal de “idade”." },
          { type: "situacao", q: "Durante uma apresentação em Libras, para onde olhar?", options: ["Para o chão", "Para o rosto e as mãos de quem sinaliza", "Para o celular"], answer: 1, explain: "Rosto e mãos carregam a mensagem: olhar para eles é acompanhar a conversa." },
          { type: "vf", q: "Nomes de cidades sempre precisam ser soletrados em Libras.", answer: false, explain: "Muitas cidades têm sinal próprio. Se você não souber, aí sim soletre." },
          { type: "situacao", q: "Qual é um bom roteiro para se apresentar?", options: ["Nome, idade, onde mora e “prazer”", "“Prazer” e ir embora", "Só a idade"], answer: 0, explain: "Dizer o nome, contar um pouco de você e fechar com “prazer” é um ótimo roteiro." },
        ],
      },
    ],
  },

  "cumprimentos": {
    number: "04",
    title: "Cumprimentos",
    subtitle: "Oi, tchau e saudações",
    branches: [
      {
        id: "cumprimentos", kind: "learn", icon: "emoji-smile-fill", label: "Oi e tchau", hint: "Aprender · 3 sinais",
        cards: [
          { sign: "Oi", tip: "Para cumprimentar alguém, em qualquer hora do dia." },
          { sign: "Tchau", tip: "Para se despedir. Faça o sinal onde a pessoa possa ver." },
          { sign: "Tudo bem?", tip: "Pergunta comum logo depois do “oi”." },
        ],
      },
      {
        id: "pratica-cumprimentos", kind: "practice", icon: "pencil-fill", label: "Pratique: oi e tchau", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "Oi", options: ["Tchau", "Oi", "Tudo bem?"], answer: 1, explain: "Esse é o sinal de “oi”, para cumprimentar." },
          { type: "palavra-video", sign: "Tchau", options: ["Tudo bem?", "Oi", "Tchau"], answer: 2, explain: "“Tchau” é a despedida do dia a dia." },
          { type: "situacao", q: "Uma pessoa surda está de costas e você quer falar com ela. O que é mais adequado?", options: ["Gritar o nome dela", "Bater palmas atrás dela", "Tocar de leve no ombro ou acenar onde ela possa ver"], answer: 2, explain: "Um toque leve no ombro ou um aceno no campo de visão são formas respeitosas de chamar a atenção." },
          { type: "vf", q: "Libras é o português feito com as mãos.", answer: false, explain: "Libras tem vocabulário, gramática e regras próprias, independentes do português." },
          { type: "palavra-video", sign: "Tudo bem?", options: ["Oi", "Tudo bem?", "Tchau"], answer: 1, explain: "“Tudo bem?” costuma vir logo depois do “oi”." },
        ],
      },
      {
        id: "saudacoes", kind: "learn", icon: "brightness-high-fill", label: "Bom dia", hint: "Aprender · 3 sinais",
        cards: [
          { sign: "Bom dia", tip: "Saudação até o meio-dia." },
          { sign: "Boa tarde", tip: "Do meio-dia até o anoitecer." },
          { sign: "Boa noite", tip: "À noite, tanto ao chegar quanto ao se despedir." },
        ],
      },
      {
        id: "pratica-saudacoes", kind: "practice", icon: "pencil-fill", label: "Pratique: saudações", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "Boa tarde", options: ["Boa tarde", "Bom dia", "Boa noite"], answer: 0, explain: "Esse é o sinal de “boa tarde”." },
          { type: "situacao", q: "Você chega na escola às 7h e encontra a turma. Qual saudação combina?", options: ["Boa noite", "Bom dia", "Boa tarde"], answer: 1, explain: "Até o meio-dia, a saudação é “bom dia”." },
          { type: "palavra-video", sign: "Boa noite", options: ["Bom dia", "Boa noite", "Boa tarde"], answer: 1, explain: "“Boa noite” serve para chegar e para se despedir à noite." },
          { type: "vf", q: "Às 15h, a saudação certa é “bom dia”.", answer: false, explain: "Do meio-dia até o anoitecer, usamos “boa tarde”." },
          { type: "situacao", q: "São 20h e você chega numa festa. Qual saudação combina?", options: ["Bom dia", "Boa tarde", "Boa noite"], answer: 2, explain: "À noite, a saudação é “boa noite”." },
        ],
      },
      {
        id: "revisao-saudacoes", kind: "practice", icon: "arrow-repeat", label: "Revisão", hint: "5 exercícios",
        questions: [
          { type: "palavra-video", sign: "Bom dia", options: ["Bom dia", "Tchau", "Boa tarde", "Oi"], answer: 0, explain: "Esse é o sinal de “bom dia”." },
          { type: "video-palavra", sign: "Tchau", options: ["Oi", "Boa noite", "Tchau"], answer: 2, explain: "Esse é o sinal de “tchau”." },
          { type: "situacao", q: "Qual atitude ajuda a manter uma conversa em Libras?", options: ["Desviar o olhar enquanto a outra pessoa sinaliza", "Manter contato visual durante a conversa", "Falar mais alto para facilitar"], answer: 1, explain: "Em uma língua visual, o contato visual mostra atenção e ajuda a acompanhar a conversa." },
          { type: "vf", q: "Na Libras, as expressões do rosto fazem parte da língua.", answer: true, explain: "Expressões faciais e corporais fazem parte da gramática da Libras e podem mudar o sentido." },
          { type: "video-palavra", sign: "Boa noite", options: ["Boa tarde", "Boa noite", "Oi"], answer: 1, explain: "Esse é o sinal de “boa noite”." },
        ],
      },
    ],
  },

  "em-casa": {
    number: "05",
    title: "Em casa",
    subtitle: "Família e rotina",
    branches: [
      {
        id: "familia", kind: "learn", icon: "house-heart-fill", label: "Família", hint: "Aprender · 4 sinais",
        cards: [
          { sign: "Mãe", tip: "Muitas crianças surdas nascem em famílias ouvintes: quando a família aprende Libras, a conversa em casa fica mais fácil." },
          { sign: "Pai", tip: "Também está no tema família do dicionário." },
          { sign: "Irmão", tip: "Para falar do irmão." },
          { sign: "Irmã", tip: "Para falar da irmã." },
        ],
      },
      {
        id: "pratica-familia", kind: "practice", icon: "pencil-fill", label: "Pratique: família", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "Mãe", options: ["Pai", "Irmã", "Mãe"], answer: 2, explain: "Esse é o sinal de “mãe”." },
          { type: "palavra-video", sign: "Irmã", options: ["Irmã", "Irmão", "Pai"], answer: 0, explain: "Esse é o sinal de “irmã”." },
          { type: "situacao", q: "Muitas pessoas surdas nascem em famílias ouvintes. Quando a família aprende Libras…", options: ["A comunicação em casa fica mais fácil", "Não faz diferença", "Atrapalha o aprendizado"], answer: 0, explain: "Uma língua em comum aproxima a família e ajuda no desenvolvimento da criança surda." },
          { type: "vf", q: "“Pai” e “mãe” estão no mesmo tema do dicionário.", answer: true, explain: "Os dois estão no tema família, junto com irmão, irmã e avó." },
          { type: "video-palavra", sign: "Irmão", options: ["Irmão", "Mãe", "Irmã"], answer: 0, explain: "Esse é o sinal de “irmão”." },
        ],
      },
      {
        id: "rotina-casa", kind: "learn", icon: "cup-hot-fill", label: "Rotina em casa", hint: "Aprender · 4 sinais",
        cards: [
          { sign: "Casa", tip: "Para falar do lugar onde você mora." },
          { sign: "Comer", tip: "Para falar das refeições: café, almoço e jantar." },
          { sign: "Dormir", tip: "Para falar da hora de descansar." },
          { sign: "Banho", tip: "Faz parte da rotina de todo dia." },
        ],
      },
      {
        id: "pratica-rotina-casa", kind: "practice", icon: "pencil-fill", label: "Pratique: rotina", hint: "5 exercícios",
        questions: [
          { type: "palavra-video", sign: "Comer", options: ["Dormir", "Comer", "Casa"], answer: 1, explain: "Esse é o sinal de “comer”." },
          { type: "video-palavra", sign: "Dormir", options: ["Banho", "Comer", "Dormir"], answer: 2, explain: "Esse é o sinal de “dormir”." },
          { type: "situacao", q: "Em muitas casas de pessoas surdas, como a campainha avisa que alguém chegou?", options: ["Com uma luz que pisca", "Com um som mais alto", "Ela não existe"], answer: 0, explain: "Campainhas luminosas acendem uma luz quando alguém toca." },
          { type: "vf", q: "Acender e apagar a luz do cômodo é um jeito comum de chamar a atenção de uma pessoa surda.", answer: true, explain: "É um costume da comunidade surda, principalmente quando a pessoa está longe ou de costas." },
          { type: "video-palavra", sign: "Casa", options: ["Casa", "Banho", "Comer"], answer: 0, explain: "Esse é o sinal de “casa”." },
        ],
      },
      {
        id: "revisao-casa", kind: "practice", icon: "arrow-repeat", label: "Revisão", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "Pai", options: ["Irmã", "Pai", "Mãe"], answer: 1, explain: "Esse é o sinal de “pai”." },
          { type: "palavra-video", sign: "Banho", options: ["Casa", "Dormir", "Banho", "Comer"], answer: 2, explain: "Esse é o sinal de “banho”." },
          { type: "situacao", q: "No almoço em família, uma pessoa surda está à mesa. O que ajuda a incluí-la?", options: ["Conversar só entre quem ouve", "Olhar para ela, sinalizar ou escrever e contar do que estão falando", "Falar mais alto"], answer: 1, explain: "Incluir é garantir que ela participe da conversa, e não só fique sentada junto." },
          { type: "vf", q: "Despertadores que vibram ajudam muitas pessoas surdas a acordar.", answer: true, explain: "Alertas que vibram ou piscam trocam o som por algo que dá para sentir ou ver." },
          { type: "video-palavra", sign: "Comer", options: ["Comer", "Dormir", "Casa"], answer: 0, explain: "Esse é o sinal de “comer”." },
        ],
      },
    ],
  },

  "na-escola": {
    number: "06",
    title: "Na escola",
    subtitle: "Sala de aula e estudos",
    branches: [
      {
        id: "sala-de-aula", kind: "learn", icon: "backpack-fill", label: "Sala de aula", hint: "Aprender · 4 sinais",
        cards: [
          { sign: "Escola", tip: "Para falar do lugar onde você estuda." },
          { sign: "Professor", tip: "Para falar de quem ensina." },
          { sign: "Aluno", tip: "Para falar de quem estuda." },
          { sign: "Livro", tip: "Material de estudo do dia a dia." },
        ],
      },
      {
        id: "pratica-sala", kind: "practice", icon: "pencil-fill", label: "Pratique: sala de aula", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "Professor", options: ["Aluno", "Professor", "Escola"], answer: 1, explain: "Esse é o sinal de “professor”." },
          { type: "palavra-video", sign: "Livro", options: ["Livro", "Escola", "Aluno"], answer: 0, explain: "Esse é o sinal de “livro”." },
          { type: "situacao", q: "Na sala, onde é melhor um aluno surdo sentar?", options: ["No fundo, atrás de todos", "Onde veja bem o professor, o quadro e o intérprete", "De costas para o quadro"], answer: 1, explain: "Em uma língua visual, enxergar bem é tudo: o lugar certo faz diferença na aula." },
          { type: "vf", q: "A profissão de intérprete de Libras é reconhecida por lei no Brasil.", answer: true, explain: "A profissão de tradutor e intérprete de Libras foi regulamentada pela Lei nº 12.319, de 2010." },
          { type: "video-palavra", sign: "Escola", options: ["Livro", "Aluno", "Escola"], answer: 2, explain: "Esse é o sinal de “escola”." },
        ],
      },
      {
        id: "estudar", kind: "learn", icon: "book-fill", label: "Estudar", hint: "Aprender · 4 sinais",
        cards: [
          { sign: "Estudar", tip: "Para falar de tarefas e de se preparar para a prova." },
          { sign: "Aprender", tip: "Como você está fazendo agora!" },
          { sign: "Entender", tip: "Para dizer que entendeu a explicação." },
          { sign: "Prova", tip: "Para falar das avaliações da escola." },
        ],
      },
      {
        id: "pratica-estudar", kind: "practice", icon: "pencil-fill", label: "Pratique: estudar", hint: "5 exercícios",
        questions: [
          { type: "palavra-video", sign: "Aprender", options: ["Prova", "Estudar", "Aprender"], answer: 2, explain: "Esse é o sinal de “aprender”." },
          { type: "video-palavra", sign: "Entender", options: ["Entender", "Aprender", "Prova"], answer: 0, explain: "Esse é o sinal de “entender”." },
          { type: "situacao", q: "Você não entendeu o que um colega surdo sinalizou. O que fazer?", options: ["Balançar a cabeça como se tivesse entendido", "Avisar que não entendeu e pedir para repetir", "Mudar de assunto"], answer: 1, explain: "Fingir que entendeu atrapalha a conversa. Pedir para repetir mostra interesse." },
          { type: "vf", q: "Existe uma lei que garante a educação bilíngue para surdos, com a Libras como primeira língua.", answer: true, explain: "A Lei nº 14.191, de 2021, incluiu a educação bilíngue de surdos na LDB: Libras como primeira língua e português escrito como segunda." },
          { type: "video-palavra", sign: "Prova", options: ["Livro", "Prova", "Estudar"], answer: 1, explain: "Esse é o sinal de “prova”." },
        ],
      },
      {
        id: "revisao-escola", kind: "practice", icon: "arrow-repeat", label: "Revisão", hint: "5 exercícios",
        questions: [
          { type: "palavra-video", sign: "Aluno", options: ["Professor", "Aluno", "Escola", "Livro"], answer: 1, explain: "Esse é o sinal de “aluno”." },
          { type: "video-palavra", sign: "Estudar", options: ["Estudar", "Entender", "Aprender"], answer: 0, explain: "Esse é o sinal de “estudar”." },
          { type: "situacao", q: "Num trabalho em grupo com um colega surdo, o que é mais inclusivo?", options: ["Dividir as tarefas e combinar como todos vão se comunicar", "Deixar ele fazer tudo sozinho", "Não chamar ele para o grupo"], answer: 0, explain: "Combinar a comunicação desde o começo deixa todo mundo participar de verdade." },
          { type: "vf", q: "Vídeos passados em aula precisam de legenda ou tradução em Libras para incluir alunos surdos.", answer: true, explain: "Sem legenda nem Libras, o aluno surdo perde o conteúdo do vídeo." },
          { type: "palavra-video", sign: "Professor", options: ["Aluno", "Livro", "Professor"], answer: 2, explain: "Esse é o sinal de “professor”." },
        ],
      },
    ],
  },

  "no-trabalho": {
    number: "07",
    title: "No trabalho",
    subtitle: "Colegas e horários",
    branches: [
      {
        id: "colegas", kind: "learn", icon: "briefcase-fill", label: "Colegas", hint: "Aprender · 4 sinais",
        cards: [
          { sign: "Trabalhar", tip: "Para falar do seu trabalho ou do que você faz." },
          { sign: "Colega", tip: "Para falar de quem trabalha ou estuda com você." },
          { sign: "Chefe", tip: "Para falar de quem coordena a equipe." },
          { sign: "Reunião", tip: "Para falar dos encontros da equipe." },
        ],
      },
      {
        id: "pratica-colegas", kind: "practice", icon: "pencil-fill", label: "Pratique: colegas", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "Colega", options: ["Chefe", "Colega", "Reunião"], answer: 1, explain: "Esse é o sinal de “colega”." },
          { type: "palavra-video", sign: "Trabalhar", options: ["Trabalhar", "Reunião", "Colega"], answer: 0, explain: "Esse é o sinal de “trabalhar”." },
          { type: "situacao", q: "Vai ter uma reunião, e um colega surdo participa. O que ajuda?", options: ["Combinar antes um intérprete ou legendas e falar um de cada vez", "Todo mundo falar ao mesmo tempo", "Mandar o resumo só para quem ouviu"], answer: 0, explain: "Com intérprete ou legenda, e uma pessoa falando por vez, dá para acompanhar tudo." },
          { type: "vf", q: "No Brasil, empresas com 100 funcionários ou mais precisam reservar vagas para pessoas com deficiência.", answer: true, explain: "É a Lei de Cotas (Lei nº 8.213, de 1991, art. 93)." },
          { type: "video-palavra", sign: "Chefe", options: ["Colega", "Trabalhar", "Chefe"], answer: 2, explain: "Esse é o sinal de “chefe”." },
        ],
      },
      {
        id: "horarios", kind: "learn", icon: "clock-fill", label: "Horários", hint: "Aprender · 4 sinais",
        cards: [
          { sign: "Hora", tip: "Para perguntar e dizer que horas são." },
          { sign: "Hoje", tip: "Para falar do dia de hoje." },
          { sign: "Amanhã", tip: "Para combinar algo para o dia seguinte." },
          { sign: "Ajudar", tip: "Para pedir ou oferecer ajuda." },
        ],
      },
      {
        id: "pratica-horarios", kind: "practice", icon: "pencil-fill", label: "Pratique: horários", hint: "5 exercícios",
        questions: [
          { type: "palavra-video", sign: "Amanhã", options: ["Hoje", "Hora", "Amanhã"], answer: 2, explain: "Esse é o sinal de “amanhã”." },
          { type: "video-palavra", sign: "Ajudar", options: ["Ajudar", "Amanhã", "Hora"], answer: 0, explain: "Esse é o sinal de “ajudar”." },
          { type: "situacao", q: "A reunião mudou de horário. Como avisar um colega surdo?", options: ["Gritar do outro lado da sala", "Mandar mensagem escrita ou ir até ele e avisar", "Esperar ele descobrir sozinho"], answer: 1, explain: "Aviso visual ou escrito chega certinho, sem depender do som." },
          { type: "vf", q: "Pessoas surdas podem trabalhar em qualquer área, com a acessibilidade adequada.", answer: true, explain: "Com acessibilidade (intérprete, legendas, avisos visuais), a surdez não limita a profissão." },
          { type: "video-palavra", sign: "Hoje", options: ["Amanhã", "Hoje", "Hora"], answer: 1, explain: "Esse é o sinal de “hoje”." },
        ],
      },
      {
        id: "revisao-trabalho", kind: "practice", icon: "arrow-repeat", label: "Revisão", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "Reunião", options: ["Reunião", "Chefe", "Hoje"], answer: 0, explain: "Esse é o sinal de “reunião”." },
          { type: "palavra-video", sign: "Hora", options: ["Ajudar", "Colega", "Hora", "Amanhã"], answer: 2, explain: "Esse é o sinal de “hora”." },
          { type: "situacao", q: "Um aviso importante da empresa é dado só pelo alto-falante. O que está faltando?", options: ["Nada, está ótimo", "Um aviso visual, como uma tela ou uma mensagem", "Falar mais alto"], answer: 1, explain: "Avisos sonoros precisam de uma versão visual para incluir pessoas surdas." },
          { type: "vf", q: "Toda pessoa surda faz leitura labial perfeitamente, então não precisa de Libras no trabalho.", answer: false, explain: "Leitura labial é difícil e cansativa, e nem todo surdo usa. Libras e mensagens escritas garantem a comunicação." },
          { type: "video-palavra", sign: "Trabalhar", options: ["Colega", "Trabalhar", "Ajudar"], answer: 1, explain: "Esse é o sinal de “trabalhar”." },
        ],
      },
    ],
  },

  "na-rua": {
    number: "08",
    title: "Na rua",
    subtitle: "Lugares e direções",
    branches: [
      {
        id: "lugares", kind: "learn", icon: "geo-alt-fill", label: "Lugares", hint: "Aprender · 4 sinais",
        cards: [
          { sign: "Rua", tip: "Para falar de onde fica algo." },
          { sign: "Ônibus", tip: "Para falar do transporte do dia a dia." },
          { sign: "Mercado", tip: "Para falar das compras." },
          { sign: "Hospital", tip: "Para falar de saúde e de emergências." },
        ],
      },
      {
        id: "pratica-lugares", kind: "practice", icon: "pencil-fill", label: "Pratique: lugares", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "Ônibus", options: ["Mercado", "Ônibus", "Rua"], answer: 1, explain: "Esse é o sinal de “ônibus”." },
          { type: "palavra-video", sign: "Hospital", options: ["Hospital", "Ônibus", "Mercado"], answer: 0, explain: "Esse é o sinal de “hospital”." },
          { type: "situacao", q: "Um cliente surdo chega ao caixa, e o atendente não sabe Libras. O que o atendente pode fazer?", options: ["Escrever ou usar o celular para conversar", "Ignorar o cliente", "Falar mais alto"], answer: 0, explain: "Escrever é um jeito simples de atender bem, enquanto não se sabe Libras." },
          { type: "vf", q: "Pessoas surdas podem tirar carteira de motorista.", answer: true, explain: "No Brasil, pessoas surdas podem dirigir, desde que passem nos exames, como todo mundo." },
          { type: "video-palavra", sign: "Mercado", options: ["Rua", "Hospital", "Mercado"], answer: 2, explain: "Esse é o sinal de “mercado”." },
        ],
      },
      {
        id: "direcoes", kind: "learn", icon: "signpost-split-fill", label: "Direções", hint: "Aprender · 4 sinais",
        cards: [
          { sign: "Onde?", tip: "Para perguntar onde fica um lugar." },
          { sign: "Aqui", tip: "Para mostrar o lugar onde você está." },
          { sign: "Perto", tip: "Para dizer que algo fica pertinho." },
          { sign: "Longe", tip: "Para dizer que algo fica distante." },
        ],
      },
      {
        id: "pratica-direcoes", kind: "practice", icon: "pencil-fill", label: "Pratique: direções", hint: "5 exercícios",
        questions: [
          { type: "palavra-video", sign: "Longe", options: ["Perto", "Longe", "Aqui"], answer: 1, explain: "Esse é o sinal de “longe”." },
          { type: "video-palavra", sign: "Onde?", options: ["Onde?", "Aqui", "Perto"], answer: 0, explain: "Esse é o sinal de “onde?”." },
          { type: "situacao", q: "Uma pessoa surda pede informação na rua, e você não sabe Libras. O que fazer?", options: ["Apontar o caminho e, se precisar, escrever ou mostrar no mapa do celular", "Ir embora sem responder", "Falar bem rápido"], answer: 0, explain: "Apontar, escrever e mostrar o mapa resolvem muita coisa." },
          { type: "vf", q: "Em Libras, apontar faz parte da conversa: serve para indicar lugares, pessoas e direções.", answer: true, explain: "Na Libras, apontar é parte da língua, e não falta de educação." },
          { type: "video-palavra", sign: "Perto", options: ["Longe", "Aqui", "Perto"], answer: 2, explain: "Esse é o sinal de “perto”." },
        ],
      },
      {
        id: "revisao-rua", kind: "practice", icon: "arrow-repeat", label: "Revisão", hint: "5 exercícios",
        questions: [
          { type: "video-palavra", sign: "Hospital", options: ["Mercado", "Hospital", "Ônibus"], answer: 1, explain: "Esse é o sinal de “hospital”." },
          { type: "palavra-video", sign: "Aqui", options: ["Onde?", "Longe", "Aqui", "Rua"], answer: 2, explain: "Esse é o sinal de “aqui”." },
          { type: "situacao", q: "No hospital, o que garante um bom atendimento a um paciente surdo?", options: ["Um intérprete de Libras ou alguém da equipe que saiba Libras", "Falar mais devagar e mais alto", "Conversar só com o acompanhante"], answer: 0, explain: "Com intérprete, o próprio paciente entende e é entendido, sem depender de outras pessoas." },
          { type: "vf", q: "O Dia Nacional do Surdo é comemorado em 26 de setembro.", answer: true, explain: "A data lembra a luta da comunidade surda por direitos, educação e respeito à Libras." },
          { type: "video-palavra", sign: "Rua", options: ["Rua", "Ônibus", "Longe"], answer: 0, explain: "Esse é o sinal de “rua”." },
        ],
      },
    ],
  },
};

// Ordem das etapas: uma só abre depois que a anterior for concluída.
const TOPIC_ORDER = Object.keys(learningTopics);

// A prova final pode ter no máximo este número de erros para passar.
const FINAL_MAX_MISTAKES = 1;

// ----- Progresso das lições (salvo no navegador) -----

function lessonKey(topicId, branchId) {
  return `${topicId}:${branchId}`;
}

function isLessonDone(topicId, branchId) {
  return state.completedLessons.includes(lessonKey(topicId, branchId));
}

// Quantas das 5 atividades desta etapa já foram concluídas.
function doneBranchCount(topicId) {
  return learningTopics[topicId].branches.filter((branch) => isLessonDone(topicId, branch.id)).length;
}

// A prova final só abre quando todas as atividades estão concluídas.
function isFinalUnlocked(topicId) {
  return doneBranchCount(topicId) === learningTopics[topicId].branches.length;
}

// A primeira etapa está sempre aberta; as outras abrem com a prova da anterior.
function isTopicUnlocked(topicId) {
  const position = TOPIC_ORDER.indexOf(topicId);
  return position === 0 || isLessonDone(TOPIC_ORDER[position - 1], "final");
}

// Etapa em que o aluno está: a primeira cuja prova final ainda não foi feita.
function currentTopicId() {
  return TOPIC_ORDER.find((id) => !isLessonDone(id, "final")) || TOPIC_ORDER[TOPIC_ORDER.length - 1];
}

// Passos de uma atividade: os cartões (aprender, com type "card") ou as perguntas (exercício).
// A prova final junta as 2 primeiras perguntas de cada exercício da etapa.
// A ordem das perguntas aqui é a mesma do banco: a API conta por ela.
function stepsFor(topicId, branchId) {
  const topic = learningTopics[topicId];
  if (branchId === "final") {
    return topic.branches
      .filter((branch) => branch.kind === "practice")
      .flatMap((branch) => branch.questions.slice(0, 2));
  }
  const branch = topic.branches.find((entry) => entry.id === branchId);
  return branch.kind === "learn" ? branch.cards.map((card) => ({ type: "card", ...card })) : branch.questions;
}

// Tipo da atividade: "learn" (aprender) ou "practice" (exercício; a prova final também).
function activityKind(topicId, branchId) {
  if (branchId === "final") return "practice";
  return learningTopics[topicId].branches.find((branch) => branch.id === branchId).kind;
}
