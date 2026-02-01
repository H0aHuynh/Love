const yourDate = new Date("2025-12-19T00:00:00");
const music = ['ido'];

document.addEventListener('DOMContentLoaded', function () {
    const rootTime = document.querySelector("time");
    const anniElement = document.querySelector("anni");
    const dateElement = document.querySelector("date");

    // Format ngày kỷ niệm (dd-mm-yyyy)
    const day = yourDate.getDate().toString().padStart(2, '0');
    const month = (yourDate.getMonth() + 1).toString().padStart(2, '0');
    const year = yourDate.getFullYear();
    anniElement.textContent = `${day}-${month}-${year}`;

    // Tính số ngày
    let currentDays = Math.floor((new Date() - yourDate) / (1000 * 60 * 60 * 24));
    dateElement.textContent = `${currentDays} Ngày`;

    // Hàm update đồng hồ
    function updateClock() {
        const now = new Date();
        const diffMs = now - yourDate;

        const hrs = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
        const min = Math.floor(diffMs / (1000 * 60)) % 60;
        const sec = Math.floor(diffMs / 1000) % 60;

        rootTime.textContent = `${hrs.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Random nhạc
    const randomSong = music[Math.floor(Math.random() * music.length)];
    document.querySelector("audio").setAttribute("src", `music/${randomSong}.mp3`);

    // Thêm mask (giữ nguyên code cũ của bạn)
    document.body.insertAdjacentHTML("beforeend", "<div id='mask'></div>");

    // === TÍNH NĂNG BADGE TRÊN ICON iOS ===
    async function updateBadge(days) {
        if ('setAppBadge' in navigator) {
            try {
                if (days > 0) {
                    await navigator.setAppBadge(days);  // Hiển thị số ngày (ví dụ: 365)
                    console.log(`Badge set to ${days}`);
                } else {
                    await navigator.clearAppBadge();
                    console.log('Badge cleared');
                }
            } catch (error) {
                console.error('Error setting badge:', error);
            }
        } else {
            console.log('Badging API not supported');
        }
    }

    // Gọi lần đầu
    updateBadge(currentDays);

    // Update badge khi số ngày thay đổi (kiểm tra mỗi giờ để bắt đầu ngày mới)
    setInterval(() => {
        const newDays = Math.floor((new Date() - yourDate) / (1000 * 60 * 60 * 24));
        if (newDays !== currentDays) {
            currentDays = newDays;
            dateElement.textContent = `${currentDays} Ngày`;
            updateBadge(currentDays);
        }
    }, 3600000);  // 1 giờ

    // === GUIDE cho người dùng iOS (nếu mở từ Home Screen và chưa có quyền) ===
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (navigator.standalone === true);

    if (isStandalone && 'Notification' in window && Notification.permission !== 'granted') {
        // Tạo guide nếu chưa có
        const guide = document.createElement('div');
        guide.id = 'badge-guide';
        guide.style.cssText = 'background:#fff8e1; padding:15px; margin:20px auto; max-width:90%; border-radius:12px; text-align:center; font-size:0.95em; color:#d32f2f;';
        guide.innerHTML = `
            <strong>❤️ Muốn thấy số ngày kỷ niệm trên icon màn hình chính?</strong><br>
            1. Đảm bảo đang mở từ icon Home Screen (không phải Safari tab).<br>
            2. Vào Cài đặt iPhone > Thông báo > "Tình Yêu" > Bật "Cho phép thông báo".<br>
            3. Quay lại app → số ngày sẽ hiện trên icon! ✨<br>
            (Chỉ làm 1 lần thôi)
        `;
        document.getElementById('wrapper').appendChild(guide);
    }

}, false);
