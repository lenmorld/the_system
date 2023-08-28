// console.log("wa")

// import React from 'react'

const { React, ReactDOM } = window;

function Books({ initialBooks }) {
    const [books, setBooks ] = React.useState(initialBooks) 

    const deleteBook = async (id) => {
        console.log("delete ", id)

        const raw = await fetch(`/books/${id}`, {
            method: 'DELETE'
        })

        const result = await raw.json()

        console.log("result: ", result)

        setBooks(result)
    }

    return (
        <ul>
            {
                books.map(book => (
                    <li key={book.id}>
                        <div>
                            {book.title} by {book.author}
                        </div>
                        <button onClick={() => deleteBook(book.id)}>Delete</button>
                    </li>
                ))
            }
        </ul>
    )
}


console.log(window.dataStore.books)

function App() {
    return (<div>
        <Books initialBooks={window.dataStore.books} />
    </div>)
}


ReactDOM.render(<App />, document.getElementById('app'));