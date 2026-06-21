import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Users, Cpu } from 'lucide-react';

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [gameMode, setGameMode] = useState(null); // null, 'pvp', 'ai'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScores();
  }, []);

  useEffect(() => {
    if (gameMode === 'ai' && !isXNext && !winner) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, winner, gameMode, board]);

  const loadScores = async () => {
    try {
      const result = await window.storage.get('tictactoe:scores');
      if (result) {
        setScores(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No scores found');
    } finally {
      setLoading(false);
    }
  };

  const saveScores = async (newScores) => {
    try {
      await window.storage.set('tictactoe:scores', JSON.stringify(newScores));
    } catch (error) {
      console.error('Error saving scores:', error);
    }
  };

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line };
      }
    }
    return null;
  };

  const makeAIMove = () => {
    const availableSquares = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    
    if (availableSquares.length === 0) return;

    // Try to win
    for (let i of availableSquares) {
      const testBoard = [...board];
      testBoard[i] = 'O';
      if (calculateWinner(testBoard)?.winner === 'O') {
        handleClick(i);
        return;
      }
    }

    // Block player from winning
    for (let i of availableSquares) {
      const testBoard = [...board];
      testBoard[i] = 'X';
      if (calculateWinner(testBoard)?.winner === 'X') {
        handleClick(i);
        return;
      }
    }

    // Take center if available
    if (availableSquares.includes(4)) {
      handleClick(4);
      return;
    }

    // Take corner
    const corners = [0, 2, 6, 8].filter(i => availableSquares.includes(i));
    if (corners.length > 0) {
      handleClick(corners[Math.floor(Math.random() * corners.length)]);
      return;
    }

    // Take any available square
    handleClick(availableSquares[Math.floor(Math.random() * availableSquares.length)]);
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;
    if (gameMode === 'ai' && !isXNext) return; // Prevent clicking during AI turn

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);

    const result = calculateWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      const newScores = { ...scores, [result.winner]: scores[result.winner] + 1 };
      setScores(newScores);
      saveScores(newScores);
    } else if (newBoard.every(square => square !== null)) {
      setWinner('draw');
      const newScores = { ...scores, draws: scores.draws + 1 };
      setScores(newScores);
      saveScores(newScores);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
  };

  const resetScores = async () => {
    const newScores = { X: 0, O: 0, draws: 0 };
    setScores(newScores);
    await saveScores(newScores);
  };

  const selectMode = (mode) => {
    setGameMode(mode);
    resetGame();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-lg">Loading game...</div>
      </div>
    );
  }

  // Mode Selection Screen
  if (!gameMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-2">Tic Tac Toe</h1>
            <p className="text-gray-600">Choose your game mode</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => selectMode('pvp')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
            >
              <Users className="w-6 h-6" />
              <span className="text-xl">Player vs Player</span>
            </button>

            <button
              onClick={() => selectMode('ai')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
            >
              <Cpu className="w-6 h-6" />
              <span className="text-xl">Player vs AI</span>
            </button>
          </div>

          {(scores.X > 0 || scores.O > 0 || scores.draws > 0) && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-600 mb-3">All-Time Stats</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{scores.X}</div>
                  <div className="text-xs text-gray-600">X Wins</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-600">{scores.draws}</div>
                  <div className="text-xs text-gray-600">Draws</div>
                </div>
                <div className="bg-pink-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-pink-600">{scores.O}</div>
                  <div className="text-xs text-gray-600">O Wins</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Game Screen
  const status = winner
    ? winner === 'draw'
      ? "It's a Draw!"
      : `${winner} Wins!`
    : `${isXNext ? 'X' : 'O'}'s Turn`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Tic Tac Toe</h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            {gameMode === 'ai' ? <Cpu className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            <span>{gameMode === 'ai' ? 'vs AI' : 'Player vs Player'}</span>
          </div>
        </div>

        {/* Status */}
        <div className={`text-center text-2xl font-bold mb-6 ${
          winner ? 'text-green-600' : 'text-gray-800'
        }`}>
          {status}
        </div>

        {/* Score Board */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-3xl font-bold text-blue-600">{scores.X}</div>
            <div className="text-sm text-gray-600">X Wins</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-3xl font-bold text-gray-600">{scores.draws}</div>
            <div className="text-sm text-gray-600">Draws</div>
          </div>
          <div className="bg-pink-50 rounded-lg p-3 text-center">
            <div className="text-3xl font-bold text-pink-600">{scores.O}</div>
            <div className="text-sm text-gray-600">O Wins</div>
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {board.map((value, index) => {
            const isWinningSquare = winningLine.includes(index);
            return (
              <button
                key={index}
                onClick={() => handleClick(index)}
                className={`aspect-square rounded-xl text-5xl font-bold transition-all transform hover:scale-105 ${
                  value === 'X' ? 'text-blue-600' : value === 'O' ? 'text-pink-600' : 'text-gray-400'
                } ${
                  isWinningSquare
                    ? 'bg-green-200 shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200'
                } ${
                  !value && !winner ? 'cursor-pointer' : 'cursor-default'
                }`}
                disabled={!!value || !!winner || (gameMode === 'ai' && !isXNext)}
              >
                {value}
              </button>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={resetGame}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            New Game
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setGameMode(null)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
            >
              Change Mode
            </button>
            <button
              onClick={resetScores}
              className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded-lg transition-colors"
            >
              Reset Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}