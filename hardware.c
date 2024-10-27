#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// // Định nghĩa thông tin WiFi
// const char* ssid = "Nha Go";
// const char* password = "Yeunhago";
//const char* ssid = "Mạng";
// const char* password = "12345678";
const char* ssid = "602";
const char* password = "0985150059";

// Định nghĩa thông tin MQTT Broker
// const char* mqtt_server = "192.168.43.88";  // Địa chỉ IP của MQTT Broker
const char* mqtt_server = "192.168.1.6";  // Địa chỉ IP của MQTT Broker
const int mqtt_port = 1883;                 // Cổng của MQTT Broker
const char* mqtt_user = "ttm";    // Username của MQTT Broker
const char* mqtt_pass = "ttm";    // Password của MQTT Broker


// Định nghĩa các chân cho cảm biến và thiết bị
#define DHTPIN D2          // Chân cảm biến DHT11 nối với D2
#define DHTTYPE DHT11      // Loại cảm biến DHT11
#define LDRPIN A0          // Chân cảm biến ánh sáng nối với A0
#define LED1 D5            // Chân LED1 nối với D5
#define FANPIN D6          // Chân điều khiển quạt nối với D6
#define ACIN D7            // Chân điều khiển điều hòa nối với D7
#define ALERT_PIN D8       // Chân đèn cảnh báo nối với D8
#define CB1_THRESHOLD 70   // Ngưỡng cho cảm biến cb1

DHT dht(DHTPIN, DHTTYPE);  // Khởi tạo cảm biến DHT11
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastMsg = 0;  // Biến lưu thời gian gửi dữ liệu cuối cùng
int ledState1 = HIGH;
int fanState = HIGH;
int acState = HIGH;
int gioState = LOW;       // Trạng thái của đèn cảnh báo
int cb1Value = 0;           // Giá trị của cảm biến cb1

// Khai báo biến để quản lý thời gian không sử dụng delay
unsigned long previousMillis = 0;
const long interval = 2000;  // 2 giây
bool blinking = false;       // Biến kiểm soát trạng thái nháy đèn

// Khai báo biến trạng thái trước đó
int prevLedState = LOW;
int prevFanState = LOW;
int prevAcState = LOW;
int prevGioState= LOW;

// Kết nối WiFi
void setup_wifi() {
  delay(10);
  Serial.begin(115200);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// Callback nhận dữ liệu từ MQTT Broker
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("Message received on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  Serial.println(message);
  
  // Kiểm tra và điều khiển thiết bị theo topic và payload
  if (String(topic) == "home/led1") {
    if (message == "ON") {
      ledState1 = HIGH;
    } else if (message == "OFF") {
      ledState1 = LOW;
    }
    digitalWrite(LED1, ledState1);
  } else if (String(topic) == "home/fan") {
    if (message == "ON") {
      fanState = HIGH;
    } else if (message == "OFF") {
      fanState = LOW;
    }
    digitalWrite(FANPIN, fanState);
  } else if (String(topic) == "home/ac") {
    if (message == "ON") {
      acState = HIGH;
    } else if (message == "OFF") {
      acState = LOW;
    }
    digitalWrite(ACIN, acState);
  } else if (String(topic) == "home/all") {
    if (message == "ON") {
      gioState = HIGH;
    } else if (message == "OFF") {
      gioState = LOW;
    }
    digitalWrite(ALERT_PIN, gioState); // Tắt đèn cảnh báo
  } else if (String(topic)=="home/nhayden"){
    if (message=="ON"){
      blinking= true;
    }else if(message == "OFF") {
      blinking =false;
    }
  } 
}

// Kết nối đến MQTT Broker và đăng ký các topic
void reconnect() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Thêm username và password khi kết nối đến MQTT Broker
    if (mqttClient.connect("ESP8266Client", mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      // Đăng ký các topic điều khiển
      mqttClient.subscribe("home/led1");
      mqttClient.subscribe("home/fan");
      mqttClient.subscribe("home/ac");
      mqttClient.subscribe("home/all");
      mqttClient.subscribe("home/nhayden");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 2 seconds");
      delay(2000);
    }
  }
}

void setup() {
  setup_wifi();
  Serial.println("NodeMCU connected!");
  blinking= false;
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(callback);

  dht.begin();  // Khởi động cảm biến DHT11

  // Cài đặt các chân output cho thiết bị
  pinMode(LED1, OUTPUT);
  pinMode(FANPIN, OUTPUT);
  pinMode(ACIN, OUTPUT);
  pinMode(ALERT_PIN, OUTPUT); // Đèn cảnh báo

  // Tắt các thiết bị ban đầu
  digitalWrite(LED1, LOW);
  digitalWrite(FANPIN, LOW);
  digitalWrite(ACIN, LOW);
  digitalWrite(ALERT_PIN, LOW); // Tắt đèn cảnh báo
}

