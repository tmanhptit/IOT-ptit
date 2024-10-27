// services/mqttService.js
const mqtt = require('mqtt');
const dotenv = require('dotenv');
const EventEmitter = require('events');

dotenv.config();

class MQTTService extends EventEmitter {
  constructor() {
    super();
    this.ioInstance = null;
    this.client = mqtt.connect({
      host: process.env.MQTT_HOST,
      port: process.env.MQTT_PORT,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
    });

    // Biến lưu trạng thái thiết bị hiện tại
    this.currentDeviceStatus = {
      led1: "OFF",
      fan: "OFF",
      ac: "OFF",
      all: "OFF",
    };
    /////////////////////////////////////////// đăng kí topic cho sensor và status
    this.client.on('connect', () => {
      console.log('Kết nối MQTT thành công');
      // Đăng ký các topic cần thiết
      this.client.subscribe('home/sensor', (err) => {
        if (err) {
          console.error('Lỗi khi subscribe home/sensor:', err);
        }
      });
      this.client.subscribe('home/status', (err) => {
        if (err) {
          console.error('Lỗi khi subscribe home/status:', err);
        }
      });
    });
    ////////////////////////////////////////// GỬI sensor và gửi status cho frontend qua newSensorData và deviceStatusUpdate
    this.client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        if (topic === 'home/sensor') {
          const formattedData = {
            temperature: data.temperature,
            humidity: data.humidity,
            light: data.lighting, // Đổi từ 'lighting' thành 'light'
            gio: data.gio,
            createdAt: new Date(),
          };
          if (data.gio > 70) {
            mqttService.client.publish('home/nhayden', "ON", { qos: 1 }, (err) => {
            if (err) {
              console.error('Lỗi khi gửi lệnh MQTT:', err);
              return res.status(500).json({ "ON": 'Lỗi khi gửi lệnh đến MQTT' });
            }
        ///    console.log(`Đã gửi lệnh tới ${"nhayden"}: ${"ON"}`);
          });
          }
          

          // Phát dữ liệu tới frontend qua Socket.io nếu đã thiết lập
          if (this.ioInstance) {
            this.ioInstance.emit('newSensorData', formattedData);
          }
          // Phát sự kiện 'newSensorData' cho các listeners khác (như dataAggregator)
          this.emit('newSensorData', formattedData);
        } else if (topic === 'home/status') {
          // Cập nhật trạng thái thiết bị hiện tại
          this.currentDeviceStatus = {
            led1: data.led1,
            fan: data.fan,
            ac: data.ac,
            all: data.all
          };
          // Phát sự kiện tới frontend
          if (this.ioInstance) {
            this.ioInstance.emit('deviceStatusUpdate', this.currentDeviceStatus);
          }
        }
      } catch (e) {
        console.error('Lỗi phân tích JSON:', e);
      }
    });
  }
  /////////////////////////////////////////// GỬI sensor và gửi status cho frontend qua newSensorData và deviceStatusUpdate

  setIO(io) {
    this.ioInstance = io;
    // Khi một client mới kết nối, gửi trạng thái thiết bị hiện tại
    io.on('connection', (socket) => {
      console.log('Một client đã kết nối');
      socket.emit('deviceStatusUpdate', this.currentDeviceStatus);
    });
  }

  // Hàm để lấy trạng thái thiết bị hiện tại
  getCurrentDeviceStatus() {
    return this.currentDeviceStatus;
  }
}

// Tạo một instance của MQTTService
const mqttService = new MQTTService();
module.exports = mqttService;
