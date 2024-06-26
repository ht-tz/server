/*
 * @Author: htz
 * @Date: 2024-06-26 11:51:28
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2024-06-26 23:22:13
 * @Description:  无感刷新服务端
 */

const koa = require('koa')
const Router = require('koa-router')
const bodyPaser = require('koa-bodyparser')
const jwt = require('jsonwebtoken')
const koaJwt = require('koa-jwt')
const cors = require('koa2-cors')
const app = new koa()
// 配置插件

const router = new Router()

const SECRET = 'your_jwt_secret' // 用于签署 JWT 的密钥
const REFRESH_SECRET = 'your_refresh_jwt_secret'
const ACCESS_TOKEN_EXPIRES_IN = '15m' // 访问 Token 过期时间
const REFRESH_TOKEN_EXPIRES_IN = '7d' // 刷新 Token 过期时间

// 模拟用户数据
const user = {
    id: 1,
    username: 'testuser',
}

const generatorToken = (user) => {
    const acceseToken = jwt.sign({ id: user.id }, SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
    const refreshToken = jwt.sign({ id: user.id, username: user.username }, REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    })
    return { accessToken, refreshToken }
}

//登录的路由, 返回token和刷新token
router.post('/api/login', async (ctx) => {
    console.log('断点调试')
    const tokens = generatorToken(user)
    ctx.body = tokens
})

// 受保护的路由只能通过验证才能访问
router.get('/api/protected', koaJwt({ secret: SECRET }), async (ctx) => {
    ctx.body = {
        message: 'Portected message',
        user: ctx.state.user,
        code: 100,
    }
})

// 刷新 Token 的路由，通过 refreshToken 获取 accessToken
router.post('/api/refresh', async (ctx) => {
    const { refreshToken } = ctx.request.body
    if (!refreshToken) {
        ctx.status = 400
        cxtx.body = {
            message: 'Refresh token is required',
            code: 200,
        }
        return
    }

    try {
        const deconded = jwt.verify(refreshToken, REFRESH_SECRET)
        const newTokens = generatorToken(user)
        ctx.body = newTokens
    } catch (error) {
        ctx.status = 401
        ctx.body = {
            message: 'Invalid refresh token',
            code: 0,
        }
    }
})

// 错误处理
app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, POST, DELETE')
    ctx.set('Access-Control-Allow-Headers', 'x-requested-with, accept, origin, content-type')
    try {
        await next()
    } catch (error) {
        if (error.status === 401) {
            ctx.status = 401
            ctx.body = {
                message: 'Invalid token',
            }
        } else {
            throw Error('请求报报错')
        }
    }
})
// app.use(cos())
// app.use(
//     cors({
//         // 任何地址都可以访问
//         origin: '*',
//         // 指定地址才可以访问
//         // origin: 'http://localhost:8080',
//         maxAge: 2592000,
//         // 必要配置
//         credentials: true,
//     })
// )

// 注册路由
app.use(bodyPaser()).use(router.routes()).use(router.allowedMethods())
// 启动服务器
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000')
})
