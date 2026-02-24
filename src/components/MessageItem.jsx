import { useState } from 'react'
import { formatFileSize, formatTime } from '../utils/api'

// 判断文件类型
const getFileType = (fileName) => {
    if (!fileName) return 'other'
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image'
    if (['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v'].includes(ext)) return 'video'
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return 'audio'
    if (['pdf'].includes(ext)) return 'pdf'
    return 'other'
}

// 文件图标
const getFileIcon = (fileName) => {
    const type = getFileType(fileName)
    if (type === 'image') return '◈'
    if (type === 'video') return '◉'
    if (type === 'audio') return '◌'
    if (type === 'pdf') return '◊'
    if (!fileName) return '◎'
    const ext = fileName.split('.').pop()?.toLowerCase()
    const iconMap = {
        doc: '◊', docx: '◊', xls: '◊', xlsx: '◊',
        ppt: '◊', pptx: '◊', zip: '◆', rar: '◆', '7z': '◆',
        txt: '◌', json: '◈', csv: '◈', md: '◌',
        js: '◉', ts: '◉', py: '◉', java: '◉', html: '◉', css: '◉',
        apk: '◊', ipa: '◊', exe: '◎', dmg: '◎',
    }
    return iconMap[ext] || '◎'
}

function MessageItem({ message, onDelete, index = 0 }) {
    const [copying, setCopying] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)

    // 复制文本
    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text)
        } catch {
            const ta = document.createElement('textarea')
            ta.value = text
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
        }
        setCopying(true)
        setTimeout(() => setCopying(false), 1500)
    }

    // 下载文件
    const handleDownload = async (e) => {
        e.preventDefault()
        try {
            const response = await fetch(message.fileUrl)
            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = message.fileName || 'download'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(blobUrl)
        } catch {
            window.open(message.fileUrl, '_blank')
        }
    }

    // 删除消息
    const handleDelete = async () => {
        if (deleting) return
        setDeleting(true)
        await onDelete(message.id)
        setDeleting(false)
    }

    // 动画延迟
    const animationDelay = `${index * 0.05}s`

    // ===== 文本消息 =====
    if (message.type === 'text') {
        return (
            <div 
                className="msg-card msg-text-card" 
                style={{ animationDelay }}
            >
                <div className="msg-text-body">
                    <pre className="msg-text-content">{message.content}</pre>
                </div>
                <div className="msg-bottom">
                    <span className="msg-time">{formatTime(message.timestamp)}</span>
                    <div className="msg-actions">
                        <button
                            className={`msg-action-btn msg-copy-btn ${copying ? 'copied' : ''}`}
                            onClick={() => handleCopy(message.content)}
                            title="复制文本"
                        >
                            {copying ? (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    <span>已复制</span>
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                    <span>复制</span>
                                </>
                            )}
                        </button>
                        <button
                            className="msg-action-btn msg-delete-btn"
                            onClick={handleDelete}
                            disabled={deleting}
                            title="删除"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ===== 文件消息 =====
    if (message.type === 'file') {
        const fileType = getFileType(message.fileName)

        return (
            <div 
                className="msg-card msg-file-card"
                style={{ animationDelay }}
            >
                {/* 图片预览 */}
                {fileType === 'image' && (
                    <div className="msg-preview msg-image-preview" onClick={() => setPreviewOpen(true)}>
                        <img src={message.fileUrl} alt={message.fileName} loading="lazy" />
                        <div className="preview-overlay">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="11" y1="8" x2="11" y2="14"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                            <span>查看大图</span>
                        </div>
                    </div>
                )}

                {/* 视频预览 */}
                {fileType === 'video' && (
                    <div className="msg-preview msg-video-preview">
                        <video
                            src={message.fileUrl}
                            controls
                            preload="metadata"
                            playsInline
                        >
                            你的浏览器不支持视频播放
                        </video>
                    </div>
                )}

                {/* 音频预览 */}
                {fileType === 'audio' && (
                    <div className="msg-preview msg-audio-preview">
                        <audio src={message.fileUrl} controls preload="metadata">
                            你的浏览器不支持音频播放
                        </audio>
                    </div>
                )}

                {/* 文件信息栏 */}
                <div className="msg-file-row">
                    <span className="msg-file-icon">{getFileIcon(message.fileName)}</span>
                    <div className="msg-file-info">
                        <span className="msg-file-name">{message.fileName}</span>
                        <span className="msg-file-size">{formatFileSize(message.fileSize)}</span>
                    </div>
                    <a
                        href={message.fileUrl}
                        className="msg-download-btn"
                        onClick={handleDownload}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span>下载</span>
                    </a>
                </div>

                <div className="msg-bottom">
                    <span className="msg-time">{formatTime(message.timestamp)}</span>
                    <div className="msg-actions">
                        <button
                            className="msg-action-btn msg-copy-btn"
                            onClick={() => handleCopy(message.fileUrl)}
                            title="复制链接"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                        </button>
                        <button
                            className="msg-action-btn msg-delete-btn"
                            onClick={handleDelete}
                            disabled={deleting}
                            title="删除"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 图片大图预览弹窗 */}
                {previewOpen && fileType === 'image' && (
                    <div className="lightbox" onClick={() => setPreviewOpen(false)}>
                        <button className="lightbox-close" onClick={() => setPreviewOpen(false)}>×</button>
                        <img src={message.fileUrl} alt={message.fileName} onClick={(e) => e.stopPropagation()} />
                    </div>
                )}
            </div>
        )
    }

    return null
}

export default MessageItem
