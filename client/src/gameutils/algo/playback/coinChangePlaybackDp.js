/**
 * coinChangePlaybackDp.js
 * เลน Animation แบบ DP (Spreadsheet Array 1D / Top-Down)
 */

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
    const { speed = 1.0 } = options;
    const baseDelay = 100 / speed;

    if (!scene || !scene.coinChange || !trace || trace.length === 0) {
        console.warn('⚠️ [coinChangePlayback] No scene.coinChange or trace');
        return;
    }

    // Guard against destroyed scene (causes drawImage null error)
    if (!scene.sys || scene.sys.isDestroyed || !scene.add || !scene.sys.canvas) {
        console.warn('⚠️ [coinChangePlayback] Scene is destroyed or canvas is null');
        return;
    }


    const warriors = scene.coinChange.warriors || [];
    const targetAmount = scene.levelData?.coin_change_data?.monster_power || 0;
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    let statusText, detailText;
    try {
        statusText = scene.add.text(
            400, 750,
            'สร้างกระดาน DP Spreadsheet (1D Array)',
            { fontSize: '24px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center' }
        ).setOrigin(0.5).setDepth(20);

        detailText = scene.add.text(
            400, 780,
            'เตรียมตาราง dp[amount]...',
            { fontSize: '18px', color: '#FFFFFF', fontStyle: 'bold', stroke: '#000', strokeThickness: 3, align: 'center' }
        ).setOrigin(0.5).setDepth(20);
    } catch (err) {
        console.warn('⚠️ [coinChangePlayback] Failed to create text objects (scene canvas may be null):', err.message);
        return;
    }

    // ==========================================
    // UI: DP Table Array (Spreadsheet)
    // ==========================================
    // ออกแบบให้เป็นช่อง 4เหลี่ยมติดๆ กัน เหมือนตาราง Excel 1 แถวยาวๆ (เลี้ยวโค้งได้ถ้าเกิน)
    const cols = 12;
    const cellW = 55;
    const cellH = 50;
    const paddingX = 400 - ((Math.min(targetAmount + 1, cols) * cellW) / 2) + (cellW / 2);
    const startY = 340; // ย้ายลงมาตรงกลางจอ ไม่ให้ทับจุดด้านบน

    const cells = [];

    // สร้างตาราง
    for (let i = 0; i <= targetAmount; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const cx = paddingX + (c * cellW);
        const cy = startY + (r * (cellH + 40)); // เว้นที่ให้ลูกศรโยง

        // พื้นหลังช่อง
        const bg = scene.add.rectangle(cx, cy, cellW, cellH, 0x111111, 0.9)
            .setStrokeStyle(2, 0x555555).setDepth(10);

        // ตัวเลข Index กำกับบนหัว (โชว์จำนวนเลือด Amount)
        scene.add.text(cx, cy - (cellH / 2) - 10, i.toString(), {
            fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);

        // ค่าในช่องเริ่มต้นที่ ∞ ยกเว้นช่อง 0
        const textVal = scene.add.text(cx, cy, i === 0 ? '0' : '∞', {
            fontSize: i === 0 ? '24px' : '30px', color: i === 0 ? '#00FF00' : '#FFFFFF', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(11);

        cells.push({ bg, text: textVal, cx, cy, minCoins: i === 0 ? 0 : 999999, combo: [] });
    }

    // Pointer สำหรับชี้ Amount ปัจจุบัน (Outer Loop)
    const pointerDest = scene.add.rectangle(0, 0, cellW + 4, cellH + 4, 0x000000, 0)
        .setStrokeStyle(4, 0xFFFF00).setDepth(15).setVisible(false);

    // Pointer สำหรับชี้ข้อมูลเก่าที่คำนวณแล้ว (Inner Loop)
    const pointerSrc = scene.add.rectangle(0, 0, cellW, cellH, 0x000000, 0)
        .setStrokeStyle(3, 0x00FFFF).setDepth(14).setVisible(false);

    // เส้นลูกศร (Graphics)
    const lineGraphics = scene.add.graphics({ lineStyle: { width: 3, color: 0x00FFFF, alpha: 0.8 } }).setDepth(13);

    let currentAmount = 0;

    // Helper หารูปนักรบ
    const getWarriorOriginalSprite = (power) => {
        const numPower = Number(power);
        const w = warriors.find(war => war.power === numPower);
        return w ? w.powerSquare : null;
    };

    // 2. ลุยรัน Trace เติมตาราง
    for (let i = 0; i < trace.length; i++) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;
        const step = trace[i];

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
            scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / speed, onComplete: () => flash.destroy() });

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

                const startX = pointerDest.x;
                const startY = pointerDest.y - (cellH / 2);
                const endX = prevCell.cx;
                const endY = prevCell.cy - (cellH / 2);

                // วาดเส้นโค้งผ่าน Control Point
                const ctrlX = (startX + endX) / 2;
                const ctrlY = Math.min(startY, endY) - 40;

                const curve = new Phaser.Curves.QuadraticBezier(
                    new Phaser.Math.Vector2(startX, startY),
                    new Phaser.Math.Vector2(ctrlX, ctrlY),
                    new Phaser.Math.Vector2(endX, endY)
                );

                curve.draw(lineGraphics);

                // ปลายลูกศร
                const angle = Phaser.Math.Angle.Between(ctrlX, ctrlY, endX, endY);
                const arrowLength = 10;
                lineGraphics.beginPath();
                lineGraphics.moveTo(endX, endY);
                lineGraphics.lineTo(endX - arrowLength * Math.cos(angle - Math.PI / 6), endY - arrowLength * Math.sin(angle - Math.PI / 6));
                lineGraphics.moveTo(endX, endY);
                lineGraphics.lineTo(endX - arrowLength * Math.cos(angle + Math.PI / 6), endY - arrowLength * Math.sin(angle + Math.PI / 6));
                lineGraphics.strokePath();

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
                scene.tweens.add({ targets: c.bg, scaleX: 1.15, scaleY: 1.15, yoyo: true, duration: 300 / speed });
                scene.tweens.add({ targets: c.text, scale: 1.5, yoyo: true, duration: 300 / speed });

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
        scene.tweens.add({ targets: finalCell.bg, scaleX: 1.2, scaleY: 1.2, yoyo: true, repeat: -1, duration: 600 / speed });

        await sleep(baseDelay * 1.5);

        // Spawn ตัวละครมาเข้าแถดกลางจอ เรียงหน้ากระดานไปโจมตีบอส
        const centerSpawnY = startY + (Math.ceil((targetAmount + 1) / cols) * (cellH + 40)) + 60;
        const totalCoins = finalCell.combo.length;
        const spacing = 50;
        const startHeroX = 400 - ((totalCoins * spacing) / 2) + (spacing / 2);

        statusText.setText('ระดมกำลังพลเพื่อปฏิบัติการ');

        for (let idx = 0; idx < finalCell.combo.length; idx++) {
            const coinPower = finalCell.combo[idx];
            const origSprite = getWarriorOriginalSprite(coinPower);
            if (origSprite) {
                const px = startHeroX + (idx * spacing);
                const py = centerSpawnY;

                // สร้างร่างเงาและให้ซูมเข้าที่ — ขนาดใหญ่ขึ้นเป็น 80x80
                const ghost = scene.add.sprite(finalCell.cx, finalCell.cy, origSprite.texture.key)
                    .setDisplaySize(80, 80).setDepth(30).setAlpha(0);
                if (origSprite.frame && origSprite.frame.name) ghost.setFrame(origSprite.frame.name);

                // ตัวเลขพลัง — อยู่เหนือตัวละคร
                const powerLabel = scene.add.text(px, py - 55, coinPower.toString(), {
                    fontSize: '22px', color: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
                }).setOrigin(0.5).setDepth(31).setAlpha(0);

                scene.tweens.add({
                    targets: ghost,
                    alpha: 1, x: px, y: py,
                    duration: 800 / speed,
                    ease: 'Power2',
                    onComplete: () => {
                        // โดดขย่มฉลองชัยชนะ (ตัวละครเท่านั้น)
                        scene.tweens.add({
                            targets: ghost, y: '-=15',
                            yoyo: true, repeat: -1, duration: 350
                        });
                    }
                });

                // ตัวเลข fade in แยกต่างหาก ตำแหน่งคงที่เหนือตัวละคร
                scene.tweens.add({
                    targets: powerLabel,
                    alpha: 1,
                    duration: 500 / speed,
                    delay: 400 / speed
                });

                await sleep(150 / speed); // หน่วงนิดนึงให้ออกมาทีละตัว
            }
        }

    } else {
        statusText.setText(`ตารางประเมินเสร็จสิ้น ไม่พบวิธีการใด (ผลลัพธ์ ∞)`);
        statusText.setColor('#FF5555');
        detailText.setText('');
    }

}

