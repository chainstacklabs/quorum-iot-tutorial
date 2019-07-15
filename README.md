# quorum-iot-tutorial
Smart contract from [this tutorial](https://docs.chainstack.com/tutorials/food-supply-temperature-control-on-quorum).

# Quick Start
Install dependencies
```
$ npm install
```

Create .env file Replace RPC and Public keys
````
RPC1='http://nd-***-***-***.rg-***-***.p2pify.com'
PK1='********************************************'
RPC2='http://nd-***-***-***.rg-***-***.p2pify.com'
PK2='********************************************'
RPC3='http://nd-***-***-***.rg-***-***.p2pify.com'
PK3='********************************************'
````

Reference .env.sample for more information

**Execute Public Transaction**
```
$ node public.js
```

**Execute Private Transaction**
```
$ node private.js
```
