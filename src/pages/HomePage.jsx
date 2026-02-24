import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom } from '../utils/api'

function HomePage() {
    const navigate = useNavigate()
    const [joinRoomId, setJoinRoomId] = useState('')
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState('')

    // 创建新房间
    const handleCreate = async () => {
        setError('')
        setCreating(true)
        try {
            const data = await createRoom()
            if (data.error) {
                setError(data.error)
            } else {
                navigate(`/room/${data.roomId}`)
            }
        } catch {
            setError('网络错误，请检查连接后重试')
        } finally {
            setCreating(false)
        }
    }

    // 加入已有房间
    const handleJoin = (e) => {
        e.preventDefault()
        setError('')
        const id = joinRoomId.trim().toUpperCase()
        if (!id) {
            setError('请输入房间号')
            return
        }
        if (id.length !== 4) {
            setError('房间号为4位字符')
            return
        }
        navigate(`/room/${id}`)
    }

    // 六边形Logo SVG
    const HexagonLogo = () => (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <defs>
                <linearGradient id="hexGrad" x1="0" y1="0" x2="64" y2="64">
                    <stop offset="0%" stopColor="#00ff9d" />
                    <stop offset="100%" stopColor="#00d4ff" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            {/* 外六边形 */}
            <path 
                d="M32 4L56 18V46L32 60L8 46V18L32 4Z" 
                stroke="url(#hexGrad)" 
                strokeWidth="2" 
                fill="none"
                filter="url(#glow)"
            />
            {/* 内六边形 */}
            <path 
                d="M32 14L48 24V44L32 54L16 44V24L32 14Z" 
                stroke="url(#hexGrad)" 
                strokeWidth="1.5" 
                fill="rgba(0, 255, 157, 0.1)"
            />
            {/* 中心数据传输图标 */}
            <path 
                d="M32 22V42M24 30L32 22L40 30M24 34L32 42L40 34" 
                stroke="url(#hexGrad)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                filter="url(#glow)"
            />
            {/* 数据点 */}
            <circle cx="32" cy="32" r="2" fill="#00ff9d">
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
        </svg>
    )

    return (
        <div className="home-page">
            <div className="home-container">
                {/* 品牌区域 */}
                <div className="brand">
                    <div className="brand-icon">
                        <HexagonLogo />
                    </div>
                    <h1 className="brand-title">NEXUS</h1>
                    <p className="brand-subtitle">跨设备数据传输终端</p>
                </div>

                {/* 功能卡片 */}
                <div className="cards-wrapper">
                    {/* 创建房间 */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-icon">◈</span>
                            <h2>创建传输通道</h2>
                        </div>
                        <p className="card-desc">
                            生成唯一的传输通道，获取专属链接，在其他设备上打开即可开始数据传输
                        </p>
                        <button
                            className="btn btn-primary btn-full"
                            onClick={handleCreate}
                            disabled={creating}
                            id="create-room-btn"
                        >
                            {creating ? (
                                <span className="btn-loading">
                                    <span className="spinner"></span>
                                    初始化中...
                                </span>
                            ) : (
                                <>
                                    <span>创建通道</span>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8.5 2.5a.5.5 0 00-1 0v5.793L5.354 6.146a.5.5 0 10-.707.708l3 3a.5.5 0 00.707 0l3-3a.5.5 0 00-.707-.708L8.5 8.293V2.5z"/>
                                        <path d="M3.5 9.5a.5.5 0 00-1 0v2A2.5 2.5 0 005 14h6a2.5 2.5 0 002.5-2.5v-2a.5.5 0 00-1 0v2A1.5 1.5 0 0111 14H5a1.5 1.5 0 01-1.5-1.5v-2z"/>
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>

                    {/* 分隔线 */}
                    <div className="divider">
                        <span className="divider-line"></span>
                        <span className="divider-text">OR</span>
                        <span className="divider-line"></span>
                    </div>

                    {/* 加入房间 */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-icon">◉</span>
                            <h2>接入现有通道</h2>
                        </div>
                        <form onSubmit={handleJoin}>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="input input-glow"
                                    placeholder="输入4位通道编号"
                                    value={joinRoomId}
                                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                                    maxLength={4}
                                    id="join-room-input"
                                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '4px', textAlign: 'center' }}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-outline btn-full"
                                id="join-room-btn"
                            >
                                <span>接入通道</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path fillRule="evenodd" d="M1 8a.5.5 0 01.5-.5h11.793l-3.147-3.146a.5.5 0 01.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L13.293 8.5H1.5A.5.5 0 011 8z"/>
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="toast toast-error">
                        <span>◉</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* 特性说明 */}
                <div className="features">
                    <div className="feature-item">
                        <span className="feature-icon">◷</span>
                        <div>
                            <h3>24H 存续</h3>
                            <p>通道数据自动过期清理</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">◈</span>
                        <div>
                            <h3>多端同步</h3>
                            <p>任意设备接入即可访问</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">◉</span>
                        <div>
                            <h3>全类型支持</h3>
                            <p>文本与文件无缝传输</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomePage
