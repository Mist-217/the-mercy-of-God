// ============================================
// 社区动态存储配置
// 使用 localStorage + 模拟数据实现
// 如需真正多用户社交功能，需要后端服务
// ============================================

const POSTS_KEY = 'community_posts';
const COMMENTS_KEY = 'community_comments';
const LIKES_KEY = 'post_likes';

// ============================================
// 初始化示例数据（首次访问时）
// ============================================
const SAMPLE_POSTS = [
    {
        id: 'post_1',
        author: '暖心小姐姐',
        content: '来月经前一周总会特别想吃甜食，这是正常的吗？有没有姐妹一样的？',
        likes: 12,
        createdAt: Date.now() - 3600000 * 2
    },
    {
        id: 'post_2',
        author: '健康达人',
        content: '推荐一个缓解痛经的方法：每天晚上用热水泡脚15-20分钟，来月经时真的不那么疼了！',
        likes: 28,
        createdAt: Date.now() - 3600000 * 24
    },
    {
        id: 'post_3',
        author: '美丽天使',
        content: '记录经期真的很有用！我用了这个app三个月，终于找到规律了，周期稳定在28天~',
        likes: 15,
        createdAt: Date.now() - 3600000 * 48
    }
];

const SAMPLE_COMMENTS = {
    'post_1': [
        { id: 'c1', author: '快乐女生', content: '我也会！可能是血糖波动的关系，可以吃点黑巧克力缓解~', createdAt: Date.now() - 3600000 },
        { id: 'c2', author: '匿名姐妹', content: '+1 每次来之前就想吃蛋糕', createdAt: Date.now() - 1800000 }
    ],
    'post_2': [
        { id: 'c3', author: '健康达人', content: '坚持泡脚真的有效！我已经泡了半年了', createdAt: Date.now() - 3600000 * 10 }
    ]
};

// ============================================
// 本地存储配置
// ============================================
const STORAGE_KEY = 'menstrual_cycle_data';

// ============================================
// 全局变量
// ============================================
let currentViewMonth = new Date();
let cycleData = null;

// ============================================
// 初始化
// ============================================
function init() {
    loadData();
    setupEventListeners();
    setDefaultDate();
    
    // 初始化社区数据
    initCommunityData();
    
    // 加载动态列表
    loadPosts();
    
    if (cycleData) {
        updateUI();
    }
}

// ============================================
// 社区数据初始化
// ============================================
function initCommunityData() {
    const posts = localStorage.getItem(POSTS_KEY);
    if (!posts) {
        // 首次访问，初始化示例数据
        localStorage.setItem(POSTS_KEY, JSON.stringify(SAMPLE_POSTS));
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(SAMPLE_COMMENTS));
        localStorage.setItem(LIKES_KEY, JSON.stringify({}));
    }
}

// ============================================
// 经期记录相关函数
// ============================================
function setDefaultDate() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    document.getElementById('lastPeriod').value = dateStr;
}

function setupEventListeners() {
    document.getElementById('periodForm').addEventListener('submit', handleSubmit);
    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));
    
    // 动态发布
    document.getElementById('postBtn').addEventListener('click', handlePostSubmit);
}

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            cycleData = JSON.parse(saved);
            document.getElementById('lastPeriod').value = cycleData.lastPeriod;
            document.getElementById('periodLength').value = cycleData.periodLength;
            document.getElementById('cycleLength').value = cycleData.cycleLength;
        } catch (e) {
            console.error('Failed to parse saved data:', e);
        }
    }
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    cycleData = data;
}

function handleSubmit(e) {
    e.preventDefault();
    
    const lastPeriod = document.getElementById('lastPeriod').value;
    const periodLength = parseInt(document.getElementById('periodLength').value);
    const cycleLength = parseInt(document.getElementById('cycleLength').value);
    
    if (!lastPeriod) {
        alert('请选择上次经期开始日期');
        return;
    }
    
    const data = {
        lastPeriod,
        periodLength,
        cycleLength,
        recordedAt: new Date().toISOString()
    };
    
    saveData(data);
    updateUI();
}

