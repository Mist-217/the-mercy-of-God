const STORAGE_KEY = 'menstrual_cycle_data';

let currentViewMonth = new Date();
let cycleData = null;

function init() {
    loadData();
    setupEventListeners();
    setDefaultDate();
    if (cycleData) {
        updateUI();
    }
}

function setDefaultDate() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    document.getElementById('lastPeriod').value = dateStr;
}

function setupEventListeners() {
    document.getElementById('periodForm').addEventListener('submit', handleSubmit);
    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));
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

function getPhase(currentDay, cycleLength) {
    const ovulationDay = cycleLength - 14;
    const periodEnd = 5;
    
    if (currentDay <= periodEnd) {
        return 'period';
    } else if (currentDay < ovulationDay - 4) {
        return 'follicular';
    } else if (currentDay <= ovulationDay + 4) {
        return 'ovulation';
    } else {
        return 'luteal';
    }
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
        
        const dayOfMonth = date.getDate();
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

document.addEventListener('DOMContentLoaded', init);
