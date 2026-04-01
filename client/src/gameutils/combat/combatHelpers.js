// Combat Helper Functions

export function getDirectionFromAngle(angle) {
  let deg = Phaser.Math.RadToDeg(angle);
  deg = Phaser.Math.Angle.WrapDegrees(deg);

  if (deg >= 45 && deg < 135) return 'down';
  if (deg >= -45 && deg < 45) return 'right';
  if (deg >= -135 && deg < -45) return 'up';
  return 'left';
}

export function showFloatingText(scene, x, y, text, color = '#ff0000') {
  const damageText = scene.add.text(x, y - 50, text, {
    fontSize: '36px', // Bigger font
    fontStyle: 'bold',
    color: color,
    stroke: '#ffffff',
    strokeThickness: 4,
    shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, stroke: true, fill: true }
  });

  damageText.setDepth(100);

  scene.tweens.add({
    targets: damageText,
    y: y - 80, // Float higher
    alpha: { from: 1, to: 0 },
    duration: 1200, // Slightly longer
    ease: 'Power2.easeOut',
    onComplete: () => {
      damageText.destroy();
    }
  });

  // Add a slight scale pop effect
  scene.tweens.add({
    targets: damageText,
    scaleX: { from: 0.5, to: 1.5 },
    scaleY: { from: 0.5, to: 1.5 },
    duration: 200,
    yoyo: true,
    ease: 'Back.easeOut'
  });
}
