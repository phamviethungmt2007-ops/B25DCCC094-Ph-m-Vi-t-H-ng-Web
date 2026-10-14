import { useEffect, useState } from "react";
import "./App.css";

const cities = [
  { name: "Hà Nội", lat: 21.0285, lon: 105.8542 },
  { name: "Hải Phòng", lat: 20.8449, lon: 106.6881 },
  { name: "Huế", lat: 16.4637, lon: 107.5909 },
  { name: "Đà Nẵng", lat: 16.0544, lon: 108.2022 },
  { name: "Nha Trang", lat: 12.2388, lon: 109.1967 },
  { name: "Đà Lạt", lat: 11.9404, lon: 108.4583 },
  { name: "TP. Hồ Chí Minh", lat: 10.8231, lon: 106.6297 },
  { name: "Cần Thơ", lat: 10.0452, lon: 105.7469 },
];

function getWeather(code) {
  if (code === 0) return { icon: "☀️", text: "Trời quang" };
  if (code === 1) return { icon: "🌤️", text: "Ít mây" };
  if (code === 2) return { icon: "⛅", text: "Có mây" };
  if (code === 3) return { icon: "☁️", text: "Nhiều mây" };
  if ([45, 48].includes(code)) return { icon: "🌫️", text: "Sương mù" };
  if ([51, 53, 55, 56, 57].includes(code)) return { icon: "🌦️", text: "Mưa phùn" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: "🌧️", text: "Có mưa" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: "❄️", text: "Có tuyết" };
  if ([95, 96, 99].includes(code)) return { icon: "⛈️", text: "Có dông" };
  return { icon: "🌡️", text: "Chưa xác định" };
}

function formatDate(dateString) {
  const date = new Date(dateString + "T12:00:00");
  return {
    weekday: date.toLocaleDateString("vi-VN", { weekday: "short" }),
    date: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
  };
}

function formatUpdateTime(timeString) {
  if (!timeString) return "Chưa có thông tin";
  const date = new Date(timeString);
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function App() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("C");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!selectedCity) return undefined;

    const controller = new AbortController();

    async function fetchWeather() {
      setLoading(true);
      setError("");
      setWeather(null);

      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${selectedCity.lat}` +
        `&longitude=${selectedCity.lon}` +
        `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&timezone=Asia%2FHo_Chi_Minh&forecast_days=7`;

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("Không thể lấy dữ liệu thời tiết.");

        const data = await response.json();
        if (!data.current || !data.daily) {
          throw new Error("Dữ liệu thời tiết không hợp lệ.");
        }
        setWeather(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Đã xảy ra lỗi khi tải thời tiết.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchWeather();
    return () => controller.abort();
  }, [selectedCity, retry]);

  function showTemperature(value) {
    if (value == null) return "--";
    const converted = unit === "F" ? (value * 9) / 5 + 32 : value;
    return Math.round(converted);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">🌦️</div>
        <div>
          <h1>Weather Vietnam</h1>
          <p>Thông tin thời tiết các thành phố Việt Nam</p>
        </div>
      </header>

      <main className="container">
        <section className="city-section">
          <h2>Chọn thành phố</h2>
          <p className="section-description">
            Chọn một thành phố để xem thời tiết hiện tại và dự báo 7 ngày.
          </p>
          <div className="city-grid">
            {cities.map((city) => (
              <button
                key={city.name}
                className={selectedCity?.name === city.name ? "city-button active" : "city-button"}
                onClick={() => setSelectedCity(city)}
              >
                <span>📍</span>
                {city.name}
              </button>
            ))}
          </div>
        </section>

        {!selectedCity && (
          <section className="message-box">
            <div className="message-icon">🌤️</div>
            <h2>Chào mừng bạn!</h2>
            <p>Vui lòng chọn một thành phố phía trên để xem thông tin thời tiết.</p>
          </section>
        )}

        {selectedCity && (
          <section className="weather-section">
            <div className="section-heading">
              <div>
                <h2>Thời tiết tại {selectedCity.name}</h2>
                <p className="section-description">Dữ liệu từ Open-Meteo</p>
              </div>
              <div className="unit-switch">
                <button className={unit === "C" ? "unit active-unit" : "unit"} onClick={() => setUnit("C")}>°C</button>
                <button className={unit === "F" ? "unit active-unit" : "unit"} onClick={() => setUnit("F")}>°F</button>
              </div>
            </div>

            {loading && (
              <div className="message-box">
                <div className="spinner"></div>
                <h3>Đang tải dữ liệu...</h3>
                <p>Vui lòng chờ trong giây lát.</p>
              </div>
            )}

            {!loading && error && (
              <div className="message-box error-box">
                <div className="message-icon">⚠️</div>
                <h3>Có lỗi xảy ra</h3>
                <p>{error}</p>
                <button className="retry-button" onClick={() => setRetry((value) => value + 1)}>
                  ↻ Thử lại
                </button>
              </div>
            )}

            {!loading && !error && weather && (
              <>
                <div className="current-card">
                  <div className="current-top">
                    <div>
                      <p className="muted">Thời tiết hiện tại</p>
                      <h3>{selectedCity.name}</h3>
                      <p className="muted">Cập nhật: {formatUpdateTime(weather.current.time)}</p>
                    </div>
                    <div className="current-icon">{getWeather(weather.current.weather_code).icon}</div>
                  </div>

                  <div className="temperature">
                    {showTemperature(weather.current.temperature_2m)}<span>°{unit}</span>
                  </div>
                  <p className="weather-description">{getWeather(weather.current.weather_code).text}</p>

                  <div className="current-details">
                    <div className="detail-item">
                      <span className="detail-icon">💧</span>
                      <div>
                        <p>Độ ẩm</p>
                        <strong>{weather.current.relative_humidity_2m}%</strong>
                      </div>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">💨</span>
                      <div>
                        <p>Tốc độ gió</p>
                        <strong>{weather.current.wind_speed_10m} km/h</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <section className="forecast-section">
                  <h2>📅 Dự báo 7 ngày</h2>
                  <p className="section-description">Nhiệt độ cao nhất và thấp nhất từng ngày</p>
                  <div className="forecast-grid">
                    {weather.daily.time.map((date, index) => {
                      const info = getWeather(weather.daily.weather_code[index]);
                      const day = formatDate(date);
                      return (
                        <div className="forecast-card" key={date}>
                          <p className="forecast-day">{day.weekday}</p>
                          <p className="forecast-date">{day.date}</p>
                          <div className="forecast-icon">{info.icon}</div>
                          <p className="forecast-description">{info.text}</p>
                          <div className="forecast-temperatures">
                            <strong>{showTemperature(weather.daily.temperature_2m_max[index])}°</strong>
                            <span>{showTemperature(weather.daily.temperature_2m_min[index])}°</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
          </section>
        )}
      </main>

      <footer>
        <p>
          Dữ liệu thời tiết:{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>
        </p>
      </footer>
    </div>
  );
}
