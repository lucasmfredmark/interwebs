import knex from 'knex'
import config from '../knexfile'

const db = knex(config)

export default db
export const pagesDB = () => db('pages')