void loop() {
  unsigned long currentMillis = millis();

  // Kiểm tra kết nối MQTT
  if (!mqttClient.connected()) {
    reconnect();
  }
  mqttClient.loop();

  // Đọc trạng thái hiện tại của led1, fan, ac
  int currentLedState = digitalRead(LED1);
  int currentFanState = digitalRead(FANPIN);
  int currentAcState = digitalRead(ACIN);
  int currentGioState= digitalRead(ALERT_PIN);

  // Kiểm tra xem có thay đổi trạng thái nào không
  if (currentLedState != prevLedState || currentFanState != prevFanState || currentAcState != prevAcState || currentGioState != prevGioState  ) {
    // Nếu có thay đổi, gửi dữ liệu MQTT

    // Chuyển đổi trạng thái sang ON/OFF
    String ledStatus = (currentLedState == HIGH) ? "ON" : "OFF";
    String fanStatus = (currentFanState == HIGH) ? "ON" : "OFF";
    String acStatus = (currentAcState == HIGH) ? "ON" : "OFF";
    String gioStatus= (currentGioState == HIGH) ? "ON": "OFF";

    // Đóng gói JSON và gửi trạng thái thiết bị qua MQTT
    char statusData[150];
    snprintf(statusData, sizeof(statusData), 
      "{\"led1\": \"%s\", \"fan\": \"%s\", \"ac\": \"%s\", \"all\": \"%s\"}", ledStatus.c_str(), fanStatus.c_str(), acStatus.c_str(), gioStatus.c_str());
    mqttClient.publish("home/status", statusData);  // Gửi lên topic "home/status"

    // Cập nhật trạng thái trước đó thành trạng thái hiện tại
    prevLedState = currentLedState;
    prevFanState = currentFanState;
    prevAcState = currentAcState;
    prevGioState= currentGioState;

    // Debug thông tin trạng thái đã gửi
    Serial.print("LED1: ");
    Serial.print(ledStatus);
    Serial.print(" | Fan: ");
    Serial.print(fanStatus);
    Serial.print(" | AC: ");
    Serial.print(acStatus);
    Serial.print(" | Gio: ");
    Serial.println(gioStatus);
  }

  // Kiểm tra thời gian để gửi dữ liệu cảm biến
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    blinking=false;
    // Đọc dữ liệu từ cảm biến DHT11
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    int lightLevel = 1024- analogRead(LDRPIN);  // Đọc giá trị ánh sáng từ LDR
    

    // Cập nhật giá trị cb1 ngẫu nhiên từ 0-100
    cb1Value = random(0, 101);

    // Gửi dữ liệu cảm biến
    if (isnan(temperature) || isnan(humidity)) {
      temperature= 0;
      humidity=0;
      char sensorData[200];
      snprintf(sensorData, sizeof(sensorData), 
        "{\"temperature\": %.2f, \"humidity\": %.2f, \"lighting\": %d, \"gio\": %d}  ", 
        temperature, humidity, (lightLevel),cb1Value );
      mqttClient.publish("home/sensor", sensorData);  // Cập nhật với topic mong muốn của bạn
    } else {
      // Gửi dữ liệu nhiệt độ, độ ẩm và ánh sáng qua MQTT
      char sensorData[200];
      snprintf(sensorData, sizeof(sensorData), 
        "{\"temperature\": %.2f, \"humidity\": %.2f, \"lighting\": %d, \"gio\": %d}  ", 
        temperature, humidity, (lightLevel),cb1Value );
      mqttClient.publish("home/sensor", sensorData);  // Cập nhật với topic mong muốn của bạn

      // Debugging
      Serial.print("Temperature: ");
      Serial.print(temperature);
      Serial.print(" °C, Humidity: ");
      Serial.print(humidity);
      Serial.print(" %, Light Level: ");
      Serial.print(lightLevel);
      Serial.print(" lux, Gió:  ");
      Serial.println(cb1Value);
    }
  }

  // Nếu đèn cần nháy
  if (blinking) {
    if (currentMillis % 500 < 250) {
      digitalWrite(ALERT_PIN, HIGH); // Bật đèn
    } else {
      digitalWrite(ALERT_PIN, LOW); // Tắt đèn
    }
  }else{
    // digitalWrite(ALERT_PIN, LOW);
  }
}
