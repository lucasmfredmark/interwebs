export const up = knex => {
  return knex.schema.createTable('pages', table => {
      table.increments()
      table.string('url', 500).notNullable()
      table.string('title', 500)
      table.text('content')
      table.index(['title', 'content'], null, 'fulltext')
      table.timestamps(true, true)
  })
}

export const down = knex => {
    return knex.schema.dropTable('pages')
}
