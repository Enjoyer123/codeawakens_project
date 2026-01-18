// src/pages/user/LevelGame.jsx
import React from "react";
import GameCore from '../../components/playgame/GameCore';

const LevelGame = () => {
  console.log('🔍 [LevelGame] Component render (Wrapper)');
  // GameCore handles logic, params (levelId), and renders the game UI
  // By default isPreview is false, so it runs in "Play Mode" (saves progress)
  return <GameCore />;
};

export default LevelGame;