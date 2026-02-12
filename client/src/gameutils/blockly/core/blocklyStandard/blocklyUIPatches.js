// Blockly UI Patches to prevent DOM-related errors
import * as Blockly from "blockly/core";

export function applyUIPatches() {

    // 1. MenuItem Patch needed for Context Menu
    if (Blockly.MenuItem && Blockly.MenuItem.prototype.createDom) {
        const originalCreateDom = Blockly.MenuItem.prototype.createDom;
        Blockly.MenuItem.prototype.createDom = function () {
            try {
                // Check if we have valid DOM context
                if (!document.body || !document.createElement) {
                    console.warn("DOM not ready for MenuItem createDom");
                    return this.createFallbackElement();
                }

                // Try original method first
                return originalCreateDom.call(this);
            } catch (error) {
                console.warn("Error in MenuItem createDom:", error);
                return this.createFallbackElement();
            }
        };

        // Add fallback element creation method if it doesn't exist (it usually doesn't on the prototype)
        if (!Blockly.MenuItem.prototype.createFallbackElement) {
            Blockly.MenuItem.prototype.createFallbackElement = function () {
                const element = document.createElement('div');
                element.textContent = this.text_ || 'Menu Item';
                element.className = 'blocklyMenuItem';
                element.style.padding = '8px';
                element.style.cursor = 'pointer';
                element.style.backgroundColor = '#fff';
                element.style.border = '1px solid #ccc';
                element.style.borderRadius = '4px';
                element.style.margin = '2px';
                element.style.fontSize = '12px';

                // Add click handler
                element.addEventListener('click', () => {
                    if (this.callback_) {
                        this.callback_(this);
                    }
                });

                return element;
            };
        }
    }

    // 2. Menu Patch
    if (Blockly.Menu && Blockly.Menu.prototype.render) {
        const originalRender = Blockly.Menu.prototype.render;
        Blockly.Menu.prototype.render = function (element) {
            try {
                // Check if we have valid DOM context
                if (!document.body || !document.createElement) {
                    console.warn("DOM not ready for Menu render");
                    return this.createFallbackMenu();
                }

                return originalRender.call(this, element);
            } catch (error) {
                console.warn("Error in Menu render:", error);
                return this.createFallbackMenu();
            }
        };

        if (!Blockly.Menu.prototype.createFallbackMenu) {
            Blockly.Menu.prototype.createFallbackMenu = function () {
                const element = document.createElement('div');
                element.className = 'blocklyMenu';
                element.style.position = 'absolute';
                element.style.backgroundColor = 'white';
                element.style.border = '1px solid #ccc';
                element.style.borderRadius = '4px';
                element.style.padding = '5px';
                element.style.zIndex = '1000';
                element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                element.style.minWidth = '120px';

                // Add menu items
                if (this.menuItems_ && this.menuItems_.length > 0) {
                    this.menuItems_.forEach(item => {
                        const itemElement = item.createDom();
                        element.appendChild(itemElement);
                    });
                } else {
                    element.textContent = 'Menu';
                }

                return element;
            };
        }
    }

    // 3. FieldDropdown Patch to work properly for non-variable fields
    if (Blockly.FieldDropdown && Blockly.FieldDropdown.prototype.showEditor_) {
        const originalShowEditor = Blockly.FieldDropdown.prototype.showEditor_;
        Blockly.FieldDropdown.prototype.showEditor_ = function () {
            // Skip dropdown for variable fields - let FieldVariable handle it
            if (this.sourceBlock_ && this.sourceBlock_.type &&
                (this.sourceBlock_.type.includes('variable') || this.sourceBlock_.type.includes('VAR'))) {
                return;
            }

            try {
                // Check if DOM is ready
                if (!this.sourceBlock_ || !this.sourceBlock_.workspace || !document.body) {
                    console.warn('FieldDropdown: DOM not ready, using fallback');
                    this.showFallbackDropdown();
                    return;
                }

                return originalShowEditor.call(this);
            } catch (error) {
                console.warn('Error in FieldDropdown.showEditor_:', error);
                this.showFallbackDropdown();
            }
        };

        if (!Blockly.FieldDropdown.prototype.showFallbackDropdown) {
            Blockly.FieldDropdown.prototype.showFallbackDropdown = function () {
                const options = this.getOptions();
                if (!options || options.length === 0) {
                    console.warn('No options available for dropdown');
                    return;
                }

                const currentValue = this.getValue();
                const currentIndex = options.findIndex(option => option[1] === currentValue);
                const nextIndex = (currentIndex + 1) % options.length;
                const nextValue = options[nextIndex][1];
                const nextLabel = options[nextIndex][0];



                try {
                    this.setValue(nextValue);
                    if (this.sourceBlock_ && this.sourceBlock_.workspace && this.sourceBlock_.workspace.render) {
                        this.sourceBlock_.workspace.render();
                    }
                } catch (error) {
                    console.error('Error setting dropdown value:', error);
                }
            };
        }
    }

    // 4. Gesture Patch
    if (Blockly.Gesture && Blockly.Gesture.prototype.setStartField) {
        const originalSetStartField = Blockly.Gesture.prototype.setStartField;
        Blockly.Gesture.prototype.setStartField = function (field) {
            try {
                // Check if gesture is already started
                if (this.started_) {
                    console.warn('Gesture already started, skipping setStartField');
                    return;
                }
                return originalSetStartField.call(this, field);
            } catch (error) {
                console.warn('Error in Gesture.setStartField:', error);
                return;
            }
        };
    }
}
