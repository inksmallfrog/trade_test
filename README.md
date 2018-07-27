# DEPENDENCES
1. node.js > v10
2. mongodb

# USAGE
## install
```shell
    git clone https://github.com/inksmallfrog/trade_test.git
    cd trade_test
```
for npm
```shell
    npm i
```
for yarn
```shell
    yarn install
```
## config
1. change security.js.demo to security.js.
```shell
    mv security.js.demo security.js
```
2. add **Your API Key** to security.js.
3. change db/db.js to connect to your mongodb.
4. change config/index.js to your position.
5. run program to debug it
```shell
    node index.js
```

