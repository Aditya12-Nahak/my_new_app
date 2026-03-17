import { useState } from "react";
import "./App.css";

function randomPosition() {
  return {
    x: Math.floor(Math.random() * 4),
    y: Math.floor(Math.random() * 4)
  };
}

function generateSafePositions() {
  const agent = { x: 0, y: 0 };
  let wumpus = randomPosition();
  let pits = [
    randomPosition(),
    randomPosition(),
    randomPosition()
  ];
  let gold = randomPosition();

  while (
    (gold.x === wumpus.x && gold.y === wumpus.y) ||
    pits.some(p => p.x === gold.x && p.y === gold.y) ||
    (gold.x === agent.x && gold.y === agent.y)
  ) {
    gold = randomPosition();
  }

  return { wumpus, pits, gold };
}

function App() {
  const size = 4;
  const positions = generateSafePositions();

  const [agent, setAgent] = useState({ x: 0, y: 0 });
  // NEW: Track visited nodes
  const [visited, setVisited] = useState([{ x: 0, y: 0 }]);
  
  const [wumpus, setWumpus] = useState(positions.wumpus);
  const [pits, setPits] = useState(positions.pits);
  const [gold, setGold] = useState(positions.gold);

  const [score, setScore] = useState(0);
  const [arrows, setArrows] = useState(3);
  const [message, setMessage] = useState("");
  const [percept, setPercept] = useState("");
  const [wumpusAlive, setWumpusAlive] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [animation, setAnimation] = useState("");

  const moveSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
  const deathSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
  const winSound = new Audio("https://actions.google.com/sounds/v1/cartoon/concussive_drum_hit.ogg");

  const isNear = (a, b) => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
  };

  const restartGame = () => {
    const positions = generateSafePositions();
    setAgent({ x: 0, y: 0 });
    // Reset visited nodes on restart
    setVisited([{ x: 0, y: 0 }]);
    
    setWumpus(positions.wumpus);
    setPits(positions.pits);
    setGold(positions.gold);
    setScore(0);
    setArrows(3);
    setMessage("");
    setPercept("");
    setWumpusAlive(true);
    setGameOver(false);
    setAnimation("");
  };

  const move = (dx, dy) => {
    if (gameOver) return;

    let newX = agent.x + dx;
    let newY = agent.y + dy;

    if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
      moveSound.play().catch(() => {});

      const newPos = { x: newX, y: newY };
      setAgent(newPos);
      setScore(s => s - 1);

      // UPDATE VISITED LOGIC
      setVisited(prev => {
        const alreadyVisited = prev.some(p => p.x === newX && p.y === newY);
        if (alreadyVisited) return prev;
        return [...prev, { x: newX, y: newY }];
      });

      if (wumpusAlive && newX === wumpus.x && newY === wumpus.y) {
        deathSound.play().catch(() => {});
        setAnimation("wumpus");
        setMessage("💀 Wumpus ate you!");
        setScore(s => s - 100);
        setGameOver(true);
      } else if (pits.some(p => p.x === newX && p.y === newY)) {
        deathSound.play().catch(() => {});
        setAnimation("pit");
        setMessage("💀 Fell into a pit!");
        setScore(s => s - 50);
        setGameOver(true);
      } else if (newX === gold.x && newY === gold.y) {
        winSound.play().catch(() => {});
        setAnimation("win");
        setMessage("🏆 You found the GOLD!");
        setScore(s => s + 1000);
        setGameOver(true);
      } else {
        setMessage("");
      }

      let clues = "";
      if (pits.some(p => isNear(newPos, p))) clues += "🌬 Breeze ";
      if (wumpusAlive && isNear(newPos, wumpus)) clues += "💨 Stench ";
      if (newX === gold.x && newY === gold.y) clues += "✨ Glitter ";
      setPercept(clues);
    }
  };

  const shootArrow = () => {
    if (gameOver) return;
    if (arrows <= 0) {
      setMessage("❌ No arrows left!");
      return;
    }
    setArrows(a => a - 1);
    setScore(s => s - 100);
    if (isNear(agent, wumpus) && wumpusAlive) {
      winSound.play().catch(() => {});
      setWumpusAlive(false);
      setMessage("🏹 You killed the Wumpus!");
      setScore(s => s + 50);
    } else {
      setMessage("🏹 Arrow missed!");
    }
  };

  return (
    <div className={`container ${gameOver ? "dead" : ""}`}>
      <h1>🧠 Wumpus World AI</h1>
      <div className="stats">
        <h2>Score: {score}</h2>
        <h2>Arrows: {arrows}</h2>
      </div>

      <h3>{message}</h3>
      <h3>{percept}</h3>

      {animation === "pit" && (
        <div className="deathAnimation">
          🤖 ⬇️ ⬇️ 🕳
          <h2>Agent Fell Into Pit</h2>
        </div>
      )}

      {animation === "wumpus" && (
        <div className="deathAnimation">
          🧌 🍴 🤖
          <h2>Wumpus Ate The Agent</h2>
        </div>
      )}

      {animation === "win" && (
        <div className="deathAnimation">
          🤖 💰 🎉
          <h2>You Escaped With Gold!</h2>
        </div>
      )}

      {[...Array(size)].map((_, i) => (
        <div key={i} className="row">
          {[...Array(size)].map((_, j) => {
            let content = "";
            
            // Logic to display current agent OR visited mark
            const isCurrentlyAgent = agent.x === i && agent.y === j;
            const hasBeenVisited = visited.some(v => v.x === i && v.y === j);

            if (isCurrentlyAgent) {
              content = "🤖";
            } else if (hasBeenVisited) {
              content = "V";
            }

            return (
              <div key={j} className={`cell ${hasBeenVisited ? "visited" : ""}`}>
                {content}
              </div>
            );
          })}
        </div>
      ))}

      <div className="controls">
        <button onClick={() => move(-1, 0)}>⬆️</button>
        <button onClick={() => move(1, 0)}>⬇️</button>
        <button onClick={() => move(0, -1)}>⬅️</button>
        <button onClick={() => move(0, 1)}>➡️</button>
      </div>

      <div className="controls">
        <button onClick={shootArrow}>🏹 Shoot Arrow</button>
        <button onClick={restartGame}>🔄 Restart</button>
      </div>
    </div>
  );
}

export default App;