import Crawler from 'simplecrawler'
import cheerio from 'cheerio'
import stripHtml from 'string-strip-html'
import cleanup from 'node-cleanup'
import { pagesDB } from './db'

const crawler = new Crawler('https://en.wikipedia.org/wiki/Donald_Trump')

crawler.maxConcurrency = 3
crawler.maxDepth = 3
crawler.timeout = 10000
//crawler.maxResourceSize = 1024 * 1024
crawler.allowedProtocols = [/^http(s)?$/i]
crawler.supportedMimeTypes = [/^text\/(plain|html)/i]
crawler.downloadUnsupported = false
crawler.decodeResponses = true
crawler.parseHTMLComments = false
crawler.parseScriptTags = false
crawler.filterByDomain = false

crawler.on('crawlstart', () => console.log('Started crawling...'))
crawler.on('complete', () => console.log('Stopped crawling...'))
crawler.on('error', err => console.error(err))

crawler.on('fetchcomplete', function (queueItem, responseBody) {
    console.log(queueItem.url)
    const resume = this.wait()

    pagesDB()
        .where('url', queueItem.url)
        .first()
        .then(page => {
            if (page) {
                return resume()
            }

            const { title, content } = getTitleAndContent(responseBody)

            return pagesDB()
                .insert({ url: queueItem.url, title, content })
                .then(() => resume())
                .catch(err => {
                    console.error(err)
                    resume()
                })
        })
        .catch(err => {
            console.error(err)
            resume()
        })
})

crawler.queue.defrost('queue.json', err => {
    if (!err) {
        console.log('Loaded queue backup successfully')
        return crawler.start()
    }

    if (err.code === 'ENOENT') {
        console.log('No queue backup was loaded - using default URL')
        return crawler.start()
    }

    throw err
})

const getTitleAndContent = html => {
    // TODO: Extract data from meta tags as well

    const $ = cheerio.load(html)
    const title = $('head title').text().trim().substr(0, 500)
    const content = stripHtml(cheerio.html($('body'))).result.replace(/\s+/g,' ').substr(0, 10000)

    return { title, content }
}

cleanup((exitCode, signal) => {
    if (signal) {
        crawler.stop(true)
        crawler.queue.freeze('queue.json', err => {
            if (err) {
                console.error('Could not backup queue before exiting')
                console.error(err)
            }

            process.kill(process.pid, signal)
        })

        cleanup.uninstall()
        return false
    }
})
