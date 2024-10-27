const SensorData = require('../models/SensorData');
// const Gio = require('../models/gio'); // Thêm mô hình Gio

let latestData = null;

const startDataAggregation = (mqttService) => {

  mqttService.on('newSensorData', async (data) => {
    latestData = data;
    if (latestData) {
      try {
        const dataToSave = {
          temperature: latestData.temperature,
          humidity: latestData.humidity,
          light: latestData.light,
          gio: latestData.gio,
          createdAt: latestData.createdAt,
        };
        await SensorData.create(dataToSave);
       // console.log('Dữ liệu sensor đã được lưu vào MongoDB:', dataToSave);
      } catch (error) {
        console.error('Lỗi khi lưu dữ liệu vào MongoDB:', error);
      }
    } else {
      console.log('Không có dữ liệu sensor mới để lưu.');
    }
  }, 1000 * 20); // Thời gian bao lâu thì lưu data 1 lần
};


const getGioCount = async (req, res) => {
  try {
    // Lấy ngày hiện tại và trừ đi 7 giờ để khớp với thời gian trong db
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() - 7);

    // Tạo khoảng thời gian từ đầu ngày đến cuối ngày hiện tại
    const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

    // Đếm số bản ghi trong khoảng thời gian đã chỉ định
    const gioCount = await SensorData.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      gio: { $gt: 70 }  // Thêm điều kiện gio > 70
    });

    res.json({ count: gioCount });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu gió', error });
  }
};



module.exports = { startDataAggregation, getGioCount };

