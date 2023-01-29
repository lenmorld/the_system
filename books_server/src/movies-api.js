const { RESTDataSource } = require('@apollo/datasource-rest')

class MoviesAPI extends RESTDataSource {
    baseURL = 'https://www.omdbapi.com/?apikey=5ca5c38a'
    // t=iron+man

    async getMovie(id) {
        return this.get(`${this.baseURL}&i=${id}`)
    }
}

module.exports = MoviesAPI;
