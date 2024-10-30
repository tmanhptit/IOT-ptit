// controllers/controlController.js
const mqttService = require('../services/mqttService');
const ActionData = require('../models/ActionData');

exports.controlDevice = async (req, res) => {
  const { device, action } = req.body;

  let topic = '';
  let message = '';

  // Xác định topic và message dựa trên thiết bị và hành động
  switch (device) {
    case 'quạt':
      topic = 'home/fan';
      message = action === 'on' ? 'ON' : 'OFF';
      break;
    case 'điều hòa':
      topic = 'home/ac';
      message = action === 'on' ? 'ON' : 'OFF';
      break;
    case 'đèn':
      topic = 'home/led1';
      message = action === 'on' ? 'ON' : 'OFF';
      break;
    case 'đèn cảnh báo':
      topic = 'home/all';
      message = action === 'on' ? 'ON' : 'OFF';
      break;
    default:
      return res.status(400).json({ message: 'Thiết bị không hợp lệ' });
  }

  // Gửi lệnh tới MQTT broker sử dụng MQTT client đã kết nối
  mqttService.client.publish(topic, message, { qos: 1 }, (err) => {
    if (err) {
      console.error('Lỗi khi gửi lệnh MQTT:', err);
      return res.status(500).json({ message: 'Lỗi khi gửi lệnh đến MQTT' });
    }

    console.log(`Đã gửi lệnh tới ${topic}: ${message}`);
    res.json({ message: `${device} đã được ${action === 'on' ? 'bật' : 'tắt'}` });
  });
  const actionData = new ActionData({
    device,   // Sử dụng đúng tên biến
    status: action,
    // 'time' sẽ tự động được đặt bởi default trong schema
  });
  await actionData.save();
};

// controllers/ActionData.js
exports.getActionData = async (req, res) => {
  try {
    const { device, status, time, page = 1, limit = 10, order } = req.query;
    const filter = {};
    const sort = {};

    if (device) {
      filter.device = device;
    }
    if (status) {
      filter.status = status;
    }
    if (time) {
      const dateValue = new Date(time);
      if (!isNaN(dateValue.getTime())) {
        const startDate = new Date(dateValue);
        startDate.setSeconds(0, 0); // Đặt giây và mili giây thành 0

        const endDate = new Date(startDate);
        endDate.setMinutes(startDate.getMinutes() + 1); // Thêm 1 phút để lấy khoảng thời gian đến hết phút đó

        filter.time = {
          $gte: startDate,
          $lt: endDate
        };
      }
    }
    // Parse the order query parameter
    if (order) {
      const orderBy = JSON.parse(order);
      orderBy.forEach(o => {
        // Sort by MongoDB field name (adjust if necessary)
        sort['time'] = o.dir === 'asc' ? 1 : -1; // Assuming time is the field you want to sort by
      });
    }
    // Tính toán số lượng bản ghi
    const totalCount = await ActionData.countDocuments(filter);
    const data = await ActionData.find(filter)
      .sort(sort) // Use the sort object to sort the results
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({
      totalCount,
      filteredCount: totalCount, // Nếu bạn có bộ lọc, hãy cập nhật số lượng này
      data
    });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu sensor:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu sensor' });
  }
};
