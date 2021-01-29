import { Client } from '@elastic/elasticsearch'

export default new Client({ node: 'http://elasticsearch:9200' })
