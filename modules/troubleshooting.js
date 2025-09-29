export default class Troubleshooting {
    constructor() {
        this.commonIssues = [
            {
                title: "Arduino not detected",
                symptoms: ["Board not showing in ports", "Upload failed", "Device manager shows unknown device"],
                causes: ["Driver issues", "USB cable problem", "Board selection incorrect"],
                solutions: [
                    "Install Arduino drivers",
                    "Try different USB cable",
                    "Check Tools > Board selection",
                    "Restart Arduino IDE"
                ]
            },
            {
                title: "Code upload fails",
                symptoms: ["avrdude: stk500_getsync() error", "Programmer not responding", "Verify error"],
                causes: ["Wrong board selected", "Incorrect port", "Bootloader issues"],
                solutions: [
                    "Verify board selection in Tools > Board",
                    "Check port selection in Tools > Port",
                    "Press reset button before upload",
                    "Check if other programs are using the serial port"
                ]
            },
            {
                title: "LCD not displaying",
                symptoms: ["Blank screen", "Garbled characters", "No backlight"],
                causes: ["Contrast setting", "Wiring issues", "Power problems"],
                solutions: [
                    "Adjust contrast potentiometer",
                    "Verify all connections",
                    "Check 5V and GND connections",
                    "Verify pin assignments in code"
                ]
            },
            {
                title: "Sensors not reading correctly",
                symptoms: ["Wrong values", "No response", "Inconsistent readings"],
                causes: ["Power issues", "Wrong pin mode", "Sensor damage", "Code errors"],
                solutions: [
                    "Check power supply (3.3V vs 5V)",
                    "Verify pinMode() declarations",
                    "Test with known working sensor",
                    "Add serial debugging prints"
                ]
            }
        ];
    }

    getIssues() {
        return this.commonIssues;
    }

    searchIssues(keyword) {
        return this.commonIssues.filter(issue => 
            issue.title.toLowerCase().includes(keyword.toLowerCase()) ||
            issue.symptoms.some(symptom => symptom.toLowerCase().includes(keyword.toLowerCase())) ||
            issue.causes.some(cause => cause.toLowerCase().includes(keyword.toLowerCase()))
        );
    }

    generateStepByStep(issue) {
        const steps = [
            "1. Power off your Arduino",
            "2. Disconnect all components",
            "3. Verify basic Arduino functionality with a simple blink test",
            "4. Reconnect components one by one, testing after each connection",
            "5. Check serial monitor for error messages",
            "6. Verify all connections against your circuit diagram"
        ];

        return {
            issue: issue.title,
            steps: steps,
            additionalTips: issue.solutions
        };
    }
}
