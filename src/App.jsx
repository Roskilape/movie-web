import Search from "./component/Search";
import { useState, useEffect } from "react";
import Spinner from "./component/Spinner";
import MovieCard from "./component/MovieCard";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_URL = "https://api.themoviedb.org/3";

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debounceSearchTerm, setDebounceSearchTerm] = useState("");
  const [trendingMovies, setTrendingMovies] = useState([]);

  useDebounce(() => setDebounceSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query) => {
    setIsLoading(true);
    try {
      const endPoint = query
        ? `${API_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endPoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error("error fetching Movies");
      } else {
        const data = await response.json();
        if (data || data.results.length > 0) {
          setMovieList(data.results);
          console.log(data.results);
        } else if (data.Response === false) {
          setErrorMessage("No response from the server");
          setMovieList([]);
        }
        if (query && data.results.length > 0) {
          await updateSearchCount(query, data.results[0]);
        }
      }
    } catch (error) {
      console.error("error Fetching Movies", error);
      setErrorMessage("Error Fetching Movies: Please Try again Later");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error Fetching Movies: ${error} `);
    }
  };

  useEffect(() => {
    fetchMovies(debounceSearchTerm);
  }, [debounceSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern">
        <div className="wrapper">
          <header>
            <img src="/movie-banner.png" alt="movie-banner" />
            <h1>
              Find <span className="text-gradient">Movies</span> you'll enjoy
              without the hassle
            </h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </header>

          {trendingMovies.length > 0 && (
            <section className="trending">
              <h2>Trending Movies</h2>

              <ul>
                {trendingMovies.map((movie, index) => (
                  <li key={movie.$id}>
                    <p>{index + 1}</p>
                    <img src={movie.poster_url} alt="movie.title" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <h1 className="text-center my-3">All Movies</h1>
          <section className="all-movies">
            {isLoading ? (
              <Spinner />
            ) : (
              <ul>
                {!movieList.length ? (
                  <p className="text-red-500">{errorMessage}</p>
                ) : (
                  movieList.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))
                )}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default App;
