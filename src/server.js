import Koa from 'koa'
import Router from 'koa-router'
import serve from 'koa-static'
import esClient from './elasticsearch'

const app = new Koa()
const router = new Router()
const PAGE_SIZE = 10

router.get('/search/:query', async ctx => {
    const { query } = ctx.params
    const { page } = ctx.query

    const { body: { took, hits: { total, hits } } } = await esClient.search({
        index: 'search',
        body: {
            query: {
                match: {
                    title: query
                }
            },
            from: Math.max(0, (Number(page) || 0) - 1) * PAGE_SIZE,
            size: PAGE_SIZE
        }
    })

    ctx.body = {
        time: took / 1000,
        count: total.value,
        results: hits.map(hit => ({ ...hit._source }))
    }
})

app.use(serve('public'))
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(80)
