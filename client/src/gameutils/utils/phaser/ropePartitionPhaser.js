import Phaser from "phaser";

/**
 * Setup Rope Partition Loading/State
 */
export function setupRopePartition(scene) {
    try {
        const level = scene?.levelData;
        const gameType = level?.gameType;
        const appliedType = level?.appliedData?.type;
        console.log('🔍 Rope Setup Check - GameType:', gameType, 'AppliedType:', appliedType);

        if (gameType !== 'rope_partition' && appliedType !== 'BACKTRACKING_ROPE_PARTITION') return;

        console.log('🪢 Setting up Rope Partition Board in Phaser');

        // Clean up previous visuals
        if (scene.ropePartition) {
            if (scene.ropePartition.container) scene.ropePartition.container.destroy();
        }

        const container = scene.add.container(0, 0);

        // --- Config ---
        const width = scene.scale.width;
        const height = scene.scale.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // --- Background ---
        // Transparent or simple bg? Keeping dark bg for visibility
        // const bg = scene.add.rectangle(centerX, centerY, width, height, 0x0f172a); 
        // container.add(bg);

        // --- Rope Container ---
        // Where the rope segments will be drawn
        // Center vertically as requested "only rope"
        const ropeY = centerY;
        const ropeWidth = 700;
        const ropeHeight = 60;

        // Ruler line
        const rulerLine = scene.add.line(0, 0, centerX - ropeWidth / 2, ropeY + 40, centerX + ropeWidth / 2, ropeY + 40, 0x475569);
        container.add(rulerLine);

        // Store references
        scene.ropePartition = {
            container,
            centerX,
            ropeY,
            ropeWidth,
            ropeHeight,
            drawnSegments: [], // Store segment graphics
            drawnScissors: []  // Store scissor graphics
        };

        // Initial Data Loading
        const payload = level?.appliedData?.payload || level?.customData || {};
        console.log('🪢 Rope Payload:', payload);

        let total = 10;
        if (payload.total !== undefined) total = parseInt(payload.total);
        else if (level?.appliedData?.total !== undefined) total = parseInt(level.appliedData.total);

        if (isNaN(total) || total <= 0) total = 10;

        console.log('🪢 Initial Rope Total:', total);

        // Render initial empty state
        updateRopePartitionVisuals(scene, {
            total: total,
            current: [],
            stats: { attempts: 0, backtracks: 0, solutionsCount: 0 }
        });

        console.log('✅ Rope Partition Board Created');

    } catch (e) {
        console.warn('setupRopePartition error:', e);
    }
}

/**
 * Update Rope Partition Visuals
 * @param {Phaser.Scene} scene 
 * @param {Object} state - The current state object from the execution step
 * State structure expected matches React demo:
 * {
 *   current: number[], // [3, 2]
 *   total: number,     // 10
 *   status: 'trying' | 'backtrack' | 'found',
 *   message: string,
 *   stats: { attempts, backtracks, solutionsCount }
 * }
 */
export function updateRopePartitionVisuals(scene, state) {
    if (!scene || !scene.ropePartition) return;
    const { container, centerX, ropeY, ropeWidth, ropeHeight } = scene.ropePartition;

    // --- Clear Old Segments ---
    scene.ropePartition.drawnSegments.forEach(s => s.destroy());
    scene.ropePartition.drawnSegments = [];
    scene.ropePartition.drawnScissors.forEach(s => s.destroy());
    scene.ropePartition.drawnScissors = [];

    const currentPath = state.current || [];
    const total = state.total || 10;

    // Safety
    if (total <= 0) return;

    // Define Colors (matching simple palette)
    const colors = [
        0x60a5fa, // Blue
        0xc084fc, // Purple
        0xf472b6, // Pink
        0xfacc15, // Yellow
        0xfb923c, // Orange
        0x22d3ee  // Cyan
    ];

    let accumulatedLen = 0;
    const startX = centerX - ropeWidth / 2;

    // --- Draw Segments ---
    currentPath.forEach((len, idx) => {
        const segWidth = (len / total) * ropeWidth;
        const segX = startX + (accumulatedLen / total) * ropeWidth;

        let color = colors[idx % colors.length];
        if (state.status === 'found') color = 0x4ade80; // Green
        if (state.status === 'backtrack' && idx === currentPath.length - 1) color = 0xf87171; // Red

        const rect = scene.add.rectangle(segX + segWidth / 2, ropeY, segWidth - 2, ropeHeight, color);
        // Add border
        rect.setStrokeStyle(2, 0xffffff);
        container.add(rect);
        scene.ropePartition.drawnSegments.push(rect);

        // Text Value
        const text = scene.add.text(segX + segWidth / 2, ropeY, `${len}m`, {
            fontSize: '20px', color: '#000', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);
        scene.ropePartition.drawnSegments.push(text);

        accumulatedLen += len;

        // Draw Scissors at the cut point (except the last one which is open or end)
        // If we are "trying" a new cut, show scissors at the end of this segment
        // In the React code, scissors were shown at `accumulated` positions.
        if (accumulatedLen < total && state.status === 'trying') {
            const cutX = startX + (accumulatedLen / total) * ropeWidth;
            const scissorText = scene.add.text(cutX, ropeY - ropeHeight / 2 - 20, "✂️", {
                fontSize: '24px'
            }).setOrigin(0.5);

            // Bounce animation
            scene.tweens.add({
                targets: scissorText,
                y: scissorText.y - 10,
                duration: 400,
                yoyo: true,
                repeat: -1
            });

            container.add(scissorText);
            scene.ropePartition.drawnScissors.push(scissorText);
        }
    });

    // --- Draw Remaining/Ghost Rope (Optional) ---
    // If the path doesn't fill the total, show the remaining empty space as gray
    if (accumulatedLen < total) {
        const remainingLen = total - accumulatedLen;
        const segWidth = (remainingLen / total) * ropeWidth;
        const segX = startX + (accumulatedLen / total) * ropeWidth;

        const rect = scene.add.rectangle(segX + segWidth / 2, ropeY, segWidth, ropeHeight, 0x334155); // Slate 700
        rect.setStrokeStyle(2, 0x475569, 1); // Dashed border simulated by color
        container.add(rect);
        scene.ropePartition.drawnSegments.push(rect);

        // Show total remaining
        const text = scene.add.text(segX + segWidth / 2, ropeY, `?`, {
            fontSize: '20px', color: '#64748b', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);
        scene.ropePartition.drawnSegments.push(text);
    }
}
