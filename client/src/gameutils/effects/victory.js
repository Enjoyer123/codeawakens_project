// Phaser Game Victory Effects Functions
import Phaser from "phaser";

// Function to create rescue effect
export function createRescueEffect(scene) {
  const x = Phaser.Math.Between(100, scene.cameras.main.width - 100);
  const y = Phaser.Math.Between(100, scene.cameras.main.height - 100);

  // สร้างเอฟเฟกต์หัวใจสีเขียว
  for (let i = 0; i < 8; i++) {
    const heart = scene.add.text(x, y, '💚', {
      fontSize: '24px'
    });
    heart.setDepth(199);
    heart.setScrollFactor(0);

    const angle = (i / 8) * Math.PI * 2;
    const distance = Phaser.Math.Between(60, 120);

    scene.tweens.add({
      targets: heart,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1200,
      ease: 'Power2.easeOut',
      onComplete: () => heart.destroy()
    });
  }

  // สร้างเอฟเฟกต์ดาวสีเขียว
  for (let i = 0; i < 6; i++) {
    const star = scene.add.text(x, y, '⭐', {
      fontSize: '20px'
    });
    star.setDepth(199);
    star.setScrollFactor(0);

    const angle = (i / 6) * Math.PI * 2;
    const distance = Phaser.Math.Between(40, 80);

    scene.tweens.add({
      targets: star,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => star.destroy()
    });
  }
}

// Function to create firework effect
export function createFirework(scene) {
  const x = Phaser.Math.Between(100, scene.cameras.main.width - 100);
  const y = Phaser.Math.Between(100, scene.cameras.main.height - 100);

  const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
  const color = Phaser.Utils.Array.GetRandom(colors);

  for (let i = 0; i < 12; i++) {
    const particle = scene.add.circle(x, y, 3, color);
    particle.setDepth(199);
    particle.setScrollFactor(0);

    const angle = (i / 12) * Math.PI * 2;
    const distance = Phaser.Math.Between(50, 100);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      duration: 1000,
      onComplete: () => particle.destroy()
    });
  }
}

