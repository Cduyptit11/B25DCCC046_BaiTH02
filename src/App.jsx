
import { useEffect, useState } from 'react'
import './App.css'

const cities = [
  { name: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { name: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { name: 'Huế', lat: 16.4637, lon: 107.5909 },
  { name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { name: 'Nha Trang', lat: 12.2388, lon: 109.1967 },
  { name: 'Đà Lạt', lat: 11.9404, lon: 108.4583 },
  { name: 'TP. Hồ Chí Minh', lat: 10.8231, lon: 106.6297 },
  { name: 'Cần Thơ', lat: 10.0452, lon: 105.7469 },
]

function getWeather(code) {
  if (code === 0) return { icon: '☀️', desc: 'Trời quang' }
  if (code === 1) return { icon: '🌤️', desc: 'Ít mây' }
  if (code === 2) return { icon: '⛅', desc: 'Có mây' }
  if (code === 3) return { icon: '☁️', desc: 'Nhiều mây' }
  if ([45, 48].includes(code))
    return { icon: '🌫️', desc: 'Sương mù' }
  if ([51, 53, 55, 56, 57].includes(code))
    return { icon: '🌦️', desc: 'Mưa phùn' }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { icon: '🌧️', desc: 'Có mưa' }
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { icon: '🌨️', desc: 'Tuyết' }
  if ([95, 96, 99].includes(code))
    return { icon: '⛈️', desc: 'Dông' }
  return { icon: '🌡️', desc: 'Không xác định' }
}

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  })
}

function App() {
  const [selectedCity, setSelectedCity] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unit, setUnit] = useState('C')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!selectedCity) return

    const controller = new AbortController()

    async function fetchWeather() {
      setLoading(true)
      setError('')
      setWeather(null)

      const url = new URL('https://api.open-meteo.com/v1/forecast')
      url.search = new URLSearchParams({
        latitude: selectedCity.lat,
        longitude: selectedCity.lon,
        current:
          'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        daily:
          'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'Asia/Ho_Chi_Minh',
        forecast_days: '7',
      }).toString()

      try {
        const response = await fetch(url, {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error('Không thể tải dữ liệu thời tiết.')

        const data = await response.json()

        if (!data.current || !data.daily) {
          throw new Error('Dữ liệu thời tiết không hợp lệ.')
        }

        setWeather(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Đã xảy ra lỗi kết nối.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchWeather()

    return () => controller.abort()
  }, [selectedCity, retry])

  function temperature(celsius) {
    const value = unit === 'C' ? celsius : celsius * 9 / 5 + 32
    return `${Math.round(value)}°${unit}`
  }

  return (
    <main className="app">
      <header className="page-header">
        <div className="logo">🌦️</div>
        <h1>Thời tiết Việt Nam</h1>
        <p>Theo dõi thời tiết và dự báo 7 ngày tại 8 thành phố</p>
      </header>

      <section className="city-section">
        <h2>📍 Chọn thành phố</h2>

        <div className="city-list">
          {cities.map((city) => (
            <button
              key={city.name}
              className={
                selectedCity?.name === city.name ? 'city active' : 'city'
              }
              onClick={() => setSelectedCity(city)}
            >
              {city.name}
              {selectedCity?.name === city.name && <span> ✓</span>}
            </button>
          ))}
        </div>
      </section>

      {!selectedCity && (
        <section className="message">
          <div className="big-icon">🌏</div>
          <h2>Chào mừng bạn!</h2>
          <p>Hãy chọn một thành phố phía trên để xem thời tiết.</p>
        </section>
      )}

      {selectedCity && (
        <section className="weather-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THỜI TIẾT TẠI</p>
              <h2>{selectedCity.name}</h2>
            </div>

            <div className="unit-switch">
              <button
                className={unit === 'C' ? 'selected' : ''}
                onClick={() => setUnit('C')}
              >
                °C
              </button>
              <button
                className={unit === 'F' ? 'selected' : ''}
                onClick={() => setUnit('F')}
              >
                °F
              </button>
            </div>
          </div>

          {loading && (
            <div className="message">
              <div className="big-icon">⏳</div>
              <h3>Đang tải dữ liệu...</h3>
              <p>Vui lòng đợi trong giây lát.</p>
            </div>
          )}

          {!loading && error && (
            <div className="message error">
              <div className="big-icon">⚠️</div>
              <h3>Không thể tải thời tiết</h3>
              <p>{error}</p>
              <button className="retry-button" onClick={() => setRetry((n) => n + 1)}>
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && weather && (
            <>
              <div className="current-card">
                <div className="current-main">
                  <div>
                    <p className="eyebrow">THỜI TIẾT HIỆN TẠI</p>
                    <div className="current-temp">
                      {temperature(weather.current.temperature_2m)}
                    </div>
                    <h3>
                      {getWeather(weather.current.weather_code).desc}
                    </h3>
                  </div>
                  <div className="current-icon">
                    {getWeather(weather.current.weather_code).icon}
                  </div>
                </div>

                <div className="weather-details">
                  <div className="detail">
                    <span>💧</span>
                    <div>
                      <p>Độ ẩm</p>
                      <strong>{weather.current.relative_humidity_2m}%</strong>
                    </div>
                  </div>
                  <div className="detail">
                    <span>💨</span>
                    <div>
                      <p>Tốc độ gió</p>
                      <strong>{weather.current.wind_speed_10m} km/h</strong>
                    </div>
                  </div>
                </div>

                <p className="updated">
                  Cập nhật: {new Date(weather.current.time).toLocaleString(
                    'vi-VN',
                    { dateStyle: 'short', timeStyle: 'short' }
                  )}
                </p>
              </div>

              <div className="forecast-heading">
                <div>
                  <p className="eyebrow">DỰ BÁO THỜI TIẾT</p>
                  <h2>7 ngày tới</h2>
                </div>
                <span>📅 7 ngày</span>
              </div>

              <div className="forecast-list">
                {weather.daily.time.map((date, index) => {
                  const info = getWeather(weather.daily.weather_code[index])

                  return (
                    <article className="forecast-card" key={date}>
                      <p className="forecast-day">{formatDate(date)}</p>
                      <div className="forecast-icon">{info.icon}</div>
                      <p className="forecast-desc">{info.desc}</p>
                      <div className="forecast-temps">
                        <strong>
                          {temperature(weather.daily.temperature_2m_max[index])}
                        </strong>
                        <span>
                          {temperature(weather.daily.temperature_2m_min[index])}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </section>
      )}

      <footer>© 2026 · Dữ liệu thời tiết từ Open-Meteo</footer>
    </main>
  )
}

export default App