function calculateCycleInfo() {
    if (!cycleData) return null;
    
    const lastPeriodDate = new Date(cycleData.lastPeriod);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const cycleLength = cycleData.cycleLength;
    const periodLength = cycleData.periodLength;
    
    const daysSinceLastPeriod = Math.floor((today - lastPeriodDate) / (1000 * 60 * 60 * 24));
    const currentCycleDay = (daysSinceLastPeriod % cycleLength) + 1;
    
    const nextPeriodDate = new Date(lastPeriodDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);
    
    const daysUntilNextPeriod = Math.ceil((nextPeriodDate - today) / (1000 * 60 * 60 * 24));
    
    const ovulationDate = new Date(nextPeriodDate);
    ovulationDate.setDate(ovulationDate.getDate() - 14);
    
    const ovulationStart = new Date(ovulationDate);
    ovulationStart.setDate(ovulationStart.getDate() - 5);
    
    const ovulationEnd = new Date(ovulationDate);
    ovulationEnd.setDate(ovulationEnd.getDate() + 4);
    
    const periodStart = new Date(lastPeriodDate);
    const periodEnd = new Date(lastPeriodDate);
    periodEnd.setDate(periodEnd.getDate() + periodLength - 1);
    
    const nextPeriodStart = new Date(nextPeriodDate);
    const nextPeriodEnd = new Date(nextPeriodDate);
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + periodLength - 1);
    
    const safePeriod1End = new Date(ovulationStart);
    safePeriod1End.setDate(safePeriod1End.getDate() - 1);
    
    const safePeriod2Start = new Date(ovulationEnd);
    safePeriod2Start.setDate(safePeriod2Start.getDate() + 1);
    
    return {
        lastPeriodDate,
        currentCycleDay,
        nextPeriodDate,
        daysUntilNextPeriod,
        ovulationDate,
        ovulationStart,
        ovulationEnd,
        periodStart,
        periodEnd,
        nextPeriodStart,
        nextPeriodEnd,
        safePeriod1End,
        safePeriod2Start,
        cycleLength,
        periodLength,
        daysSinceLastPeriod
    };
}

function updateUI() {
    const info = calculateCycleInfo();
    if (!info) return;
    
    document.getElementById('statusSection').style.display = 'block';
    document.getElementById('calendarSection').style.display = 'block';
    document.getElementById('predictionSection').style.display = 'block';
    
    document.getElementById('currentDay').textContent = info.currentCycleDay;
    
    const daysText = info.daysUntilNextPeriod > 0 
        ? `${info.daysUntilNextPeriod}天` 
        : '已过期';
    document.getElementById('daysUntilPeriod').textContent = daysText;
    
    const nextPeriodStr = formatDate(info.nextPeriodDate);
    document.getElementById('nextPeriod').textContent = nextPeriodStr;
    
    const progress = (info.currentCycleDay / info.cycleLength) * 100;
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (progress / 100) * circumference;
    document.getElementById('progressBar').style.strokeDashoffset = offset;
    document.getElementById('progressPercent').textContent = Math.round(progress) + '%';
    
    updatePrediction(info);
    renderCalendar(info);
}

function updatePrediction(info) {
    const periodDateStr = `${formatDate(info.nextPeriodStart)} - ${formatDate(info.nextPeriodEnd)}`;
    document.getElementById('periodDate').textContent = periodDateStr;
    
    const ovulationStr = `${formatDate(info.ovulationStart)} - ${formatDate(info.ovulationEnd)}`;
    document.getElementById('ovulationDate').textContent = ovulationStr;
    
    const safeDateStr = `${formatDate(info.safePeriod1End)}前 / ${formatDate(info.safePeriod2Start)}后`;
    document.getElementById('safeDate').textContent = safeDateStr;
}

function formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
}

function navigateMonth(direction) {
    currentViewMonth.setMonth(currentViewMonth.getMonth() + direction);
    const info = calculateCycleInfo();
    if (info) {
        renderCalendar(info);
    }
}

