# FuncZ
  FuncZ é uma plataforma desenhada para funcionar como uma ferramenta de geração de encartes, atualmente esse código está completamente adaptado para a empresa Zenir Móveis e Eletros. O código foi inteiramente construído com o intuito de melhorar os processos e diminuir retrabalho, até por que, errar é humano e completamente normal. A plataforma tem uma estrutura simples e pronta para funcionar completamente:

=>Tela de login;
=>Seleção de uso ou ferramenta diretamente pela aba de "Seleção de setor":
-Cartazes > criação de encartes
-Faturamento > preenchimento/geração de documento para declaração de devolução, dando a oportunidade de padronizar um trabalho;
-Admin > criação de usuários, adição de produtos a base de dados de uma maneira fácil, geração de voucher (ferramenta não continuada por falta de necessidade real);
-Suporte > maneira de ajudar o usuário a ter acesso a uma lista de ramais internos mais fácil e de conseguir tirar alguma dúvida relacionada ao sistema ou ao Saas da empresa, o "chatbot" responde com respostas prontas a partir de palavras-chave que encontra na pergunta do usuário, não possui nenhuma inteligência artificial conectada.
=>Sobre

#Conexões importantes:

  Atualmente o FuncZ utiliza duas conexões principais para funcionar, a Google App Script (GAS) para utilizar a função doGet para ter acesso ao banco de dados de produtos facilmente, a função envia as informações importantes para cada código por meio de um JSON; e também um CloudFlare Worker utilizado para realizar posts na Google App Script, realizando uma "ponte" entre o front end e a API.
  A API tem sua estrutura para realizar certas ações, entre elas o Login, consumo de Vouchers (descontinuado por falta de necessidade, mas utilizado na primeira versão), uma mini estrutura de "auditoria" para erros simples de usuários: login em local não autorizado e senha incorreta; atualmente ainda não há uma estrutura para mais informações de auditoria pois ainda não se fez necessário, mas em breve haverá uma função para auditar todas as gerações de cartazes.
  Esta plataforma utiliza um "meio de segurança" bem simples, ao colocar usuário e senha para fazer login, é tentado obter o local, para realizar um Post na API para confirmar se o usuário está em local realmente permitido, se a função de pegar o local falhar, ela pede o CEP, detectando a cidade ela envia para a API por meio do Worker e espera a resposta para liberar o login, todo esse processo leva pelo menos 10 segundos. Se a resposta da API for que o local está incorreto ou a senha incorreta o usuário é avisado.

#Guia de funcionalidade:

  Na criação de encartes, o intuito é ter uma aba onde você tem total controle da busca de produtos (por código), insere valores, altera métodos de pagamento, parcelamentos, etc. A própria aba também da acesso a possibilidade de criar pelo celular, tendo um menu limitado porém funcional, que envia um JSON para o Google Drive e quando pela plataforma principal (aba de cartazes), pode ser solicitado o goGet desse JSON para preencher os campos e gerar um cartaz mais rápido.

  Na geração de uma declaração de devolução, basta apenas preencher os dados do cliente, informações importantes relacionadas ao fisco do pedido e demais informações relevantes.

  
