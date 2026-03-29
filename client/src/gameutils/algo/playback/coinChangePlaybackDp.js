/**
 * coinChangePlaybackDp.js
 * เลน Animation แบบ DP (Spreadsheet Array 1D / Top-Down)
 */
import { animationController, createTraceBuffer } from './AnimationController';

export async function playCoinChangeDpAnimation(scene, trace, options = {}) {
    // เปลยนไปใช Top-Down ไดถาเพม options.topDown
    return playDpBottomUpSpreadsheetDisplay(scene, trace, options);
}


/**
 * Display Mode 4: ตาราง Spreadsheet แบบ 1D Array (Standard DP)
 * แสดงตาราง dp[0...target] เปลี่ยนค่าตัวเลข อัปเดตตาราง และชี้ลูกศรโยงความสัมพันธ์
 * ตอนจบ ค่อยเรียกตัวละครที่ถูกต้องออกมาแสดงผล
 */
export async function playDpBottomUpSpreadsheetDisplay(scene, trace, options) {
    const baseDelay = 100;

    if (!scene || !scene.coinChange || !trace) {
        console.warn('⚠️ [coinChangePlayback] No scene.coinChange or trace');
        return;
    }

    // Guard against destroyed scene (causes drawImage null error)
    if (!scene.sys || scene.sys.isDestroyed || !scene.add || !scene.sys.canvas) {
        console.warn('⚠️ [coinChangePlayback] Scene is destroyed or canvas is null');
        return;
    }


    const warriors = scene.coinChange.warriors || [];
    const targetAmount = scene.levelData?.algo_data?.payload?.monster_power || 0;
    const sleep = (ms) => animationController.sleep(ms);

    const canvasW = scene.scale.width || 1200;
    const canvasH = scene.scale.height || 920;
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;

    const cellW = 55, cellH = 50, cols = 12;

    // คำนวณความกว้าง/สูงของตารางจริงๆ ที่ต้องวาด
    const displayCols = Math.min(targetAmount + 1, cols);
    const tableWidth = displayCols * cellW;
    const displayRows = Math.ceil((targetAmount + 1) / cols);
    const tableHeight = displayRows * cellH;

    // Center Dynamic (x, y)
    const paddingX = centerX - (tableWidth / 2) + (cellW / 2);
    const startY = centerY - (tableHeight / 2) + 40; // ดันลงมานิดนึงเพื่อให้พอดีขอบจอบน

    let statusText, detailText;
    try {
        statusText = scene.add.text(
            centerX, startY - 90,
            'สร้างกระดาน DP Spreadsheet (1D Array)',
            { fontSize: '24px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center' }
        ).setOrigin(0.5).setDepth(20);

        detailText = scene.add.text(
            centerX, startY - 50,
            'เตรียมตาราง dp[amount]...',
            { fontSize: '18px', color: '#FFFFFF', fontStyle: 'bold', stroke: '#000', strokeThickness: 3, align: 'center' }
        ).setOrigin(0.5).setDepth(20);
    } catch (err) {
        console.warn('⚠️ [coinChangePlayback] Failed to create text objects (scene canvas may be null):', err.message);
        return;
    }

    const { cells, pointerDest, pointerSrc, lineGraphics } = create1DDpTable(scene, targetAmount, cols, paddingX, startY, cellW, cellH);

    let currentAmount = 0;

    // Helper หารูปนักรบ
    const getWarriorOriginalSprite = (power) => {
        const numPower = Number(power);
        const w = warriors.find(war => war.power === numPower);
        return w ? w.powerSquare : null;
    };

    // 2. ลุยรัน Trace เติมตาราง
    for await (const step of createTraceBuffer(trace)) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;

        if (step.action === 'memo_hit') { // ถือเป็นสัญญาณเริ่ม Outer Loop สำหรับ Amount นีั
            currentAmount = step.amount;
            if (currentAmount <= targetAmount && currentAmount >= 0) {
                const c = cells[currentAmount];
                pointerDest.setVisible(true).setPosition(c.cx, c.cy);
                statusText.setText(`ค้นหาคำตอบสำหรับกระดานช่อง dp[${currentAmount}]`);
                statusText.setColor('#FFFF00');
                detailText.setText('เริ่มประเมินกำลังพลแต่ละรูปแบบ...');
                lineGraphics.clear();
                await sleep(baseDelay * 0.5);
            }
        }
        else if (step.action === 'consider_coin') {
            const w = warriors[step.coin];
            if (!w) continue;

            detailText.setText(`พิจารณากำลังพลหน่วยที่สร้างพลัง [${w.power}]`);

            // Flash on warrior sprite UI
            const flash = scene.add.rectangle(w.x, w.y, 60, 60, 0x00FFFF, 0.6).setDepth(12);
            scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });

            const prevAmount = currentAmount - w.power;

            if (prevAmount >= 0) {
                const prevCell = cells[prevAmount];
                pointerSrc.setVisible(true).setPosition(prevCell.cx, prevCell.cy);

                if (prevCell.minCoins === 999999) {
                    detailText.setText(`อ้างอิง dp[${prevAmount}] แต่ไม่มีเส้นทางที่เป็นไปได้ (∞)`);
                } else {
                    const expectedVal = prevCell.minCoins + 1;
                    detailText.setText(`สมการ: dp[${currentAmount}] = min(ค่าเริ่ม, dp[${prevAmount}] + 1) -> เปลี่ยนแปลงเป็น ${expectedVal}`);
                }

                // วาดเส้นโค้งเชื่อมโยงช่อง (โยงขึ้นข้างบนเพื่อไม่เกะกะข้อความล่าง)
                lineGraphics.clear();
                drawCurvedArrow(scene, lineGraphics, pointerDest.x, pointerDest.y, prevCell.cx, prevCell.cy, cellH);

            } else {
                pointerSrc.setVisible(false);
                lineGraphics.clear();
                detailText.setText(`กำลังพล [${w.power}]: สร้างพลังเกินความจุกระดานตาราง (ข้าม)`);
            }
            await sleep(baseDelay * 0.8);
        }
        else if (step.action === 'dp_update') {
            const { amount, minCoins, coinUsed } = step;
            if (amount <= targetAmount) {
                const c = cells[amount];
                c.minCoins = minCoins;

                // คำนวณรวบรวม Combo เก็บเงียบๆ ใน Data ก่อน
                const prevAmount = amount - coinUsed;
                if (prevAmount >= 0) {
                    c.combo = [...cells[prevAmount].combo, coinUsed];
                } else {
                    c.combo = [coinUsed];
                }

                detailText.setText(`อัปเดตตารางค่าใหม่! dp[${amount}] = ${minCoins}`);
                c.text.setText(minCoins.toString());
                c.text.setColor('#00FF00');

                // Flash สีเขียวเด้ง
                c.bg.setStrokeStyle(3, 0x00FF00);
                scene.tweens.add({ targets: c.bg, scaleX: 1.15, scaleY: 1.15, yoyo: true, duration: 300 / animationController.speed });
                scene.tweens.add({ targets: c.text, scale: 1.5, yoyo: true, duration: 300 / animationController.speed });

                await sleep(baseDelay * 1.2);

                c.bg.setStrokeStyle(2, 0x555555);
                c.text.setColor('#FFFFFF');
            }
        }
    }

    pointerDest.setVisible(false);
    pointerSrc.setVisible(false);
    lineGraphics.clear();

    // 3. ฉากจบบริบูรณ์ ดึง Combo มาแสดงให้จับต้องได้
    const finalCell = cells[targetAmount];
    if (finalCell && finalCell.minCoins !== 999999) {
        statusText.setText(`ตารางการประเมินเสร็จสิ้น เป้าหมายใช้กำลังพลอย่างน้อย ${finalCell.minCoins} ยูนิต`);
        statusText.setColor('#00FF00');
        detailText.setText('ตรวจพบคำตอบที่ดีที่สุดจากตาราง!');
        finalCell.bg.setStrokeStyle(4, 0x00FF00);
        scene.tweens.add({ targets: finalCell.bg, scaleX: 1.2, scaleY: 1.2, yoyo: true, repeat: -1, duration: 600 / animationController.speed });

        // --- NEW: Visual Traceback (แกะรอยกลับ 1D Array) ---
        statusText.setText('กำลังแกะรอย (Traceback) บนตารางหาว่าใช้นักรบหน่วยใดบ้าง...');
        detailText.setText('');
        await sleep(baseDelay);

        let currAmt = targetAmount;
        const finalCoins = [];

        // Pointer สีเขียวสำหรับเดินถอยหลัง
        const tbPointer = scene.add.rectangle(0, 0, cellW + 4, cellH + 4, 0x000000, 0)
            .setStrokeStyle(4, 0x00FF00).setDepth(20).setVisible(true);
        tbPointer.setPosition(cells[currAmt].cx, cells[currAmt].cy);

        while (currAmt > 0) {
            const currentCell = cells[currAmt];
            currentCell.bg.setFillStyle(0x006600, 0.8); // ทาสีเขียวทับช่อง

            let chosenCoin = 0;
            let nextAmt = 0;

            // ค้นหานักรบที่ทำให้สมการตารางเป็นจริง (dp[curr] == dp[curr - coin] + 1)
            for (let i = 0; i < warriors.length; i++) {
                const w = warriors[i];
                const prev = currAmt - w.power;
                if (prev >= 0) {
                    // ถ้าค่าของช่องปัจจุบัน เกิดจาก (ค่าของช่องก่อนหน้า + 1)
                    if (cells[currAmt].minCoins === cells[prev].minCoins + 1) {
                        chosenCoin = w.power;
                        nextAmt = prev;
                        break; // เจอแล้วหยุดหา!
                    }
                }
            }

            if (chosenCoin > 0) {
                finalCoins.push(chosenCoin);
                detailText.setText(`dp[${currAmt}] เกิดจากการหยิบกำลังพล [${chosenCoin}] แล้วย้อนไปดูคำตอบของ dp[${nextAmt}]`);

                // วาดลูกศรโค้งถอยหลัง
                lineGraphics.clear();
                drawCurvedArrow(scene, lineGraphics, tbPointer.x, tbPointer.y, cells[nextAmt].cx, cells[nextAmt].cy, cellH, 50, 12);

                await sleep(baseDelay * 2.0); // อ่านข้อความให้ทัน

                currAmt = nextAmt;
                tbPointer.setPosition(cells[currAmt].cx, cells[currAmt].cy); // กระโดดย้อนดื้อๆ เลย
                scene.tweens.add({ targets: tbPointer, scaleX: 1.2, scaleY: 1.2, yoyo: true, duration: 150 });
                await sleep(baseDelay * 0.5);
            } else {
                break; // ป้องกัน infinite loop กรณีคำนวณพลาด
            }
        }

        cells[0].bg.setFillStyle(0x006600, 0.8);
        tbPointer.setVisible(false);
        lineGraphics.clear();

        statusText.setText('ระดมกำลังพลปฏิบัติการ!');
        detailText.setText('');
        await sleep(baseDelay);

        const totalCoins = finalCoins.length;
        const spacing = 180;
        const startHeroX = centerX - ((totalCoins * spacing) / 2) + (spacing / 2);
        const centerSpawnY = startY + (Math.ceil((targetAmount + 1) / cols) * (cellH + 40)) + 60;

        for (let idx = 0; idx < finalCoins.length; idx++) {
            const coinPower = finalCoins[idx];
            const origSprite = getWarriorOriginalSprite(coinPower);
            if (origSprite) {
                const px = startHeroX + (idx * spacing);
                const py = centerSpawnY;

                // หานักรบฝั่งซ้าย (ตัวออริจินัลในตาราง Setup) เพื่อดึงพิกัด (w.x, w.y)
                const originalSetupWarrior = warriors.find(war => war.power === Number(coinPower));
                const spawnX = originalSetupWarrior ? originalSetupWarrior.x : finalCell.cx;
                const spawnY = originalSetupWarrior ? originalSetupWarrior.y : finalCell.cy;

                // สร้างร่างเงาเริ่มจากตำแหน่งฝั่งซ้ายเลย
                const ghost = scene.add.sprite(spawnX, spawnY, origSprite.texture.key)
                    .setDisplaySize(80, 80).setDepth(30).setAlpha(0);
                if (origSprite.frame && origSprite.frame.name) ghost.setFrame(origSprite.frame.name);

                // ตัวเลขพลัง — เริ่มจากเป้าหมายที่เดียวกัน (spawnY + 45) เพื่อความต่อเนื่อง
                const powerLabel = scene.add.text(spawnX, spawnY + 45, `ATK: ${coinPower}`, {
                    fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
                }).setOrigin(0.5).setDepth(31).setAlpha(0);

                scene.tweens.add({
                    targets: ghost,
                    alpha: 1, x: px, y: py,
                    duration: 800 / animationController.speed,
                    ease: 'Power2',
                    onComplete: () => {
                        // โดดขย่มฉลองชัยชนะ (ตัวละครเท่านั้น)
                        scene.tweens.add({
                            targets: ghost, y: '-=15',
                            yoyo: true, repeat: -1, duration: 350
                        });
                    }
                });

                // ตัวเลข fade in พร้อมกัน แล้วขยับไปอยู่แถวเดียวกับผี (+45) ให้เหมือน Subset Sum
                scene.tweens.add({
                    targets: powerLabel,
                    alpha: 1, x: px, y: py + 45,
                    duration: 800 / animationController.speed,
                    ease: 'Power2'
                });

                await sleep(150); // หน่วงนิดนึงให้ออกมาทีละตัว
            }
        }

    } else {
        statusText.setText(`ตารางประเมินเสร็จสิ้น ไม่พบวิธีการใด (ผลลัพธ์ ∞)`);
        statusText.setColor('#FF5555');
        detailText.setText('');
    }

}

