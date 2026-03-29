/**
 * coinChangePlaybackGreedy.js
 * เล่น Animation แบบ Greedy (หยิบเหรียญที่ใหญ่ที่สุดที่ใส่ได้เสมอ)
 */
import { animationController, createTraceBuffer } from './AnimationController';
import { playSound } from '../../sound/soundManager';

export async function playCoinChangeGreedyAnimation(scene, trace, options = {}) {
    const baseDelay = 1000;

    if (!scene || !scene.coinChange || !trace) {
        console.warn('⚠️ [coinChangePlaybackGreedy] No scene.coinChange or trace');
        return;
    }

    const warriors = scene.coinChange.warriors;
    const targetAmount = scene.levelData?.algo_data?.payload?.monster_power || 0;
    const sleep = (ms) => animationController.sleep(ms);
    const canvasW = scene.scale.width || 1200;
    const canvasH = scene.scale.height || 920;

    const statusText = scene.add.text(
        canvasW / 2, 400,
        'เริ่มการค้นหาแบบ Greedy',
        { fontSize: '26px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 5, align: 'center' }
    ).setOrigin(0.5).setDepth(20);

    // Filter หาจำนวนเหรียญที่โดนหยิบทั้งหมด เพื่อให้มาเรียงกลางจอสวยๆ
    const selectSteps = trace.filter(s => s.action === 'select_coin');
    const totalCoins = selectSteps.length;

    // คำนวณขอบเขต UI
    const paddingX = 120; // องศาความห่างที่กว้างขึ้นเพราะปรับ Scale ใหญ่
    const totalWidth = (totalCoins <= 1) ? 0 : (totalCoins - 1) * paddingX;
    const startX = (canvasW / 2) - (totalWidth / 2);
    const startY = canvasH / 2 + 50; // ให้อยู่กลางค่อนลงล่างนิดนึง

    const hpText = scene.add.text(canvasW / 2, startY - 150, `เป้าหมาย: ${targetAmount}`, {
        fontSize: '34px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(20);

    let currentX = startX;
    let currentSum = 0;

    const updateHpText = () => {
        const remain = targetAmount - currentSum;
        if (remain < 0) {
            hpText.setText(`เป้าหมาย: ล้น (-${Math.abs(remain)})`);
            hpText.setColor('#FF5555');
        } else {
            hpText.setText(`เป้าหมาย: ${remain}`);
        }
    };

    for await (const step of createTraceBuffer(trace)) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;

        if (step.action === 'select_coin') {
            const idx = step.coin;
            if (idx < 0 || idx >= warriors.length) continue;

            const w = warriors[idx];

            // กระพริบตัวตั้งต้นก่อน
            const flash = scene.add.rectangle(w.x, w.y, 80, 80, 0x00ffff, 0.7).setDepth(12);
            scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });

            // สร้าง Clone ตัวละครที่ขยายขนาด
            const tex = w.powerSquare?.texture?.key || 'bot_slime1';
            const clone = scene.add.image(w.x, w.y, tex).setDepth(15).setScale(1.6);

            // สร้าง Text Label พลังกำกับไว้บนหัว Clone
            const label = scene.add.text(w.x, w.y - 65, w.power.toString(), {
                fontSize: '28px', color: '#FFF', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
            }).setOrigin(0.5).setDepth(16);

            // Animation บินมาจัดเรียงกลางจอ
            scene.tweens.add({
                targets: clone,
                x: currentX,
                y: startY,
                duration: 600 / animationController.speed,
                ease: 'Back.easeOut',
                onStart: () => playSound('paper'),
                onComplete: () => {
                    scene.tweens.add({
                        targets: clone, y: '-=20', yoyo: true, duration: 200 / animationController.speed
                    });
                }
            });

            scene.tweens.add({
                targets: label,
                x: currentX,
                y: startY - 65,
                duration: 600 / animationController.speed,
                ease: 'Back.easeOut',
                onComplete: () => {
                    scene.tweens.add({
                        targets: label, y: '-=20', yoyo: true, duration: 200 / animationController.speed
                    });
                }
            });

            // รอช่วงลอยเข้า
            await sleep(baseDelay * 0.8);

            // อัปเดต state ตัวเลขเลือด
            currentX += paddingX;
            currentSum += w.power;

            updateHpText();
            if (currentSum > targetAmount) {
                clone.setTint(0xFF5555);
            }

            // รอคั่นเหรียญแต่ละตัวเพื่อให้คนดูตามทัน
            await sleep(baseDelay * 0.8);
        }
    }

    if (currentSum === targetAmount) {
        statusText.setText('จบการประมวลผล (สำเร็จ)').setColor('#00FF00');
    } else {
        statusText.setText('จบการประมวลผล (พลังล้น ไม่พอดี)').setColor('#FFA500');
    }
}
