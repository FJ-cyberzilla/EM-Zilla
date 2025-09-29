export default class ArduinoTemplates {
    constructor() {
        this.templates = {
            blink: this.blinkTemplate,
            servo: this.servoTemplate,
            temperature: this.temperatureTemplate,
            ultrasonic: this.ultrasonicTemplate,
            rgb: this.rgbTemplate
        };
    }
    
    matchTemplate(command) {
        const lowerCommand = command.toLowerCase();
        
        if (lowerCommand.includes('blink') && lowerCommand.includes('led')) {
            return this.templates.blink();
        }
        
        if (lowerCommand.includes('servo')) {
            return this.templates.servo();
        }
        
        if (lowerCommand.includes('temperature') || lowerCommand.includes('dht')) {
            return this.templates.temperature();
        }
        
        if (lowerCommand.includes('ultrasonic') || lowerCommand.includes('distance')) {
            return this.templates.ultrasonic();
        }
        
        if (lowerCommand.includes('rgb') || lowerCommand.includes('color')) {
            return this.templates.rgb();
        }
        
        return null;
    }
    
    blinkTemplate() {
        return `// LED Blink Example
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`;
    }
    
    servoTemplate() {
        return `// Servo Motor Control
#include <Servo.h>

Servo myservo;
int pos = 0;

void setup() {
  myservo.attach(9);
}

void loop() {
  for (pos = 0; pos <= 180; pos += 1) {
    myservo.write(pos);
    delay(15);
  }
  for (pos = 180; pos >= 0; pos -= 1) {
    myservo.write(pos);
    delay(15);
  }
}`;
    }
    
    // Add other template methods...
}
