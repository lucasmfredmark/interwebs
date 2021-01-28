import Koa from 'koa'
import Router from 'koa-router'
import serve from 'koa-static'
import { pagesDB } from './db'

const app = new Koa()
const router = new Router()
const PAGE_SIZE = 10

router.get('/search/:q', async ctx => {
    const results = await pagesDB()
        .select(['url', 'title', 'content'])
        .whereRaw('MATCH (title, content) AGAINST (?)', [ctx.params.q])
        .offset(Math.max(0, (Number(ctx.query.page) || 0) - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)

    ctx.body = {
        count: results.length, // should be total
        results: results.map(result => ({
            url: result.url,
            title: result.title,
            content: result.content
        }))
    }
})

app.use(serve('public'))
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000)
