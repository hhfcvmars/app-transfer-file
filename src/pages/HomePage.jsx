import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom } from '../utils/api'

const ROOM_ID_KEY = 'nexus_room_id'

function HomePage() {
    const navigate = useNavigate()
    const [joinRoomId, setJoinRoomId] = useState('')
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState('')

    // 检查是否有已创建的房间，自动跳转
    useEffect(() => {
        const savedRoomId = localStorage.getItem(ROOM_ID_KEY)
        if (savedRoomId) {
            navigate(`/${savedRoomId}`)
        }
    }, [navigate])

    const handleCreate = async () => {
        setError('')
        setCreating(true)
        try {
            const data = await createRoom()
            if (data.error) {
                setError(data.error)
            } else {
                // 保存房间号到 localStorage
                localStorage.setItem(ROOM_ID_KEY, data.roomId)
                navigate(`/${data.roomId}`)
            }
        } catch {
            setError('网络错误，请检查连接后重试')
        } finally {
            setCreating(false)
        }
    }

    // 验证房间号格式：前3位数字，第4位A-F字母
    const isValidRoomId = (str) => {
        if (str.length !== 4) return false
        const digits = str.substring(0, 3)
        const letter = str.substring(3, 4)
        return /^[0-9]{3}$/.test(digits) && /^[A-F]$/.test(letter)
    }

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
        if (!isValidRoomId(id)) {
            setError('房间号格式：3位数字 + 1位字母(A-F)')
            return
        }
        navigate(`/${id}`)
    }

    return (
        <div className="home-page">
            <div className="home-content">
                {/* 品牌标题 */}
                <header className="brand-header">
                    <h1 className="brand-title">Fasong.xyz</h1>
                    <p className="brand-subtitle">简单、即时的文件发送</p>
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
                            placeholder="输入房间号 (如: 123A)"
                            value={joinRoomId}
                            onChange={(e) => {
                                const input = e.target.value.toUpperCase()
                                let value = ''

                                // 根据位置限制字符类型
                                for (let i = 0; i < input.length && i < 4; i++) {
                                    const char = input[i]
                                    if (i < 3) {
                                        // 前3位只能是数字
                                        if (/[0-9]/.test(char)) {
                                            value += char
                                        }
                                    } else {
                                        // 第4位只能是A-F
                                        if (/[A-F]/.test(char)) {
                                            value += char
                                        }
                                    }
                                }
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
                {/* <footer className="home-footer">
                    <p>文件24小时后自动删除</p>
                </footer> */}
            </div>
        </div>
    )
}

export default HomePage
