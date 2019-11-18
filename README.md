# http-fast2 0.0.1

Este é um *bitcode* do [Thrust](https://github.com/Thrustjs/thrust) para gerenciar e rotear requisições web para seu projeto *thrust*.

Como a GraalVM não suporta *multi-thread* e o *bitcode* foi construído sob o *thrust* v0.0.8; as requisições trabalham com *contextos* separados para suas **rotas** Web.

## Instalação no projeto

Para instalar este *bitcode* em seu projeto, utilize o *tpm*:

```sh
tpm install http-fast2
```

## Importando o *http-fast2*

Importe o *bitcode* em seu projeto:

```js
const httpFast2Server = require('http-fast2')
```

## Configurações para o *http-fast2*

Configure para o servidor *http-fast2*:

1. As suas rotas Web.
2. Os interceptadores das requisições Web (*middlewares*).
3. O interceptador de finalização de sua requisição (*before send response*).

Apenas a primeira configuração é obrigatória, as demais são opcionais.

### Configuração de rota

No arquivo JavaScript de configuração de rota, você deverá **exportar** um *array* em que cada registro é um outro *array* no qual:

- O primeiro elemento é a rota a ser publicada.
- O segundo elemento é o *caminho* em que se encontra a rota.

Segue um exemplo simples:

```js
exports = [
    // Rota 1
    ['/api/hello', `src/api/hello-rest/hello`],
    // Rota 2
    ['/api/hello-name/:name', `src/api/hello-rest/helloName`],
    // Rota 3
    ['/api/hello-param',`src/api/hello-rest/helloParam`]
]
```

Considere a *Rota 1*:

```js
['/api/hello', `src/api/hello-rest/hello`]
```

O primeiro elemento do *array* `/api/hello` refere-se ao *caminho da rota*, que deve ser único.

E o segundo elemento `src/api/hello-rest/hello` refere-se à função que executa a chamada da rota. Para identificar a função, você deverá informar o caminho do arquivo JavaScript, em relação à raiz do projeto e depois a função que será chamada.

Neste exemplo, `src/api/hello-rest` refere-se ao arquivo `hello-rest.js`, que está dentro do diretório `src/api`. E `hello` é a função que foi exportada no arquivo/módulo `hello-rest.js`.

Note a rota:

```js
['/api/hello-name/:name', `src/api/hello-rest/helloName`],
```

Nesta temos, um parâmetro de caminho, que é denotado por um parâmetro precedido por `:`; que poderá ser utilizado como valor a ser trabalhado pela função da rota.
Mais detalhes veremos adiante.

Você informa ao *http-fast2* qual é o arquivo que contém o *array* das rotas através
da função `.setRoutesFilePath()`. Por exemplo:

```js
const httpFastServer = require('http-fast2')
// ...
httpFastServer.setRoutesFilePath('src/utils/routes.js')
```

Neste exemplo, você está informando que o arquivo `src/utils/routes.js` contém a configuração de rotas para o sistema.

### Configuração de *middleware*

Opcionalmente, você pode configurar os interceptadores de requisição. Para isto, você
deve escrever um arquivo JavaScript que exportará um *array* de funções:

```js
exports = [
    funcaoMiddleware01,
    funcaoMiddleware02,
    //...
]
```

Cada função de *middleware* tem a *estrutura*:

```js
function funcaoMiddlewareXX(params, request, response) {
    return true
}
```

Em caso de sucesso na interceptação, deve-se retornar `true`.

Quanto aos parâmetros que são informados à função, estes são, em sua ordem:

- Objeto que contém os parâmetros recebidos pelo requisição Web (*params*).
- Objeto com os *recursos* para a entrada da requisição (*request*).
- Objeto com os *recursos* para a saída/resposta da requisição (*response*).

Mais adiantes, nós falamos sobre estes objetos.

Segue um exemplo de arquivo JS que exporta um *middleware*:

```js
exports = [
    function adicionarDataInicial(params, request, response) {
        request.context = {
            initTime: new Date()
        }
        return true
    }
]
```

Aqui estamos adicionando ao objeto de **requisição** um atributo para identificar a data e hora que iniciou a requisição.

Utilize a função `.setMiddlewaresFilePath()` para informar qual é o arquivo que contém o *array* de funções de interceptação de requisição:

Por exemplo:

```js
const httpFastServer = require('http-fast2')
// ...
httpFastServer.setMiddlewaresFilePath('src/utils/middlewares.js')
```

Estamos informando aí que os *middlwares* estão contidos no arquivo `src/utils/middlewares.js`. O *bitcode* considera sempre os arquivos a partir da raiz do projeto.

### Configuração do interceptador final

Também podemos configurar opcionalmente um interceptador final, que é executado após a executação da função da rota.

O arquivo que contém este interceptador deve exportar uma função única com esta *assinatura*:

```js
function aposRequisicao(error, params, request, response) {
    // Faça algo
}
```

Os parâmetros são passados na seguinte ordem:

- Erro não tratado.
- Objeto com os parâmetros da requisição.
- Objeto da requisição.
- Objeto para a resposta.

Utilize a função `.setAfterRequestFnFilePath()` para informar qual é o arquivo que contém a função *middleware* de interceptação final. Por exemplo:

```js
const httpFastServer = require('http-fast2')
// ...
httpFastServer.setAfterRequestFnFilePath('src/utils/middlewares.js')
```

## Iniciando a escuta de requisições

Para iniciar o **servidor** do *bitcode* utilize a função

```js
httpFast2.startServer(port, minThreads, maxThreads)
```

Sendo que:

- `port`: Porta de escuta para o servidor HTTP. Se não for informado, o padrão é
**8778**.
- `minThreads`: Quantidade mínima de *threads* para o *bitcode* iniciar. Se não for informado, o padrão é **8**.
- `maxThreads`: Quantidade máxima de *threads* para o *bitcode* iniciar. Se não for informado, será utilizado o mesmo valor que for definido para `minThreads`.

## Funções de rotas

As funções de rota contém a seguinte *assinatura*:

```js
function minhaFuncaoParaRota(params, request, response) {
    // Faça algo
}
```

Considere, por exemplo, a rota:

```js
['/api/hello', `src/api/hello-rest/hello`]
```

Logo, em nosso arquivo `hello-rest.js`, nós iremos publicar a função `hello`:

```js
const hello = (params, request, response) => response.json('Olá enfermeira!')
exports = {
    hello
}
```

## Objetos dos parâmetros da funções

Nossas funções de roteamento e de interceptação (*middlewares*) contém objetos auxiliares para trabalhar com as requisições. De forma geral, os parâmetros de entrada de nossas funções são:

```js
function funcao(params, request, response) {
    //...
}
```

Vamos apresentá-los.

### Objeto de parâmetro *params*

Objeto que contém os parâmetros informados por uma requisição.

Por exemplo, se tivermos a seguinte rota definida:

```js
['/api/hello-param',`src/api/hello-rest/helloParam`
```

E meu servidor está configurado para escutar a porta 3000, e fizermos a seguinte chamada via o comando [curl](https://curl.haxx.se):

```sh
curl -v http://localhost:3000/api/minhaApi?param1=Teste
```

O valor do parâmetro `param1` será atribuído ao objeto `params`. Logo, na minha função de interceptação:

```js
function helloParam(params, request, response) {
    const param1 = params.param1
    // ...
}
```

Também, o objeto `params` *guarda* o valores de um parâmetro de caminho. Por exemplo,
da rota:

```js
['/api/hello-name/:name', `src/api/hello-rest/helloName`]
```

O valor do parâmetro `name` é carregado no objeto:

```js
function helloName(params, request, response) {
    const name = params.name
    // ...
}
```

### Objeto de parâmetro *request*

O segundo objeto de argumento é o `request` que apresenta as informações da requisições. Dentre seus atributos podemos destacar:

- `cookies`: Objeto com os *cookies* da requisição.
- `headers`: Objeto com as informações do cabeçalho.
- `host`: *Host* do servidor.
- `method`: Método da requsição, tal como `GET`.
- `queryString`: Apresenta os pares/valores informados com a requisição.
- `port`: Porta do servidor.
- `requestURI`: URL completa da requisição.
- `rest`: URL da rota sem parâmetros.

Por exemplo, se nosso servidor estiver sendo executado na máquina local sob a porta de escuta 3000 e temos a seguinte rota `/api/hello-request`. Ao executarmos o comando:

```sh
curl -v \
  --cookie "USER_TOKEN=OzFabWil" \
  --header "X-Softbox: LuizaLabs" \
  "http://localhost:3000/api/hello-request?a=1&b=1"
```

Nós encontramos os seguintes valores no objeto `request`:

```js
{
    "queryString": "a=1&b=1",
    "rest": "/api/hello-request",
    "method": "GET",
    "requestURI": "/api/hello-request?a=1&b=1",
    "host": "localhost",
    "port": "3000",
    "cookies": {
        "USER_TOKEN": "OzFabWil"
    },
    "headers": {
        "Host": "localhost",
        "Port": "3000",
        "User-Agent": "curl/7.58.0",
        "Accept": "*/*",
        "Cookie": "USER_TOKEN=OzFabWil",
        "X-Softbox": "LuizaLabs"
    },
    // Há outros campos que foram omitidos
}
```

Segue um exemplo na função de rota:

```js
function internalizarProduto(params, request, response) {
    // ... alguns trechos de código
    if (!request.cookies.USER_AGENT) {
        // .... alguns tratamentos
        return response.json({
            codigo: -10,
            error: 'Como assim não tem o usuário?'
        })
    }
    // ... continua o código
}
```

Neste trecho de código, se na requisição não for encontrado o *cookie* `USER_AGENT`;
então, a requisição é rejeitada.

### Objeto de parâmetro *response*

Para enviar e tratar a resposta, nós utilizamos o terceiro objeto do parâmetro, o `response`; que possui basicamente os seguintes métodos:

- `clean()`: Limpa a saída.
- `write(text)`: Escreve o *texto*, o conteúdo do valor de `text`.
- `plain(text)`: Envia o *texto* de `text` como resposta 200, sendo do tipo texto plano.
- `json(data)`: Envia o conteúdo de `data` como resposta 200, sendo do *tipo* JSON.
- `html(data)`: Envia o conteúdo de `data` como resposta 200, sendo do tipo HTML.
- `binary(data)`: Envia o conteúdo de `data` como resposta 200, sendo do tipo binário.
- `status(code)`: Altera o código HTTP para o `code` informado.

A seguir, temos um exemplo em que enviamos um JSON com código HTTP 500:

```js
function minhaRotaXPTO(params, request, response) {
    let valida
    // .... algum codigo
    if (!valida) {
        return response.status(500).json({
            codigo: 1,
            descricao: 'Deu ruim!'
        })
    }
    // ... mais algum codigo
}
```

## Códigos exemplos

Temos alguns projetos exemplos aqui no diretório [samples](./samples):

- [helloworld](./samples/helloworld): Projeto com os principais exemplos deste documento.
- [webapi](./samples/webapi): Projeto exemplo com acesso a um banco de dados.

## Montar o jar o para publicação

Monte o `.jar` para publicação da seguinte forma:

```sh
./gradlew clean build copyJar
```