/**
 * Display Mode 3: แบบตาราง DP Memoization (Array)
 * แสดงตาราง อาเรย์ `memo[0...W]` และกระบวนการเติมค่าลงตาราง (Top-Down)
 */
// async function playDpTopDownDisplay(scene, trace, options) {
//     const { speed = 1.0 } = options;
//     const baseDelay = 1000 / speed;

//     if (!scene || !scene.coinChange || !trace || trace.length === 0) {
//         console.warn('⚠️ [coinChangePlayback] No scene.coinChange or trace');
//         return;
//     }


//     const warriors = scene.coinChange.warriors;
//     const targetAmount = scene.levelData?.coin_change_data?.monster_power || 32;
//     const sleep = (ms) => new Promise(res => setTimeout(res, ms));

//     const statusText = scene.add.text(
//         400, 30,
//         'เริ่มสร้างตาราง Memoization (Top-Down)',
//         { fontSize: '24px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center' }
//     ).setOrigin(0.5).setDepth(20);

//     // ==========================================
//     // UI: DP Table (Array 0 ถึง targetAmount)
//     // ==========================================
//     const cols = 16;
//     const cellW = 45;
//     const cellH = 45;
//     const paddingX = 400 - ((Math.min(targetAmount + 1, cols) * cellW) / 2) + (cellW / 2);
//     const startY = 120;

