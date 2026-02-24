import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    getRoomData, sendTextMessage, sendFileMessage,
    deleteMessage, deleteRoom, uploadFile
} from '../utils/api'
import MessageItem from '../components/MessageItem'

const ROOM_ID_KEY = 'nexus_room_id'

function RoomPage() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const [messages, setMessages] = useState([])
    const [textInput, setTextInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState('')
    const [roomNotFound, setRoomNotFound] = useState(false)
    const [copied, setCopied] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)

    const fetchRoom = useCallback(async () => {
        try {
            const data = await getRoomData(roomId)
            if (data.error) {
                if (data.error.includes('不存在') || data.error.includes('过期')) {
                    setRoomNotFound(true)
                }
                if (!roomNotFound) setError(data.error)
                return
            }
            setMessages(data.messages || [])
            setError('')
        } catch {
            setError('网络连接失败')
        } finally {
            setLoading(false)
        }
    }, [roomId, roomNotFound])

    useEffect(() => {
        fetchRoom()
        const interval = setInterval(fetchRoom, 5000)
        return () => clearInterval(interval)
    }, [fetchRoom])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendText = async () => {
        const content = textInput.trim()
        if (!content || sending) return

        setSending(true)
        setError('')
        try {
            const data = await sendTextMessage(roomId, content)
            if (data.error) {
                setError(data.error)
            } else {
                setTextInput('')
                await fetchRoom()
            }
        } catch {
            setError('发送失败')
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            handleSendText()
        }
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setUploadProgress(0)
        setError('')

        try {
            const fileUrl = await uploadFile(file, (percent) => {
                setUploadProgress(percent)
            })

            const msgData = await sendFileMessage(roomId, {
                fileName: file.name,
                fileSize: file.size,
                fileUrl,
            })

            if (msgData.error) {
                setError(msgData.error)
            } else {
                await fetchRoom()
            }
        } catch (err) {
            setError('文件上传失败: ' + err.message)
        } finally {
            setUploading(false)
            setUploadProgress(0)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDelete = async (messageId) => {
        try {
            const data = await deleteMessage(roomId, messageId)
            if (data.error) {
                setError(data.error)
            } else {
                await fetchRoom()
            }
        } catch {
            setError('删除失败')
        }
    }

    // 删除通道
    const handleDeleteRoom = async () => {
        setDeleting(true)
        try {
            const data = await deleteRoom(roomId)
            if (data.error) {
                setError(data.error)
            } else {
                // 清除本地存储的房间号
                localStorage.removeItem(ROOM_ID_KEY)
                navigate('/')
            }
        } catch {
            setError('删除失败')
        } finally {
            setDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    const handleCopyLink = async () => {
        const link = `${window.location.origin}/${roomId}`
        try {
            await navigator.clipboard.writeText(link)
        } catch {
            const ta = document.createElement('textarea')
            ta.value = link
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // 退出通道（仅清除本地记录）
    const handleExit = () => {
        localStorage.removeItem(ROOM_ID_KEY)
        navigate('/')
    }

    if (roomNotFound) {
        return (
            <div className="room-page">
                <div className="room-not-found">
                    <div className="not-found-icon">◌</div>
                    <h2>房间不存在</h2>
                    <p>该房间可能已过期或从未创建</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        返回首页
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="room-page">
            {/* 顶部导航 */}
            <header className="room-header">
                <div className="header-left">
                    <button className="btn-icon" onClick={handleExit} title="退出通道">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V4a1 1 0 00-1-1H3zm6.707 4.293a1 1 0 010 1.414L7.414 11H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                        </svg>
                    </button>
                    <div className="header-room-info">
                        <span className="header-label">房间</span>
                        <span className="header-room-id">{roomId}</span>
                    </div>
                </div>
                <div className="header-right">
                    <button
                        className={`btn btn-sm ${copied ? 'btn-secondary' : 'btn-secondary'}`}
                        onClick={handleCopyLink}
                        style={copied ? { background: '#dcfce7', borderColor: '#86efac', color: '#16a34a' } : {}}
                    >
                        {copied ? '已复制' : '复制房间链接'}
                    </button>
                    <button
                        className="btn btn-sm btn-delete"
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{ marginLeft: '8px', border: '1px solid #fecaca', color: '#dc2626' }}
                    >
                        删除通道
                    </button>
                </div>
            </header>

            {/* 消息列表 */}
            <main className="room-messages">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner spinner-dark"></div>
                        <p>加载中...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">◌</div>
                        <h3>https://fasong.xyz</h3>
                        <p>其他设备接入相同房间即可查看</p>
                        <p>数据24小时后销毁</p>
                    </div>
                ) : (
                    <div className="messages-list">
                        {messages.map((msg) => (
                            <MessageItem key={msg.id} message={msg} onDelete={handleDelete} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            {/* 上传进度条 */}
            {uploading && (
                <div className="upload-progress-bar">
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <span className="progress-text">{uploadProgress}%</span>
                </div>
            )}

            {/* 错误提示 */}
            {error && !roomNotFound && (
                <div className="toast toast-error" style={{ bottom: '100px' }}>
                    <span>{error}</span>
                    <button className="toast-close" onClick={() => setError('')}>×</button>
                </div>
            )}

            {/* 删除确认弹窗 */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>确认删除</h3>
                        <p>确定要删除此通道吗？</p>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
                            删除后所有数据将被清除且无法恢复
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                            >
                                取消
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDeleteRoom}
                                disabled={deleting}
                            >
                                {deleting ? '删除中...' : '确认删除'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 底部输入区域 */}
            <footer className="room-input">
                <div className="input-row">
                    <textarea
                        className="input input-message"
                        placeholder="输入内容... (Ctrl+Enter 发送)"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={2}
                    />
                    <div className="input-actions">
                        <label className={`btn-icon btn-upload ${uploading ? 'disabled' : ''}`} title="上传文件">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                            </svg>
                            <input
                                ref={fileInputRef}
                                type="file"
                                hidden
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </label>
                        <button
                            className="btn-send"
                            onClick={handleSendText}
                            disabled={!textInput.trim() || sending}
                        >
                            {sending ? (
                                <span className="spinner"></span>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default RoomPage
