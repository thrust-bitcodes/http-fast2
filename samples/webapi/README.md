# http-fast2 webapi sample

Exemplo de projeto Web utilizando os *bitcodes*:

- database
- filesystem
- http-fast2
- auth

## Banco de dados

Banco de desenvolvimento no [Docker](./docker-compose.yml).

Suba o banco:

```sh
docker-compose up
```

## Testes

Testes de exemplo com os *bitcodes*:

- majesty
- http-client.

Acesso o diretório de testes e rode o teste específico:

```sh
thrust cases/products-test.js
```