//     const cells = [];

//     // สร้างตาราง
//     for (let i = 0; i <= targetAmount; i++) {
//         const r = Math.floor(i / cols);
//         const c = i % cols;
//         const cx = paddingX + (c * cellW);
//         const cy = startY + (r * (cellH + 30));

//         const bg = scene.add.rectangle(cx, cy, cellW - 4, cellH - 4, 0x222222, 0.8)
//             .setStrokeStyle(2, 0x555555).setDepth(10);

//         scene.add.text(cx, cy - (cellH / 2) - 12, i.toString(), {
//             fontSize: '14px', color: '#CCCCCC', fontStyle: 'bold'
//         }).setOrigin(0.5).setDepth(11);

//         const text = scene.add.text(cx, cy, '-', {
//             fontSize: '18px', color: '#FFFFFF', fontStyle: 'bold'
//         }).setOrigin(0.5).setDepth(11);

//         cells.push({ bg, text, cx, cy, state: 'empty' });
//     }

//     // สร้างกล่องไฮไลต์ตัววิ่ง (Pointer ว่ากำลังพิจารณา amount ไหนอยู่)
//     const pointer = scene.add.rectangle(0, 0, cellW, cellH, 0x000000, 0)
//         .setStrokeStyle(4, 0x00FFFF).setDepth(15).setVisible(false);

//     let currentAmount = targetAmount;
//     let callStack = [targetAmount];

//     for (let i = 0; i < trace.length; i++) {
//         const step = trace[i];

//         switch (step.action) {
//             case 'consider_coin': {
//                 const idx = step.coin;
//                 if (idx >= 0 && idx < warriors.length) {
//                     const w = warriors[idx];
//                     statusText.setText(`💡 พิจารณาเหรียญ [พลัง ${w.power}] สำหรับเลือด ${currentAmount}`);
//                     statusText.setColor('#FFFF00');

//                     const flash = scene.add.rectangle(w.x, w.y, 60, 60, 0xFFA500, 0.6).setDepth(12);
//                     scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / speed, onComplete: () => flash.destroy() });

//                     const nextAmount = currentAmount - w.power;
//                     if (nextAmount >= 0) {
//                         const targetCell = cells[nextAmount];
//                         const line = scene.add.line(0, 0, pointer.x, pointer.y, targetCell.cx, targetCell.cy, 0xFFA500, 0.5).setOrigin(0, 0).setDepth(9);
//                         scene.tweens.add({ targets: line, alpha: 0, duration: 600 / speed, onComplete: () => line.destroy() });
//                     } else {
//                         statusText.setText(`💡 พิจารณาเหรียญ [พลัง ${w.power}] -> เกินหลอดเลือด ข้าม!`);
//                         statusText.setColor('#FF5555');
//                     }
//                 }
//                 await sleep(baseDelay * 0.6);
//                 break;
//             }

//             case 'select_coin': {
//                 const idx = step.coin;
//                 if (idx < 0 || idx >= warriors.length) break;
//                 const w = warriors[idx];
//                 const nextAmount = currentAmount - w.power;

//                 if (nextAmount >= 0) {
//                     statusText.setText(`⚔️ หยิบลองเหรียญ [พลัง ${w.power}] -> เลือดเหลือ ${nextAmount}`);
//                     statusText.setColor('#00FFFF');

//                     callStack.push(nextAmount);
//                     currentAmount = nextAmount;
//                     const c = cells[currentAmount];

//                     pointer.setVisible(true);
//                     scene.tweens.add({ targets: pointer, x: c.cx, y: c.cy, duration: 400 / speed, ease: 'Power2' });
//                 }

//                 await sleep(baseDelay);
//                 break;
//             }

//             case 'remove_coin': {
//                 if (callStack.length > 1) {
//                     callStack.pop();
//                     currentAmount = callStack[callStack.length - 1];
//                     const c = cells[currentAmount];

//                     statusText.setText(`🔙 กลับมาที่เลือด ${currentAmount} เพื่อลองเหรียญถัดไป...`);
//                     statusText.setColor('#FFA500');

//                     if (c) {
//                         scene.tweens.add({ targets: pointer, x: c.cx, y: c.cy, duration: 400 / speed, ease: 'Power2' });
//                     }
//                 }

//                 await sleep(baseDelay * 0.8);
//                 break;
//             }

//             case 'memo_hit': {
//                 const amount = step.amount;
//                 statusText.setText(`🌟 [Memo Hit] เลือด ${amount} เคยคำนวณแล้ว ข้ามเลย!`);
//                 statusText.setColor('#FFD700');

//                 if (amount >= 0 && amount <= targetAmount) {
//                     const c = cells[amount];
//                     c.bg.setStrokeStyle(4, 0xFFD700);
//                     scene.tweens.add({ targets: c.bg, scaleX: 1.2, scaleY: 1.2, yoyo: true, duration: 400 / speed });

//                     const hitText = scene.add.text(c.cx, c.cy, 'HIT!', { fontSize: '16px', color: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5).setDepth(25);
//                     scene.tweens.add({ targets: hitText, y: c.cy - 30, alpha: 0, duration: 800 / speed, onComplete: () => hitText.destroy() });
//                 }

//                 await sleep(baseDelay * 1.5);
//                 break;
//             }

//             case 'coin_decision': {
//                 statusText.setText(`📝 สรุปค่า Memo[${currentAmount}] ลงตาราง`);
//                 statusText.setColor('#00FF00');

//                 if (currentAmount >= 0 && currentAmount <= targetAmount) {
//                     const c = cells[currentAmount];
//                     c.bg.setFillStyle(0x006600, 0.9);
//                     c.bg.setStrokeStyle(2, 0x00FF00);
//                     c.text.setText('✓');
//                     c.text.setColor('#00FF00');
//                 }
//                 await sleep(baseDelay);
//                 break;
//             }
//         }
//     }

//     pointer.setVisible(false);
//     statusText.setText('✅ เติมตาราง Memoization สำเร็จทุกช่อง!');
//     statusText.setColor('#00FFFF');
// }
