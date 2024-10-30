// controllers/sensorController.js lấy dữ liệu cho api sensor-data
const SensorData = require('../models/SensorData');

exports.getSensorData = async (req, res) => {
  try {
    const { temperature, humidity, light, gio, createdAt, page = 1, limit = 10, order } = req.query;
    const filter = {};
    const sort = {};

    if (temperature) {
      const tempValue = parseFloat(temperature);
      if (!isNaN(tempValue)) {
        filter.temperature = tempValue;
      }
    }
    if (humidity) {
      const humidityValue = parseInt(humidity);
      if (!isNaN(humidityValue)) {
        filter.humidity = humidityValue;
      }
    }
    if (light) {
      const lightValue = parseInt(light);
      if (!isNaN(lightValue)) {
        filter.light = lightValue;
      }
    }
    if (gio) {
      const gioValue = parseInt(gio);
      if (!isNaN(gioValue)) {
        filter.gio = gioValue;
      }
    }
    if (createdAt) {
      const dateValue = new Date(createdAt);
      if (!isNaN(dateValue.getTime())) {
        const startDate = new Date(dateValue);
        startDate.setSeconds(0, 0); // Đặt giây và mili giây thành 0

        const endDate = new Date(startDate);
        endDate.setMinutes(startDate.getMinutes() + 1); // Thêm 1 phút để lấy khoảng thời gian đến hết phút đó

        filter.createdAt = {
          $gte: startDate,
          $lt: endDate
        };
      }
    }
    // Parse the order query parameter
    if (order) {
      const orderBy = JSON.parse(order);
      orderBy.forEach(o => {
        // Sort by the specified field name
        sort[o.column] = o.dir === 'asc' ? 1 : -1; // Using the specified column to sort
      });
    }
    // Tính toán số lượng bản ghi
    const totalCount = await SensorData.countDocuments(filter);
    const data = await SensorData.find(filter)
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
