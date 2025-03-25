import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const Game = ({ user }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [snake, setSnake] = useState([{ x: 5, y: 5 }]);
  const [food, setFood] = useState({ x: 10, y: 10 });
  const [gridSize] = useState(20);
  const [tileCount] = useState(20);
  const [speed] = useState(100);
  const [topScores, setTopScores] = useState([]);

  // Generate new food at a random position
  const generateFood = () => ({
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  });

  // Reset game state
  const resetGame = () => {
    setScore(0);
    setGameOver(false);
    setPaused(false);
    setDirection({ x: 1, y: 0 });
    setSnake([{ x: 5, y: 5 }]);
    setFood({ x: 10, y: 10 });
  };

  const update = () => {
    // Stop updating if game is over or paused
    if (gameOver || paused) return;

    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;

    // Check wall collision
    if (head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount) {
      setGameOver(true);
      return;
    }

    // Check self collision
    for (let segment of snake) {
      if (head.x === segment.x && head.y === segment.y) {
        setGameOver(true);
        return;
      }
    }

    let newSnake = [head, ...snake];

    // Check if food is eaten
    if (head.x === food.x && head.y === food.y) {
      setScore(score + 1);
      setFood(generateFood());
    } else {
      newSnake.pop(); // remove tail if not eating
    }
    setSnake(newSnake);
  };

  // Handle key events for arrow keys
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowUp':
        if (direction.y === 1) break;
        setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
        if (direction.y === -1) break;
        setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
        if (direction.x === 1) break;
        setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
        if (direction.x === -1) break;
        setDirection({ x: 1, y: 0 });
        break;
      default:
        break;
    }
  };

  // Game loop using setInterval
  useEffect(() => {
    const interval = setInterval(update, speed);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snake, direction, score, gameOver, paused]);

  // Attach keydown listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Render snake and food on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    ctx.fillStyle = 'lime';
    snake.forEach(segment => {
      ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });

    // Draw food
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
  }, [snake, food, gridSize]);

  // On game over, update score if it beats the high score.
  useEffect(() => {
    if (gameOver) {
      axios.post(`${BACKEND_URL}/api/updateScore`, {
        username: user.username,
        score: score
      }).then(res => {
        console.log("Score updated", res.data);
        // Refresh top scores when the game is over
        fetchTopScores();
      }).catch(err => console.error(err));
    }
  }, [gameOver, score, user.username]);

  // Fetch top scores from the backend
  const fetchTopScores = () => {
    axios.get(`${BACKEND_URL}/api/topScores`)
    .then(res => {
        setTopScores(res.data.topScores);
      })
      .catch(err => console.error("Error fetching top scores", err));
  };

  // Fetch top scores when the component mounts
  useEffect(() => {
    fetchTopScores();
  }, []);

  return (
    <div className="w-full h-screen flex flex-col md:flex-row">
      {/* Sidebar for Top 10 Scores */}
      <aside className="w-full md:w-1/4 h-full bg-gray-800 text-white p-6 overflow-auto">
        <h3 className="text-2xl mb-4 font-bold">Top 10 Scores</h3>
        <ul>
          {topScores.map((scoreUser, index) => (
            <li key={scoreUser.ID || index} className="mb-2 border-b border-gray-700 pb-1">
              <span className="font-semibold">{index + 1}. {scoreUser.Username}</span>
              <span className="ml-2 text-lg">{scoreUser.HighScore}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main game area */}
      <main className="w-full md:w-3/4 h-full flex flex-col justify-center items-center bg-gray-900 p-4">
        <div className="text-center mb-4">
          <h2 className="text-3xl text-white">Hello, {user.username}!</h2>
          <p className="text-xl text-yellow-400">Score: {score}</p>
        </div>
        <canvas
          ref={canvasRef}
          width={tileCount * gridSize}
          height={tileCount * gridSize}
          className="border-2 border-gray-300 mb-4"
        />
        <div className="flex space-x-4">
          <button 
            onClick={() => setPaused(!paused)} 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button 
            onClick={resetGame} 
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Reset
          </button>
        </div>
        {gameOver && (
          <div className="mt-4 bg-red-700 text-white p-3 rounded shadow">
            <h3 className="text-2xl">Game Over</h3>
          </div>
        )}
      </main>
    </div>
  );
};

export default Game;
