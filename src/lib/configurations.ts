import { PoolConfig } from "mysql";
import { TransportOptions } from "nodemailer";

let poolConfig: PoolConfig = {
    host    : 'localhost',
    user    : 'aj',
    password: 'horsebatterystaple',
    database: 'tonyslist',
    connectionLimit: 10
}

let transporterConfig = {
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'renecp43cu7jufm6@ethereal.email',
        pass: 'nhrqA2ajJwJDQnRX8t'
    }
}

let jwtSecret: string = "146a3f21-b1c6-4002-9861-4058df09ca1f";

export {
    poolConfig,
    jwtSecret,
    transporterConfig
}