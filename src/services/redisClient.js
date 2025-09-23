const {createClient}  = require("redis")


const client = createClient({
    username: 'default',
    password: 'Zy3cdLISTW0WEUR8himmXsnf2OBEjgFj',
    socket: {
        host: 'redis-18139.c266.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 18139
    }
});


async function connectRedisClient(){
    client.on('error', err => console.log('Redis Client Error', err));

    await client.connect();
    console.log("Redis is connected...")
}

module.exports = {connectRedisClient , client }