function renderCalendar(info) {
    const year = currentViewMonth.getFullYear();
    const month = currentViewMonth.getMonth();
    
    document.getElementById('currentMonth').textContent = `${year}年${month + 1}月`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const container = document.getElementById('calendarDays');
    container.innerHTML = '';
    
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        container.appendChild(emptyDay);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day has-data';
        dayEl.textContent = day;
        
        if (date.getTime() === today.getTime()) {
            dayEl.classList.add('today');
        }
        
        const dateInRange = (start, end) => {
            return date >= start && date <= end;
        };
        
        if (dateInRange(info.periodStart, info.periodEnd) || 
            dateInRange(info.nextPeriodStart, info.nextPeriodEnd)) {
            dayEl.classList.add('period');
        } else if (dateInRange(info.ovulationStart, info.ovulationEnd)) {
            dayEl.classList.add('ovulation');
        } else if ((date >= info.lastPeriodDate && date < info.ovulationStart) ||
                   (date > info.ovulationEnd && date < info.nextPeriodStart)) {
            dayEl.classList.add('safe');
        } else if (date < info.ovulationStart && date > info.periodEnd) {
            dayEl.classList.add('follicular');
        } else if (date > info.ovulationEnd && date < info.nextPeriodStart) {
            dayEl.classList.add('luteal');
        }
        
        container.appendChild(dayEl);
    }
}

function toggleArticle(header) {
    const card = header.closest('.health-card');
    card.classList.toggle('active');
}

// ============================================
// 社区动态相关函数
// ============================================

// 获取动态列表
function getPosts() {
    const posts = localStorage.getItem(POSTS_KEY);
    return posts ? JSON.parse(posts) : [];
}

// 保存动态列表
function savePosts(posts) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

// 获取评论列表
function getComments() {
    const comments = localStorage.getItem(COMMENTS_KEY);
    return comments ? JSON.parse(comments) : {};
}

