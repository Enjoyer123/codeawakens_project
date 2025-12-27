import Phaser from "phaser";

/**
 * Setup Train Schedule board in Phaser
 */
export function setupTrainSchedule(scene) {
    try {
        const level = scene?.levelData;
        const gameType = level?.gameType;
        if (gameType !== 'train_schedule') return;

        console.log('🚂 Setting up Train Schedule Board in Phaser');

        // Clean up previous visuals
        if (scene.trainSchedule) {
            if (scene.trainSchedule.container) scene.trainSchedule.container.destroy();
        }

        const payload = level?.appliedData?.payload || level?.customData || { trains: [] };
        const allTimes = payload.trains.flatMap(t => [t.arrive, t.depart]);
        const minTime = allTimes.length ? Math.floor(Math.min(...allTimes)) : 9;
        const maxTime = allTimes.length ? Math.ceil(Math.max(...allTimes)) : 17;

        // Default platform count from data (implied 2 for this level type usually)
        const maxPlatform = payload.expectedPlatforms || 2;

        // Board configuration
        const margin = { top: 100, left: 100, right: 50, bottom: 50 };
        const width = 800; // Fixed width for consistent look
        const height = 400;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Create container for organized cleanup
        const container = scene.add.container(0, 0);

        // Background (Chart Area)
        const bg = scene.add.rectangle(margin.left + chartWidth / 2, margin.top + chartHeight / 2, chartWidth, chartHeight, 0x16213e);
        bg.setStrokeStyle(2, 0x2a3f5f);
        container.add(bg);

        // Grid Graphics
        const gridGraphics = scene.add.graphics();
        container.add(gridGraphics);

        // Axis Labels
        const platformHeight = chartHeight / Math.max(maxPlatform, 1);

        // Draw Horizontal Lines & Platform Labels
        gridGraphics.lineStyle(1, 0x2a3f5f);
        for (let i = 0; i <= maxPlatform; i++) {
            const y = margin.top + platformHeight * i;
            gridGraphics.beginPath();
            gridGraphics.moveTo(margin.left, y);
            gridGraphics.lineTo(margin.left + chartWidth, y);
            gridGraphics.strokePath();

            if (i < maxPlatform) {
                const labelY = margin.top + platformHeight * (i + 0.5);
                const label = scene.add.text(margin.left - 10, labelY, `Platform ${i + 1}`, {
                    fontSize: '14px',
                    color: '#e0e0e0',
                    fontFamily: 'Arial'
                }).setOrigin(1, 0.5);
                container.add(label);
            }
        }

        // Draw Vertical Lines & Time Labels
        for (let t = minTime; t <= maxTime; t += 0.5) { // 30 min steps
            const x = margin.left + ((t - minTime) / (maxTime - minTime)) * chartWidth;
            gridGraphics.beginPath();
            gridGraphics.moveTo(x, margin.top);
            gridGraphics.lineTo(x, margin.top + chartHeight);
            gridGraphics.strokePath();

            // Format time: 9.0 -> 9:00, 9.5 -> 9:30
            const hour = Math.floor(t);
            const minute = (t % 1 === 0.5) ? '30' : '00';

            // Only show labels for full hours or if space permits (optional, but requested explicit 1.30)
            const timeLabel = scene.add.text(x, margin.top + chartHeight + 15, `${hour}:${minute}`, {
                fontSize: '10px',
                color: '#e0e0e0',
                fontFamily: 'Arial'
            }).setOrigin(0.5, 0);
            container.add(timeLabel);
        }

        // Title
        const title = scene.add.text(scene.scale.width / 2, 50, payload.name || "Train Schedule", {
            fontSize: '24px',
            color: '#00d4ff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        container.add(title);

        // Store reference for updates
        scene.trainSchedule = {
            container,
            minTime,
            maxTime,
            margin,
            chartWidth,
            chartHeight,
            platformHeight,
            drawnTrains: [],
            railCards: [] // Store references to bottom rail cards
        };

        // --- Input List (Train Queue) ---
        const queueY = margin.top + chartHeight + 60;
        const cardWidth = 80;
        const cardHeight = 50;
        const cardGap = 10;

        const queueTitle = scene.add.text(margin.left, queueY - 25, "AVAILABLE TRAINS", {
            fontSize: '14px', color: '#aaaaaa', fontStyle: 'bold'
        });
        container.add(queueTitle);

        payload.trains.forEach((train, index) => {
            const x = margin.left + (index * (cardWidth + cardGap));
            const y = queueY;

            // Card BG
            const card = scene.add.rectangle(x + cardWidth / 2, y + cardHeight / 2, cardWidth, cardHeight, 0x223344);
            card.setStrokeStyle(1, 0x556677);
            container.add(card);

            // Text
            const tLabel = scene.add.text(x + cardWidth / 2, y + 15, `T${train.id}`, {
                fontSize: '12px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5);
            container.add(tLabel);

            const timeLabel = scene.add.text(x + cardWidth / 2, y + 35, `${train.arrive}-${train.depart}`, {
                fontSize: '10px', color: '#aaaaaa'
            }).setOrigin(0.5);
            container.add(timeLabel);

            scene.trainSchedule.railCards.push({
                id: train.id,
                bg: card,
                tLabel,
                timeLabel,
                baseX: x + cardWidth / 2,
                baseY: y + cardHeight / 2
            });
        });

        console.log('✅ Train Schedule Board Created');

    } catch (e) {
        console.warn('setupTrainSchedule error:', e);
    }
}

/**
 * Update Train Schedule visuals (Animation)
 * Called from React when assignments change
 */
export function updateTrainScheduleVisuals(scene, assignments) {
    if (!scene || !scene.trainSchedule) return;
    const { container, minTime, maxTime, margin, chartWidth, chartHeight, platformHeight, railCards } = scene.trainSchedule;

    // Clear previous dynamic elements
    if (scene.trainSchedule.drawnTrains) {
        scene.trainSchedule.drawnTrains.forEach(t => t.destroy());
    }
    scene.trainSchedule.drawnTrains = [];

    // Reset all cards style
    if (railCards) {
        railCards.forEach(card => {
            card.bg.setFillStyle(0x223344);
            card.bg.setStrokeStyle(1, 0x556677);
        });
    }

    const validAssignments = Array.isArray(assignments) ? assignments : [];
    if (validAssignments.length === 0) return;

    const colors = [
        0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24,
        0x6c5ce7, 0xa29bfe, 0xfd79a8, 0xfdcb6e,
        0x55efc4, 0x81ecec, 0x74b9ff, 0xa29bfe
    ];

    // Helper to draw a single train
    const drawTrain = (assignment, isHighlight = false) => {
        const train = assignment.train;

        // Highlight corresponding rail card
        if (railCards) {
            const card = railCards.find(c => c.id === train.id);
            if (card) {
                if (isHighlight) {
                    card.bg.setFillStyle(0x445566);
                    card.bg.setStrokeStyle(2, 0xffff00); // Yellow highlight
                } else {
                    card.bg.setFillStyle(0x224422); // Green (Done)
                    card.bg.setStrokeStyle(1, 0x00ff00);
                }
            }
        }

        // Auto-detect 0-based indexing (minPlatform=0) -> shift +1, logic identical to React
        const platformValues = validAssignments.map(a => parseInt(a.platform) || 0);
        const minPlatformValue = platformValues.length > 0 ? Math.min(...platformValues) : 0;
        const platformShift = (minPlatformValue === 0) ? 1 : 0;

        const platform = (parseInt(assignment.platform) || 0) + platformShift;

        const x1 = margin.left + ((train.arrive - minTime) / (maxTime - minTime)) * chartWidth;
        const x2 = margin.left + ((train.depart - minTime) / (maxTime - minTime)) * chartWidth;

        // Safety clamp platform to maxPlatform
        const y = margin.top + platformHeight * (platform - 1) + 10;
        const h = platformHeight - 20;
        const w = Math.max(x2 - x1, 5); // Min width 5

        const color = colors[train.id % colors.length];

        const rect = scene.add.rectangle(x1 + w / 2, y + h / 2, w, h, color);
        rect.setStrokeStyle(2, 0xffffff);
        container.add(rect);

        const label = scene.add.text(x1 + w / 2, y + h / 2, `T${train.id}`, {
            fontSize: '12px', color: '#000', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(label);

        scene.trainSchedule.drawnTrains.push(rect, label);

        if (isHighlight) {
            const glow = scene.add.rectangle(x1 + w / 2, y + h / 2, w + 4, h + 4);
            glow.setStrokeStyle(3, 0x00ff00);
            container.add(glow);
            scene.trainSchedule.drawnTrains.push(glow);

            // Remove glow later
            scene.tweens.add({
                targets: glow,
                alpha: 0,
                duration: 500,
                delay: 500,
                onComplete: () => { glow.destroy(); }
            });
        }
    };

    // Animation Loop
    let currentStep = 0;
    const timer = scene.time.addEvent({
        delay: 600,
        callback: () => {
            // Mark previous step as done (Green) logic needs access to previous index
            if (currentStep > 0 && currentStep <= validAssignments.length) {
                const prevTrain = validAssignments[currentStep - 1].train;
                const card = railCards ? railCards.find(c => c.id === prevTrain.id) : null;
                if (card) {
                    card.bg.setFillStyle(0x224422); // Green
                    card.bg.setStrokeStyle(1, 0x00ff00);
                }
            }

            if (currentStep < validAssignments.length) {
                drawTrain(validAssignments[currentStep], true);
                currentStep++;
            } else {
                timer.remove();
            }
        },
        loop: true
    });
}
