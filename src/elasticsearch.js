import { Client } from '@elastic/elasticsearch'

if (!process.env.ELASTICSEARCH_URL) {
  throw new Error('Missing environment variable ELASTICSEARCH_URL')
}

export default new Client({ node: process.env.ELASTICSEARCH_URL })
