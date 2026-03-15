import express from "express";
import { createServer as createViteServer } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- ML Classification Logic (Mocking a Real-Time Classifier) ---
  // In a real enterprise app, this would be a Python service or a TensorFlow.js model.
  // Here we implement a weighted scoring system based on behavioral signals.
  
  const classifyBehavior = (signals: any) => {
    let score = 50; // Start at neutral
    const { mouse, keyboard, entropy, timing } = signals;

    // 1. Environmental Hard-Fails (Bot detection)
    if (entropy) {
      if (entropy.webdriver) return { status: 'bot', score: -100 };
      if (!entropy.languages || entropy.languages.length === 0) score -= 40;
      if (entropy.userAgent.includes('HeadlessChrome')) return { status: 'bot', score: -100 };
      if (!entropy.cookiesEnabled) score -= 20;
    }

    // 2. Mouse Dynamics Analysis
    if (mouse && mouse.avgVelocity > 0) {
      // Humans have jitter and non-linear paths
      if (mouse.linearity > 0.99) score -= 40; // Perfectly straight lines are suspicious
      if (mouse.avgVelocity > 8000) score -= 30; // Physical impossibility for humans
      if (mouse.jitter > 0.05) score += 15; // Natural micro-movements
      if (mouse.avgAcceleration > 0) score += 10; // Variable speed is human
    }

    // 3. Keyboard Rhythm Analysis
    if (keyboard && keyboard.avgDwellTime > 0) {
      // Bots have perfectly consistent dwell times (variance ~ 0)
      if (keyboard.variance < 2) score -= 40;
      if (keyboard.avgDwellTime > 30 && keyboard.avgDwellTime < 250) score += 20;
      if (keyboard.avgFlightTime > 50) score += 10;
      if (keyboard.errorRate > 0) score += 15; // Humans make mistakes
    }

    // 4. Timing & Session Context
    if (timing) {
      if (timing.sessionDuration < 1000) score -= 30; // Too fast for human comprehension
      if (timing.idleTime > 60000) score -= 10; // Stale session
    }

    // Final Classification
    let status: 'human' | 'bot' | 'uncertain' = 'uncertain';
    if (score > 65) status = 'human';
    else if (score < 40) status = 'bot';

    console.log(`[Sentinel] Classification: Score=${score}, Status=${status}`);
    return { status, score: Math.max(-100, Math.min(100, score)) };
  };

  // API Endpoints
  app.post("/api/verify", (req, res) => {
    const signals = req.body;
    const result = classifyBehavior(signals);
    res.json(result);
  });

  app.post("/api/challenge-verify", (req, res) => {
    // Verify the manual fallback challenge (e.g. slider position)
    const { challengeResult } = req.body;
    if (challengeResult === 'success') {
      res.json({ status: 'human', score: 100 });
    } else {
      res.json({ status: 'bot', score: 0 });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sentinel Server running on http://localhost:${PORT}`);
  });
}

startServer();