// 保存评论列表
function saveComments(comments) {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

// 获取本地点赞记录
function getLikesRecord() {
    const likes = localStorage.getItem(LIKES_KEY);
    return likes ? JSON.parse(likes) : {};
}

// 保存点赞记录
function saveLikesRecord(likes) {
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
}

// 检查是否已点赞
function hasLiked(postId) {
    const likes = getLikesRecord();
    return likes[postId] === true;
}

// 切换点赞状态
function toggleLike(postId) {
    const likes = getLikesRecord();
    const isLiked = hasLiked(postId);
    
    if (isLiked) {
        delete likes[postId];
    } else {
        likes[postId] = true;
    }
    
    saveLikesRecord(likes);
    return !isLiked;
}

// 发布动态
function handlePostSubmit() {
    const content = document.getElementById('postContent').value.trim();
    
    if (!content) {
        alert('请输入内容');
        return;
    }
    
    if (content.length > 500) {
        alert('内容不能超过500字');
        return;
    }
    
    const postBtn = document.getElementById('postBtn');
    postBtn.disabled = true;
    postBtn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> 发布中...';
    
    setTimeout(() => {
        const randomNames = ['匿名姐妹', '暖心小姐姐', '健康达人', '美丽天使', '快乐女生'];
        const author = randomNames[Math.floor(Math.random() * randomNames.length)];
        
        const newPost = {
            id: 'post_' + Date.now(),
            author: author,
            content: content,
            likes: 0,
            createdAt: Date.now()
        };
        
        const posts = getPosts();
        posts.unshift(newPost);
        savePosts(posts);
        
        // 清空输入框
        document.getElementById('postContent').value = '';
        
        // 刷新列表
        loadPosts();
        
        postBtn.disabled = false;
        postBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            发布
        `;
    }, 500);
}

// 加载动态列表
function loadPosts() {
    const loadingEl = document.getElementById('loadingPosts');
    const emptyEl = document.getElementById('emptyPosts');
    const listEl = document.getElementById('postsList');
    
    loadingEl.style.display = 'flex';
    emptyEl.style.display = 'none';
    listEl.innerHTML = '';
    
    setTimeout(() => {
        const posts = getPosts();
        
        loadingEl.style.display = 'none';
        
        if (posts.length === 0) {
            emptyEl.style.display = 'block';
            return;
        }
        
        // 渲染每个动态
        posts.forEach(postData => {
            const postEl = createPostElement(postData);
            listEl.appendChild(postEl);
        });
    }, 300);
}

// 创建动态元素
function createPostElement(postData) {
    const el = document.createElement('div');
    el.className = 'post-card';
    el.dataset.postId = postData.id;
    
    const timeAgo = getTimeAgo(postData.createdAt);
    const isLiked = hasLiked(postData.id);
    const displayLikes = isLiked ? postData.likes + 1 : postData.likes;
    
    const comments = getComments();
    const postComments = comments[postData.id] || [];
    
    el.innerHTML = `
        <div class="post-header">
            <div class="post-avatar">${postData.author.charAt(0)}</div>
            <div class="post-info">
                <div class="post-author">${postData.author}</div>
                <div class="post-time">${timeAgo}</div>
            </div>
        </div>
        <div class="post-content">${escapeHtml(postData.content)}</div>
        <div class="post-actions">
            <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" onclick="handleLike('${postData.id}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span class="like-count">${displayLikes}</span>
            </button>
            <button class="action-btn comment-btn" onclick="toggleComments('${postData.id}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                评论 ${postComments.length > 0 ? postComments.length : ''}
            </button>
        </div>
        <div class="comments-section" id="comments-${postData.id}">
            <div class="comment-input-wrap">
                <input type="text" class="comment-input" placeholder="说点什么..." id="comment-input-${postData.id}" onkeypress="handleCommentKeypress(event, '${postData.id}')">
                <button class="comment-submit" onclick="handleComment('${postData.id}')">发送</button>
            </div>
            <div class="comments-list" id="comments-list-${postData.id}">
                ${renderComments(postComments)}
            </div>
        </div>
    `;
    
    return el;
}

// 渲染评论列表
function renderComments(comments) {
    if (comments.length === 0) {
        return '<div class="no-comments">暂无评论，快来抢沙发~</div>';
    }
    
    return comments.map(comment => `
        <div class="comment-item">
            <div class="comment-avatar">${comment.author.charAt(0)}</div>
            <div class="comment-content">
                <div class="comment-author">${comment.author}</div>
                <div class="comment-text">${escapeHtml(comment.content)}</div>
                <div class="comment-time">${getTimeAgo(comment.createdAt)}</div>
            </div>
        </div>
    `).join('');
}

// 处理点赞
function handleLike(postId) {
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const isNowLiked = toggleLike(postId);
    post.likes = isNowLiked ? post.likes + 1 : post.likes - 1;
    if (post.likes < 0) post.likes = 0;
    savePosts(posts);
    
    // 更新UI
    const postEl = document.querySelector(`[data-post-id="${postId}"]`);
    const likeBtn = postEl.querySelector('.like-btn');
    const likeCount = postEl.querySelector('.like-count');
    
    likeBtn.classList.toggle('liked', isNowLiked);
    likeCount.textContent = isNowLiked ? post.likes + 1 : post.likes;
    
    const svg = likeBtn.querySelector('svg');
    svg.setAttribute('fill', isNowLiked ? 'currentColor' : 'none');
}

// 切换评论显示
function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.classList.toggle('show');
    
    if (commentsSection.classList.contains('show')) {
        setTimeout(() => {
            document.getElementById(`comment-input-${postId}`).focus();
        }, 100);
    }
}

// 发送评论
function handleComment(postId) {
    const inputEl = document.getElementById(`comment-input-${postId}`);
    const content = inputEl.value.trim();
    
    if (!content) {
        alert('请输入评论内容');
        return;
    }
    
    if (content.length > 200) {
        alert('评论不能超过200字');
        return;
    }
    
    const randomNames = ['匿名姐妹', '暖心小姐姐', '健康达人', '美丽天使', '快乐女生'];
    const author = randomNames[Math.floor(Math.random() * randomNames.length)];
    
    const newComment = {
        id: 'comment_' + Date.now(),
        author: author,
        content: content,
        createdAt: Date.now()
    };
    
    const comments = getComments();
    if (!comments[postId]) {
        comments[postId] = [];
    }
    comments[postId].push(newComment);
    saveComments(comments);
    
    // 更新UI
    const listEl = document.getElementById(`comments-list-${postId}`);
    listEl.innerHTML = renderComments(comments[postId]);
    
    // 更新评论数
    const postEl = document.querySelector(`[data-post-id="${postId}"]`);
    const commentBtn = postEl.querySelector('.comment-btn');
    commentBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        评论 ${comments[postId].length}
    `;
    
    // 清空输入框
    inputEl.value = '';
}

// 回车发送评论
function handleCommentKeypress(event, postId) {
    if (event.key === 'Enter') {
        handleComment(postId);
    }
}

// 工具函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}-${date.getDate()}`;
}

// 初始化
document.addEventListener('DOMContentLoaded', init);
