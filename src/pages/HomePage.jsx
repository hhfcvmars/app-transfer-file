import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom } from '../utils/api'

function HomePage() {
    const navigate = useNavigate()
    const [joinRoomId, setJoinRoomId] = useState('')
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState('')

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

    // 验证十六进制字符
    const isValidHex = (str) => /^[0-9A-Fa-f]+$/.test(str)

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
        if (!isValidHex(id)) {
            setError('房间号只能包含 0-9 和 A-F')
            return
        }
        navigate(`/room/${id}`)
    }

    return (
        <div className="home-page">
            <div className="home-content">
                {/* 品牌标题 */}
                <header className="brand-header">
                    <h1 className="brand-title">Fasong.xyz</h1>
                    <p className="brand-subtitle">简单、即时的文件传输</p>
                </header>

                {/* 主操作区 */}
                <main className="main-actions">
                    {/* 创建房间 */}
                    <button
                        className="action-btn action-primary"
                        onClick={handleCreate}
                        disabled={creating}
                    >
                        {creating ? (
                            <span className="btn-content">
                                <span className="spinner-simple"></span>
                                创建中
                            </span>
                        ) : (
                            <span className="btn-content">
                                <span>创建传输房间</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 3a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 3z" />
                                </svg>
                            </span>
                        )}
                    </button>

                    {/* 分隔线 */}
                    <div className="divider-simple">
                        <span className="divider-line"></span>
                        <span className="divider-text">or</span>
                        <span className="divider-line"></span>
                    </div>

                    {/* 加入房间 */}
                    <form onSubmit={handleJoin} className="join-form">
                        <input
                            type="text"
                            className="join-input"
                            placeholder="输入4位十六进制编号 (0-9 A-F)"
                            value={joinRoomId}
                            onChange={(e) => {
                                // 只允许输入十六进制字符
                                const value = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '')
                                setJoinRoomId(value)
                            }}
                            maxLength={4}
                        />
                        <button
                            type="submit"
                            className="action-btn action-secondary"
                            disabled={!joinRoomId.trim()}
                        >
                            进入房间
                        </button>
                    </form>
                </main>

                {/* 错误提示 */}
                {error && (
                    <div className="error-toast">
                        {error}
                    </div>
                )}

                {/* 底部说明 */}
                <footer className="home-footer">
                    <p>4位十六进制编号 · 24小时自动删除 · 无需注册</p>
                </footer>
            </div>
        </div>
    )
}

export default HomePage
