/**
 * coinChangePlaybackBacktrack.js
 * เลน Animation แบบ Backtracking (Stacking Bar / Tree)
 */

export async function playCoinChangeBacktrackAnimation(scene, trace, options = {}) {
    // สลับ Display Mode อัตโนมัติ: Greedy ใช้ Character, Backtrack ใช้ Bar
    if (options.isGreedy) {
        return playCharacterDisplay(scene, trace, options);
    }
    return playBarDisplay(scene, trace, options);
}

// ============================================================================
// Display Mode 3: แบบ Character Display (เอานักรบบินไปต่อคิวตีบอส)
// ============================================================================
async function playCharacterDisplay(scene, trace, options) {
    const { speed = 1.0 } = options;
    const baseDelay = 800 / speed;

    if (!scene || !scene.coinChange || !trace || trace.length === 0) {
        console.warn('⚠️ [coinChangePlayback] No scene.coinChange or trace');
        return;
    }


    const warriors = scene.coinChange.warriors;
    const targetAmount = scene.levelData?.coin_change_data?.monster_power || 0;

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    const statusText = scene.add.text(
        400, 50,
        'เริ่มการค้นหาแบบสายข้าม (Greedy)',
        { fontSize: '24px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center' }
    ).setOrigin(0.5).setDepth(20);

    // ==========================================
    // UI: Boss HP & Position setup
    // ==========================================
    const startX = 150; // เริ่มต่อคิวจากซ้ายไปขวา
    const startY = 380; // เลื่อนให้ลงมาอยู่กลางจอ ไม่ทับกับจุดยืนข้างบน
    const paddingX = 80; // ระยะห่างแต่ละตัวที่รุมตี

    // Text: แสดง HP บอสที่เหลือ
    const hpText = scene.add.text(400, startY - 80, `พลังชีวิตเป้าหมาย: ${targetAmount}`, {
        fontSize: '28px', color: '#FFF', fontStyle: 'bold', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(20);

    const stack = [];
    let currentX = startX;
    let currentSum = 0;

    const updateHpText = () => {
        const remain = targetAmount - currentSum;
        if (remain < 0) {
            hpText.setText(`พลังรวมเกินเป้าหมาย! (ส่วนต่าง: ${Math.abs(remain)})`);
            hpText.setColor('#FF5555');
        } else if (remain === 0) {
            hpText.setText(`จัดการเป้าหมายสำเร็จ!`);
            hpText.setColor('#00FF00');
        } else {
            hpText.setText(`พลังชีวิตเป้าหมาย: ${remain}`);
            hpText.setColor('#FFFFFF');
        }
    };

    for (let i = 0; i < trace.length; i++) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;
        const step = trace[i];

        switch (step.action) {
            case 'consider_coin': {
                const idx = step.coin;
                if (idx >= 0 && idx < warriors.length) {
                    const w = warriors[idx];
                    const projectedSum = currentSum + w.power;

                    if (projectedSum > targetAmount) {
                        statusText.setText(`พิจารณา [นักรบพลัง ${w.power}]...\nพลังรวมจะเกินเป้าหมายแน่นอน`);
                        statusText.setColor('#FFA500');
                    } else {
                        statusText.setText(`พิจารณา [นักรบพลัง ${w.power}]...\nน่าจะสามารถยัดเข้ากลุ่มได้ ขอทดสอบ`);
                        statusText.setColor('#FFFF00');
                    }

                    // สร้างกรอบกระพริบที่ตัวนักรบฐาน
                    const flash = scene.add.rectangle(w.x, w.y, 60, 60, 0xFFA500, 0.8).setDepth(12);

                    // Ghost Clone ไปแสดงจุดหมาย
                    let ghost = null;
                    if (projectedSum <= targetAmount + w.power && currentSum <= targetAmount) {
                        const tex = w.powerSquare?.texture?.key || 'bot_slime1';
                        ghost = scene.add.image(currentX, startY, tex).setAlpha(0.4).setDepth(14);
                        if (projectedSum > targetAmount) {
                            ghost.setTint(0xFF0000);
                        }
                    }

                    scene.tweens.add({
                        targets: ghost ? [flash, ghost] : [flash],
                        alpha: 0,
                        duration: 800 / speed,
                        onComplete: () => {
                            flash.destroy();
                            if (ghost) ghost.destroy();
                        }
                    });
                }
                await sleep(baseDelay * 0.8);
                break;
            }

            case 'select_coin': {
                const idx = step.coin;
                if (idx < 0 || idx >= warriors.length) break;

                const w = warriors[idx];
                const remainAfter = targetAmount - (currentSum + w.power);

                if (remainAfter < 0) {
                    statusText.setText(`เลือก [นักรบพลัง ${w.power}] เข้าร่วม...\nเป้าหมายทะลุ (เกิน ${Math.abs(remainAfter)})`);
                    statusText.setColor('#FF5555');
                } else if (remainAfter === 0) {
                    statusText.setText(`เลือก [นักรบพลัง ${w.power}] เข้าร่วม...\nสำเร็จ! พิชิตเป้าหมายได้พอดี`);
                    statusText.setColor('#00FF00');
                } else {
                    statusText.setText(`เลือก [นักรบพลัง ${w.power}] เข้าร่วมสำเร็จ\n(ยังขาดอีก ${remainAfter})`);
                    statusText.setColor('#00FFFF');
                }

                // สร้าง Clone
                const tex = w.powerSquare?.texture?.key || 'bot_slime1';
                const clone = scene.add.image(w.x, w.y, tex).setDepth(15);

                // สร้างตัวเลขกำกับป้าย
                const label = scene.add.text(w.x, w.y - 30, w.power.toString(), {
                    fontSize: '20px', color: '#FFF', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
                }).setOrigin(0.5).setDepth(16);

                // Animate บินเข้าไปในตำแหน่ง
                scene.tweens.add({
                    targets: clone,
                    x: currentX,
                    y: startY,
                    duration: 400 / speed,
                    ease: 'Power2'
                });

                scene.tweens.add({
                    targets: label,
                    x: currentX,
                    y: startY - 30,
                    duration: 400 / speed,
                    ease: 'Power2'
                });

                stack.push({ clone, label, power: w.power, oriX: w.x, oriY: w.y });
                currentX += paddingX; // ขยับไปทางขวาให้ตัวต่อไปยืนคิว
                currentSum += w.power;

                updateHpText();

                if (currentSum > targetAmount) {
                    clone.setTint(0xFF5555);
                    const overFlash = scene.add.rectangle(400, startY, 600, 100, 0xFF0000, 0.4).setDepth(18);
                    scene.tweens.add({
                        targets: overFlash,
                        alpha: 0,
                        duration: 400 / speed,
                        onComplete: () => overFlash.destroy()
                    });
                }

                await sleep(baseDelay * 0.8);
                break;
            }

            case 'remove_coin': {
                const last = stack.pop();
                if (!last) break;

                statusText.setText(`ถอยกลับ (Backtrack)\nนำนักรบพลัง ${last.power} ตัวล่าสุดออก เพื่อพิจารณาเส้นทางอื่น`);
                statusText.setColor('#FFA500');

                currentX -= paddingX;
                currentSum -= last.power;

                updateHpText();

                // Animate บินกลับที่เดิมแล้วจางหาย
                scene.tweens.add({
                    targets: [last.clone, last.label],
                    x: last.oriX,
                    y: last.oriY,
                    alpha: 0,
                    scale: 0.5,
                    duration: 400 / speed,
                    ease: 'Power2',
                    onComplete: () => {
                        last.clone.destroy();
                        last.label.destroy();
                    }
                });

                await sleep(baseDelay * 0.6);
                break;
            }

            case 'memo_hit': {
                const amount = step.amount;
                if (amount <= 0) break;

                statusText.setText(`[Memo Hit] ค่าพลัง ${amount} เคยถูกประมวลผลแล้ว\nดึงผลลัพธ์จากหน่วยความจำมาใช้`);
                statusText.setColor('#FFD700');

                const hitX = currentX + (paddingX * (amount / 10)); // Approximate width flash
                const flash = scene.add.rectangle(hitX, startY, 120, 100, 0xFFD700, 0.6).setDepth(16);
                scene.tweens.add({
                    targets: flash, alpha: 0, scaleX: 1.2, scaleY: 1.2, duration: 800 / speed,
                    onComplete: () => flash.destroy()
                });

                const memoText = scene.add.text(hitX, startY, 'MEMO HIT!\nจำได้!', {
                    fontSize: '28px', color: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 6, align: 'center'
                }).setOrigin(0.5).setDepth(25);

                scene.tweens.add({
                    targets: memoText, y: startY - 40, alpha: 0, duration: 900 / speed, ease: 'Power2',
                    onComplete: () => memoText.destroy()
                });

                await sleep(baseDelay * 1.5);
                break;
            }
        }
    }

    statusText.setText('กระบวนการค้นหาเสร็จสิ้น (Backtracking)');
    statusText.setColor('#00FFFF');
}

/**
 * Display Mode 1: แบบ Stacking Bar (ต่อเลโก้ลงหลอดเลือด)
 * (รูปแบบดั้งเดิม)
 */
async function playBarDisplay(scene, trace, options) {
    const { speed = 1.0 } = options;
    const baseDelay = 1000 / speed;

    if (!scene || !scene.coinChange || !trace || trace.length === 0) {
        console.warn('⚠️ [coinChangePlayback] No scene.coinChange or trace');
        return;
    }


    const warriors = scene.coinChange.warriors;
    const targetAmount = scene.levelData?.coin_change_data?.monster_power || 0;

    // Helper
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    // UI: Status Text
    const statusText = scene.add.text(
        400, 50,
        'เริ่มการค้นหาแบบตีดะ (Backtracking)',
        { fontSize: '24px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center' }
    ).setOrigin(0.5).setDepth(20);

    // ==========================================
    // UI: Boss HP Bar (1D Grid Stacking)
    // ==========================================
    const unitWidth = 20; // 1 พลัง = กว้าง 20 px
    const barWidth = targetAmount * unitWidth;
    const barHeight = 80;
    const startX = 400 - (barWidth / 2);
    const startY = 380; // เลื่อนให้ลงมาอยู่กลางจอ ไม่ทับกับจุดยืนข้างบน

    // Slot Background (พื้นที่บอส)
    const slotBg = scene.add.rectangle(400, startY, barWidth, barHeight, 0x000000, 0.7);
    slotBg.setStrokeStyle(4, 0xFF0000);
    slotBg.setDepth(10);

    // เส้นตีตาราง (Grid Lines) สร้างความเป็นระเบียบเหมือนช่องกระดาน
    for (let i = 1; i < targetAmount; i++) {
        const lx = startX + (i * unitWidth);
        const lColor = (i % 5 === 0) ? 0xFFFFFF : 0x888888; // ขีดหลักทุกๆ 5 หน่วย
        const lAlpha = (i % 5 === 0) ? 0.6 : 0.3;
        const line = scene.add.line(0, 0, lx, startY - barHeight / 2, lx, startY + barHeight / 2, lColor, lAlpha);
        line.setOrigin(0, 0).setDepth(11);
    }

    // Text: แสดง HP บอสที่เหลือ
    const hpText = scene.add.text(400, startY - 70, `พลังชีวิตเป้าหมาย: ${targetAmount}`, {
        fontSize: '32px', color: '#FFF', fontStyle: 'bold', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(20);

    const getBlockColor = (index) => {
        const colors = [0x3498db, 0x2ecc71, 0x9b59b6, 0xf1c40f];
        return colors[index % colors.length] || 0xe74c3c;
    };

    // ตัวแปรเก็บสถานะการต่อตัว
    const stack = [];
    let currentX = startX;
    let currentSum = 0;
    let bestSolution = null; // snapshot ของ stack เมื่อเจอ solution ที่ดีที่สุด

    const updateHpText = () => {
        const remain = targetAmount - currentSum;
        if (remain < 0) {
            hpText.setText(`พลังรวมเกินเป้าหมาย! (ส่วนต่าง: ${Math.abs(remain)})`);
            hpText.setColor('#FF5555');
        } else if (remain === 0) {
            hpText.setText(`จัดการเป้าหมายสำเร็จ!`);
            hpText.setColor('#00FF00');
        } else {
            hpText.setText(`พลังชีวิตเป้าหมาย: ${remain}`);
            hpText.setColor('#FFFFFF');
        }
    };

    for (let i = 0; i < trace.length; i++) {
        const step = trace[i];

        switch (step.action) {
            case 'consider_coin': {
                const idx = step.coin;
                if (idx >= 0 && idx < warriors.length) {
                    const w = warriors[idx];
                    const blockW = w.power * unitWidth;
                    const projectedSum = currentSum + w.power;

                    if (projectedSum > targetAmount) {
                        statusText.setText(`พิจารณา [พลัง ${w.power}]...\nแต่มันน่าจะยาวเกินไปแน่ๆ!`);
                        statusText.setColor('#FFA500');
                    } else {
                        statusText.setText(`พิจารณา [พลัง ${w.power}]...\nน่าจะสามารถเติมตัวเลขได้ ขอทดสอบ`);
                        statusText.setColor('#FFFF00');
                    }

                    // สร้างกรอบกระพริบที่ตัวนักรบ
                    const flash = scene.add.rectangle(w.x, w.y, 60, 60, 0xFFA500, 0.8);
                    flash.setDepth(12);

                    // สร้าง Ghost Block สีเทาๆ โปร่งใสเพื่อแสดง "Preview ตำแหน่งที่มันจะไปตก"
                    let ghost = null;
                    if (projectedSum <= targetAmount + w.power && currentSum <= targetAmount) {
                        ghost = scene.add.rectangle(currentX, startY, blockW, barHeight - 8, getBlockColor(w.index), 0.4);
                        ghost.setOrigin(0, 0.5);
                        ghost.setStrokeStyle(3, 0xFFFFFF);
                        ghost.setDepth(14); // อยู่ใต้บล็อกจริงนิดนึง

                        // ถ้าล้นหลอด ให้ Ghost โผล่ทะลุออกไปเลย
                        if (projectedSum > targetAmount) {
                            ghost.setStrokeStyle(6, 0xFF0000);
                            ghost.setFillStyle(0xFF0000, 0.5);
                        }
                    }

                    scene.tweens.add({
                        targets: ghost ? [flash, ghost] : [flash],
                        alpha: 0,
                        duration: baseDelay * 0.8,
                        onComplete: () => {
                            flash.destroy();
                            if (ghost) ghost.destroy();
                        }
                    });
                }
                await sleep(baseDelay * 0.8);
                break;
            }

            case 'select_coin': {
                const idx = step.coin;
                if (idx < 0 || idx >= warriors.length) break;

                const w = warriors[idx];
                const blockW = w.power * unitWidth;

                const remainAfter = targetAmount - (currentSum + w.power);

                if (remainAfter < 0) {
                    statusText.setText(`เลือก [พลัง ${w.power}] มาใส่...\nบรรจุไม่ลง! พลังเกินเป้าหมาย! (เกิน ${Math.abs(remainAfter)})`);
                    statusText.setColor('#FF5555');
                } else if (remainAfter === 0) {
                    statusText.setText(`เลือก [พลัง ${w.power}] มาใส่...\nพอดีเป๊ะ! จัดการเป้าหมายสำเร็จ!`);
                    statusText.setColor('#00FF00');
                } else {
                    statusText.setText(`เลือก [พลัง ${w.power}] มาใส่สำเร็จ!\n(เป้าหมายยังขาดพลังอีก ${remainAfter})`);
                    statusText.setColor('#00FFFF');
                }

                // สร้าง Block สีแทนนักรบ
                const color = getBlockColor(w.index);
                const block = scene.add.rectangle(w.x, w.y, blockW, barHeight - 8, color, 0.9);
                block.setOrigin(0, 0.5); // ให้จุดหมุนอยู่ซ้ายมือ เพื่อขยายตัวไปทางขวา
                block.setStrokeStyle(3, 0xFFFFFF);
                block.setDepth(15);

                // สร้างตัวเลขกำกับป้าย
                const label = scene.add.text(w.x + blockW / 2, w.y, w.power.toString(), {
                    fontSize: '24px', color: '#FFF', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
                }).setOrigin(0.5).setDepth(16);

                // Animate บินเข้าไปในช่องว่าง
                scene.tweens.add({
                    targets: block,
                    x: currentX,
                    y: startY,
                    duration: baseDelay * 0.4,
                    ease: 'Power2'
                });

                scene.tweens.add({
                    targets: label,
                    x: currentX + blockW / 2,
                    y: startY,
                    duration: baseDelay * 0.4,
                    ease: 'Power2'
                });

                // อัปเดตสถานะความกว้าง
                stack.push({ block, label, power: w.power, blockW, oriX: w.x, oriY: w.y, warriorIdx: idx });
                currentX += blockW;
                currentSum += w.power;

                updateHpText();

                // เจอ solution ที่ดีที่สุด: บันทึก snapshot ไว้
                if (currentSum === targetAmount) {
                    const currentCount = stack.length;
                    if (!bestSolution || currentCount < bestSolution.length) {
                        bestSolution = stack.map(s => s.warriorIdx);
                    }
                }

                // ถ้าล้นหลอด ให้เกิด Flash สีแดงแรงๆ
                if (currentSum > targetAmount) {
                    const overFlash = scene.add.rectangle(400, startY, barWidth + 60, barHeight + 20, 0xFF0000, 0.5);
                    scene.tweens.add({
                        targets: overFlash,
                        alpha: 0,
                        duration: baseDelay * 0.4,
                        onComplete: () => overFlash.destroy()
                    });
                }

                await sleep(baseDelay * 0.8);
                break;
            }

            case 'remove_coin': {
                const last = stack.pop();
                if (!last) break;

                statusText.setText(`ถอยกลับ (Backtrack)\nถอดยูนิตพลัง ${last.power} ล่าสุดออก เพื่อพิจารณาเส้นทางอื่น`);
                statusText.setColor('#FFA500');

                currentX -= last.blockW;
                currentSum -= last.power;

                updateHpText();

                // Animate บินกลับที่เดิมแล้วจางหาย
                scene.tweens.add({
                    targets: last.block,
                    x: last.oriX,
                    y: last.oriY,
                    alpha: 0,
                    scale: 0.5,
                    duration: baseDelay * 0.4,
                    ease: 'Power2',
                    onComplete: () => last.block.destroy()
                });
                scene.tweens.add({
                    targets: last.label,
                    x: last.oriX,
                    y: last.oriY,
                    alpha: 0,
                    scale: 0.5,
                    duration: baseDelay * 0.4,
                    ease: 'Power2',
                    onComplete: () => last.label.destroy()
                });

                await sleep(baseDelay * 0.6);
                break;
            }

            case 'coin_decision':
                break;

            case 'memo_hit': {
                const amount = step.amount;
                if (amount <= 0) break; // ไม่ต้องทำอะไรใหญ่ๆ ถ้าเลือดเหลือน้อยกว่า 0 หรือ 0 (พอดี)

                statusText.setText(`[Memo Hit] พลังเป้าหมาย ${amount} เคยถูกพิจารณาแล้ว\nดึงผลลัพธ์จากหน่วยความจำมาใช้`);
                statusText.setColor('#FFD700');

                // สร้างรูปกระพริบคลุมโซนที่เป็นหลอดเลือดที่เหลือ (amount)
                // คำนวณความกว้างหลอดเลือดที่เหลือ (amount * unitWidth)
                const hitWidth = Math.max(amount * unitWidth, 40);
                const hitX = currentX + (hitWidth / 2); // จุดศูนย์กลางของโซนเลือดที่เหลือ

                const flash = scene.add.rectangle(hitX, startY, hitWidth + 20, barHeight + 20, 0xFFD700, 0.7).setDepth(16);
                scene.tweens.add({
                    targets: flash, alpha: 0, scaleX: 1.1, scaleY: 1.2, duration: baseDelay * 0.8,
                    onComplete: () => flash.destroy()
                });

                const memoText = scene.add.text(hitX, startY, 'MEMO HIT!\nจำได้!', {
                    fontSize: '28px', color: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 6, align: 'center'
                }).setOrigin(0.5).setDepth(25);

                scene.tweens.add({
                    targets: memoText, y: startY - 40, alpha: 0, duration: baseDelay * 0.9, ease: 'Power2',
                    onComplete: () => memoText.destroy()
                });

                await sleep(baseDelay * 1.5);
                break;
            }
        }
    }

    statusText.setText('กระบวนการค้นหาเสร็จสิ้น (Backtracking)');
    statusText.setColor('#00FFFF');

    // แสดงตัวละครที่ถูกเลือกมาในคำตอบที่ดีที่สุด (เหมือน DP mode)
    if (bestSolution && bestSolution.length > 0) {
        await sleep(baseDelay * 0.5);
        statusText.setText(`คำตอบที่ดีที่สุด: ใช้ ${bestSolution.length} เหรียญ\nระดมกำลังพลออกมา!`);
        statusText.setColor('#00FF00');

        const spawnY = startY + barHeight + 80;
        const spacing = 60;
        const startHeroX = 400 - ((bestSolution.length * spacing) / 2) + (spacing / 2);

        for (let idx = 0; idx < bestSolution.length; idx++) {
            const warriorIdx = bestSolution[idx];
            const w = warriors[warriorIdx];
            if (!w) continue;

            const origSprite = w.powerSquare;
            if (!origSprite) continue;

            const px = startHeroX + (idx * spacing);

            // Clone ตัวละครจาก powerSquare — ขนาดใหญ่ขึ้นเป็น 80x80
            const tex = origSprite.texture?.key || 'bot_slime1';
            const ghost = scene.add.image(400, startY, tex)
                .setDisplaySize(80, 80).setDepth(30).setAlpha(0);
            if (origSprite.frame?.name) ghost.setFrame(origSprite.frame.name);

            // ตัวเลขพลัง — อยู่เหนือตัวละคร (spawnY - 55)
            const labelY = spawnY - 55;
            const powerLabel = scene.add.text(px, labelY, w.power.toString(), {
                fontSize: '22px', color: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
            }).setOrigin(0.5).setDepth(31).setAlpha(0);

            // Tween ตัวละครบินเข้ามา
            scene.tweens.add({
                targets: ghost,
                alpha: 1, x: px, y: spawnY,
                duration: 600 / speed,
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
                delay: 300 / speed
            });

            await sleep(150 / speed);
        }

        await sleep(baseDelay * 1.5);
    }

}

/**
 * Display Mode 2: แบบวาดต้นไม้ (Recursion Tree)
 * เตรียมไว้เผื่อตอนสอบอาจารย์สั่งให้วาดเป็น Tree ย้อนรอย
 */
async function playTreeDisplay(scene, trace, options) {
    const { speed = 1.0 } = options;
    const baseDelay = 800 / speed;

    if (!scene || !scene.coinChange || !trace || trace.length === 0) return;

    const warriors = scene.coinChange.warriors;
    const targetAmount = scene.levelData?.coin_change_data?.monster_power || 0;
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    const statusText = scene.add.text(
        400, 50,
        'เริ่มสร้าง Tree...',
        { fontSize: '24px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center' }
    ).setOrigin(0.5).setDepth(20);

    const treeContainer = scene.add.container(0, 0).setDepth(15);

    // Helper: สร้างปม (Node)
    const createNode = (x, y, hp, isError = false, isSuccess = false) => {
        const color = isError ? 0xFF0000 : (isSuccess ? 0x00FF00 : 0x0033CC);
        const circle = scene.add.circle(x, y, 22, color);
        circle.setStrokeStyle(3, 0xFFFFFF);
        const text = scene.add.text(x, y, hp.toString(), {
            fontSize: '18px', color: '#FFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        treeContainer.add([circle, text]);
        return { circle, text, x, y, hp };
    };

    const rootNode = createNode(400, 150, targetAmount);
    const activePath = [rootNode];
    let maxHistoricalY = 500;

    // Helper: ซูมกล้องไม่ให้เด้ง
    const focusCamera = (targetY, duration = 400) => {
        if (targetY > maxHistoricalY) maxHistoricalY = targetY;
        let desiredScale = 1.0;
        if (maxHistoricalY > 500) {
            desiredScale = 350 / (maxHistoricalY - 150);
        }
        const desiredX = 400 - (400 * desiredScale);
        const desiredY = 150 - (150 * desiredScale);
        scene.tweens.add({
            targets: treeContainer, scale: desiredScale, x: desiredX, y: desiredY,
            duration: duration / speed, ease: 'Power2'
        });
        return desiredScale;
    };

    // Helper: วาดตัวนักรบบินไปที่กิ่ง
    const createTinyWarriorFx = (warrior, targetX, targetY) => {
        const spriteKeys = ['bot_slime1', 'org1', 'org2', 'org3'];
        const tex = spriteKeys[warrior.index % spriteKeys.length] || 'bot_slime1';
        const fx = scene.add.image(warrior.x, warrior.y, tex).setDepth(30).setScale(1.0);
        scene.tweens.add({
            targets: fx, x: targetX, y: targetY, scale: 0.3, alpha: 0,
            duration: 600 / speed, ease: 'Power2', onComplete: () => fx.destroy()
        });
    };

    for (let i = 0; i < trace.length; i++) {
        const step = trace[i];
        switch (step.action) {
            case 'consider_coin': {
                const idx = step.coin;
                if (idx >= 0 && idx < warriors.length) {
                    const w = warriors[idx];
                    statusText.setText(`💡 แตกกิ่งทดสอบ [พลัง ${w.power}]`);
                    const flash = scene.add.rectangle(w.x, w.y, 60, 60, 0xFFA500, 0.6).setDepth(12);
                    scene.tweens.add({
                        targets: flash, alpha: 0, duration: 400 / speed,
                        onComplete: () => flash.destroy()
                    });
                }
                await sleep(baseDelay * 0.5);
                break;
            }
            case 'select_coin': {
                const idx = step.coin;
                if (idx < 0 || idx >= warriors.length) break;

                const parentNode = activePath[activePath.length - 1];
                const depth = activePath.length;
                const w = warriors[idx];
                const newHp = parentNode.hp - w.power;

                statusText.setText(`⚔️ สร้างกิ่งใหม่! (ดาเมจ ${w.power})`);

                // กางกิ่งออกให้เป็น Tree
                const nodeSpread = Math.max(30, 120 - (depth * 10));
                const childX = parentNode.x + ((idx - 1.5) * nodeSpread);
                const childY = parentNode.y + 70;

                // ลากเส้นเชื่อมกิ่ง
                const line = scene.add.line(0, 0, parentNode.x, parentNode.y + 22, childX, childY - 22, 0xFFFFFF, 0.8).setOrigin(0, 0);
                treeContainer.add(line);

                const dmgText = scene.add.text((parentNode.x + childX) / 2, ((parentNode.y + childY) / 2) - 10, `-${w.power}`, {
                    fontSize: '14px', color: '#FFDD00', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
                }).setOrigin(0.5);
                treeContainer.add(dmgText);

                const childNode = createNode(childX, childY, newHp, newHp < 0, newHp === 0);
                childNode.line = line;
                childNode.dmgText = dmgText;

                activePath.push(childNode);
                const currentScale = focusCamera(childY);

                const screenTargetX = childX * currentScale + treeContainer.x;
                const screenTargetY = childY * currentScale + treeContainer.y;
                createTinyWarriorFx(w, screenTargetX, screenTargetY);

                await sleep(baseDelay * 0.8);
                break;
            }
            case 'remove_coin': {
                const deadNode = activePath.pop();
                const parentNode = activePath[activePath.length - 1];

                statusText.setText(`🔙 ทางตันหรือลองครบแล้ว! (Backtrack)`);
                // ย้อมสีกิ่งที่ตายให้เป็นสีเทาจางๆ (Dead Branch)
                deadNode.circle.setFillStyle(0x333333);
                deadNode.circle.setStrokeStyle(2, 0x555555);
                deadNode.text.setAlpha(0.4);
                if (deadNode.line) deadNode.line.setAlpha(0.3);
                if (deadNode.dmgText) deadNode.dmgText.setAlpha(0.3);

                focusCamera(parentNode.y);
                await sleep(baseDelay * 0.6);
                break;
            }

            case 'memo_hit': {
                const amount = step.amount;
                statusText.setText(`🌟 Memo Cache Hit! (พลัง ${amount})\nเคยคำนวณกิ่งนี้ไปแล้ว ข้ามได้เลย!`);
                statusText.setColor('#FFD700');

                if (activePath.length > 0) {
                    const currentNode = activePath[activePath.length - 1];
                    currentNode.circle.setStrokeStyle(4, 0xFFD700);
                    const flash = scene.add.circle(currentNode.x, currentNode.y, 30, 0xFFD700, 0.8).setDepth(20);
                    scene.tweens.add({
                        targets: flash, alpha: 0, scale: 2, duration: 600 / speed,
                        onComplete: () => flash.destroy()
                    });
                }

                await sleep(baseDelay);
                break;
            }
        }
    }
    statusText.setText('✅ วาด Tree สำเร็จ!');
}
