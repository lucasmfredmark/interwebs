import { Client } from '@elastic/elasticsearch'

const client = new Client({ node: 'http://elasticsearch:9200' })

client.ping()
    .catch(error => {
        console.error(error)
        process.exit(1)
    })

export default client
