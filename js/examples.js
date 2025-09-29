export default class Examples {
    constructor() {
        this.examples = [
            {
                title: "Blink LED",
                command: "Blink an LED connected to pin 13 with 1 second intervals",
                category: "basic"
            },
            {
                title: "Control Servo",
                command: "Create code to control a servo motor that sweeps from 0 to 180 degrees",
                category: "motors"
            },
            {
                title: "Read Temperature",
                command: "Read temperature from a DHT11 sensor and display it in serial monitor",
                category: "sensors"
            },
            {
                title: "RGB LED",
                command: "Cycle through colors on an RGB LED with smooth transitions",
                category: "leds"
            },
            {
                title: "Distance Meter",
                command: "Measure distance with HC-SR04 sensor and print to serial",
                category: "sensors"
            }
        ];
    }
    
    loadExamples() {
        const container = document.getElementById('examplesContainer');
        container.innerHTML = `
            <div class="examples-title">Try these examples:</div>
            <div class="example-list">
                ${this.examples.map(example => `
                    <div class="example-chip" data-command="${example.command}">
                        ${example.title}
                    </div>
                `).join('')}
            </div>
        `;
        
        this.attachExampleListeners();
    }
    
    attachExampleListeners() {
        document.querySelectorAll('.example-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const command = chip.getAttribute('data-command');
                const event = new CustomEvent('exampleSelected', {
                    detail: { command }
                });
                document.dispatchEvent(event);
            });
        });
    }
}
