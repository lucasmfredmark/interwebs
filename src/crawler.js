import crypto from 'crypto'
import Crawler from 'simplecrawler'
import cheerio from 'cheerio'
import stripHtml from 'string-strip-html'
import cleanup from 'node-cleanup'
import esClient from './elasticsearch'

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
crawler.on('error', console.error)

crawler.on('fetchcomplete', function (queueItem, responseBody) {
    const resume = this.wait()

    const { url } = queueItem
    const { title, content } = getTitleAndContent(responseBody)

    esClient.index({
        id: crypto.createHash('sha1').update(url).digest('hex'),
        index: 'search',
        body: { url, title, content }
    })
        .catch(console.error)
        .finally(resume)
})

crawler.queue.defrost('queue.json', error => {
    if (!error) {
        console.log('Loaded queue backup successfully')
        return crawler.start()
    }

    if (error.code === 'ENOENT') {
        console.log('No queue backup was loaded - using default URL')
        return crawler.start()
    }

    throw error
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
        crawler.queue.freeze('queue.json', error => {
            if (error) {
                console.error('Could not backup queue before exiting')
                console.error(error)
            }

            process.kill(process.pid, signal)
        })

        cleanup.uninstall()
        return false
    }
})
