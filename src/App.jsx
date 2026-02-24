import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RoomPage from './pages/RoomPage'

function App() {
  return (
    <div className="app">
      {/* 网格背景 */}
      <div className="bg-grid"></div>
      
      {/* 动态背景光斑 */}
      <div className="bg-animation">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>
      
      {/* 数据流动画 */}
      <div className="data-stream"></div>
      <div className="data-stream data-stream-2"></div>
      <div className="data-stream data-stream-3"></div>
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </div>
  )
}

export default App
