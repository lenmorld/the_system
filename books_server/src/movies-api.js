const { RESTDataSource } = require('@apollo/datasource-rest')

class MoviesAPI extends RESTDataSource {
    baseURL = 'https://www.omdbapi.com/?apikey=5ca5c38a'
    // t=iron+man

    constructor(options) {
        // this sends our server's `cache` through
        // see https://www.apollographql.com/docs/apollo-server/data/fetching-rest#caching
        super(options)
    }

    async getMovie(id) {
        return this.get(`${this.baseURL}&i=${id}`)
    }
}

module.exports = MoviesAPI;
