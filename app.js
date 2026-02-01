const yourDate = new Date("2025-12-19T00:00:00"); // Ngày bắt đầu kỷ niệm
const music = ['ido', 'noinaycoanh', 'nguoiamphu']; // Danh sách nhạc

document.addEventListener('DOMContentLoaded', async function () {
    const rootTime = document.querySelector("time");
    const anniElement = document.querySelector("anni");
    const dateElement = document.querySelector("date");

    // Format ngày kỷ niệm (dd-mm-yyyy)
    const day = yourDate.getDate().toString().padStart(2, '0');
    const month = (yourDate.getMonth() + 1).toString().padStart(2, '0');
    const year = yourDate.getFullYear();
    anniElement.textContent = `${day}-${month}-${year}`;

    // Hàm cập nhật đồng hồ & ngày (dựa trên thời gian thực để tránh lệch khi pause)
    function updateClockAndDays() {
        const now = new Date();
        const diffMs = now - yourDate;
        const totalSeconds = Math.floor(diffMs / 1000);

        const days = Math.floor(totalSeconds / (3600 * 24));
        const hrs = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const min = Math.floor((totalSeconds % 3600) / 60);
        const sec = totalSeconds % 60;

        dateElement.textContent = `${days} Ngày`;
        rootTime.textContent = `${hrs.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    updateClockAndDays(); // Gọi lần đầu
    setInterval(updateClockAndDays, 1000); // Update mỗi giây

    // Random nhạc
    const randomSong = music[Math.floor(Math.random() * music.length)];
    document.querySelector("audio").setAttribute("src", `music/${randomSong}.mp3`);

    // Thêm mask (giữ nguyên)
    document.body.insertAdjacentHTML("beforeend", "<div id='mask'></div>");

    // === BADGE TRÊN ICON iOS (cập nhật số ngày) ===
    let currentDays = Math.floor((new Date() - yourDate) / (1000 * 60 * 60 * 24));
    async function updateBadge(days) {
        if ('setAppBadge' in navigator) {
            try {
                if (days > 0) {
                    await navigator.setAppBadge(days);
                } else {
                    await navigator.clearAppBadge();
                }
            } catch (e) {
                console.error('Badge error:', e);
            }
        }
    }
    updateBadge(currentDays);

    // Update badge khi ngày thay đổi (kiểm tra mỗi giờ)
    setInterval(() => {
        const newDays = Math.floor((new Date() - yourDate) / (1000 * 60 * 60 * 24));
        if (newDays !== currentDays) {
            currentDays = newDays;
            updateBadge(currentDays);
        }
    }, 3600000);

    // === ĐĂNG KÝ SERVICE WORKER (bắt buộc cho push notifications) ===
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker error:', err));
    }

    // === PUSH NOTIFICATIONS: Tự động hiện guide khi mở từ Home Screen ===
    const isStandalone = navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone && 'Notification' in window && 'PushManager' in window) {
        const permission = Notification.permission;

        if (permission === 'default') {
            // Tạo guide tự động hiện (soft prompt)
            const pushGuide = document.createElement('div');
            pushGuide.id = 'push-guide';
            pushGuide.style.cssText = 'position:fixed; bottom:30px; left:5%; right:5%; background:#fff0f5; padding:20px; border-radius:20px; box-shadow:0 8px 30px rgba(233,30,99,0.3); text-align:center; z-index:1000; font-size:1.05em; color:#c2185b; border:2px solid #f8bbd0;';
            pushGuide.innerHTML = `
                <p><strong>❤️ Muốn nhận thông báo đẩy ngọt ngào mỗi ngày không?</strong></p>
                <p>Mai & Hòa sẽ gửi nhắc nhở kỷ niệm, chúc mừng ngày đặc biệt, và nhiều bất ngờ khác ngay trên màn hình!</p>
                <button id="request-push-btn" style="background:#e91e63; color:white; padding:14px 32px; border:none; border-radius:50px; font-size:1.15em; margin:15px 0; cursor:pointer; box-shadow:0 4px 15px rgba(233,30,99,0.4);">
                    Bật thông báo đẩy ngay ❤️
                </button>
                <p style="font-size:0.9em; color:#555; margin-top:10px;">
                    Lưu ý: Khi iPhone hỏi quyền, đồng hồ có thể tạm dừng vài giây. Sau khi chọn xong (Allow), nó sẽ tự cập nhật đúng thời gian thực ngay lập tức nhé! 💕
                </p>
            `;
            document.body.appendChild(pushGuide);

            // Xử lý khi tap nút → gọi requestPermission (user gesture → hợp lệ)
            document.getElementById('request-push-btn').addEventListener('click', async () => {
                try {
                    const perm = await Notification.requestPermission();
                    if (perm === 'granted') {
                        // Subscribe push (thay YOUR_PUBLIC_VAPID_KEY bằng key thật từ server)
                        const reg = await navigator.serviceWorker.ready;
                        const vapidKey = urlBase64ToUint8Array('YOUR_PUBLIC_VAPID_KEY_HERE'); // Generate tại https://vapidkeys.com

                        const subscription = await reg.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: vapidKey
                        });

                        // Nếu có backend: gửi subscription đến server
                        // await fetch('/subscribe', { method: 'POST', body: JSON.stringify(subscription), headers: {'Content-Type': 'application/json'} });

                        pushGuide.innerHTML = '<p style="color:#2e7d32; font-weight:bold; font-size:1.1em;">Đã bật thành công! Sẽ có nhiều điều lãng mạn chờ bạn ❤️✨</p>';
                        setTimeout(() => pushGuide.remove(), 6000); // Tự ẩn sau 6s
                    } else {
                        pushGuide.innerHTML = '<p style="color:#d32f2f;">Bạn đã từ chối. Có thể bật lại trong Cài đặt > Thông báo > "Tình Yêu"</p>';
                    }
                } catch (err) {
                    console.error('Push error:', err);
                    pushGuide.innerHTML = '<p style="color:#d32f2f;">Có lỗi xảy ra, thử lại hoặc kiểm tra Cài đặt iPhone nhé!</p>';
                }
            });
        } else if (permission === 'denied') {
            // Đã từ chối trước → hiện guide nhỏ
            const deniedMsg = document.createElement('div');
            deniedMsg.style.cssText = 'position:fixed; bottom:20px; left:10%; right:10%; background:#fffde7; padding:15px; border-radius:15px; text-align:center; z-index:999; font-size:0.95em; color:#ef6c00;';
            deniedMsg.innerHTML = 'Thông báo đẩy bị từ chối trước đó. Vào Cài đặt iPhone > Thông báo > "Tình Yêu" để bật lại và nhận bất ngờ nhé ❤️';
            document.body.appendChild(deniedMsg);
            setTimeout(() => deniedMsg.remove(), 10000);
        }
    }

}, false);

// Helper function cho VAPID key (đừng thay đổi)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