// ============================================================================
// Local Helper Functions
// ==========================================

function create1DDpTable(scene, targetAmount, cols, paddingX, startY, cellW, cellH) {
    const cells = [];

    for (let i = 0; i <= targetAmount; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const cx = paddingX + (c * cellW);
        const cy = startY + (r * (cellH + 40));

        const bg = scene.add.rectangle(cx, cy, cellW, cellH, 0x111111, 0.9)
            .setStrokeStyle(2, 0x555555).setDepth(10);

        scene.add.text(cx, cy - (cellH / 2) - 10, i.toString(), {
            fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);

        const textVal = scene.add.text(cx, cy, i === 0 ? '0' : '∞', {
            fontSize: i === 0 ? '24px' : '30px', color: i === 0 ? '#00FF00' : '#FFFFFF', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(11);

        cells.push({ bg, text: textVal, cx, cy, minCoins: i === 0 ? 0 : 999999, combo: [] });
    }

    const pointerDest = scene.add.rectangle(0, 0, cellW + 4, cellH + 4, 0x000000, 0)
        .setStrokeStyle(4, 0xFFFF00).setDepth(15).setVisible(false);

    const pointerSrc = scene.add.rectangle(0, 0, cellW, cellH, 0x000000, 0)
        .setStrokeStyle(3, 0x00FFFF).setDepth(14).setVisible(false);

    const lineGraphics = scene.add.graphics({ lineStyle: { width: 3, color: 0x00FFFF, alpha: 0.8 } }).setDepth(13);

    return { cells, pointerDest, pointerSrc, lineGraphics };
}

function drawCurvedArrow(scene, lineGraphics, ptrX, ptrY, destX, destY, cellH, curveHeight = 40, arrowLength = 10) {
    const startX = ptrX;
    const startY = ptrY - (cellH / 2);
    const endX = destX;
    const endY = destY - (cellH / 2);

    const ctrlX = (startX + endX) / 2;
    const ctrlY = Math.min(startY, endY) - curveHeight;

    const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(startX, startY),
        new Phaser.Math.Vector2(ctrlX, ctrlY),
        new Phaser.Math.Vector2(endX, endY)
    );
    curve.draw(lineGraphics);

    const angle = Phaser.Math.Angle.Between(ctrlX, ctrlY, endX, endY);
    lineGraphics.beginPath();
    lineGraphics.moveTo(endX, endY);
    lineGraphics.lineTo(endX - arrowLength * Math.cos(angle - Math.PI / 6), endY - arrowLength * Math.sin(angle - Math.PI / 6));
    lineGraphics.moveTo(endX, endY);
    lineGraphics.lineTo(endX - arrowLength * Math.cos(angle + Math.PI / 6), endY - arrowLength * Math.sin(angle + Math.PI / 6));
    lineGraphics.strokePath();
}