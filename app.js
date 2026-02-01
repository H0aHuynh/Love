const yourDate = new Date("2025-12-19T00:00:00");
const music = ['ido', 'noinaycoanh', 'nguoiamphu'];

document.addEventListener('DOMContentLoaded', async function () {
    // ... (giữ nguyên phần countdown ngày/giờ, format anni, updateClock, random nhạc, mask như code trước)

    // Badge (giữ nguyên)
    let currentDays = Math.floor((new Date() - yourDate) / (1000 * 60 * 60 * 24));
    document.querySelector("date").textContent = `${currentDays} Ngày`;
    async function updateBadge(days) {
        if ('setAppBadge' in navigator) {
            try {
                if (days > 0) await navigator.setAppBadge(days);
                else await navigator.clearAppBadge();
            } catch (e) {}
        }
    }
    updateBadge(currentDays);
    setInterval(() => {
        const newDays = Math.floor((new Date() - yourDate) / (1000 * 60 * 60 * 24));
        if (newDays !== currentDays) {
            currentDays = newDays;
            document.querySelector("date").textContent = `${currentDays} Ngày`;
            updateBadge(currentDays);
        }
    }, 3600000);

    // Đăng ký Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW error:', err));
    }

    // === PUSH: TỰ ĐỘNG HIỆN GUIDE + NÚT KHI MỞ APP TỪ HOME SCREEN ===
    const isStandalone = navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone && 'Notification' in window && 'PushManager' in window) {
        const permission = Notification.permission;

        if (permission === 'default') {  // Chưa hỏi quyền → hiện guide + nút ngay
            const pushGuide = document.createElement('div');
            pushGuide.id = 'push-guide';
            pushGuide.style.cssText = 'position:fixed; bottom:20px; left:10%; right:10%; background:#ffebee; padding:15px; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.2); text-align:center; z-index:9999; font-size:1em; color:#c62828;';
            pushGuide.innerHTML = `
                <p><strong>❤️ Nhận thông báo đẩy lãng mạn mỗi ngày?</strong></p>
                <p>Để Mai & Hòa gửi nhắc nhở kỷ niệm, chúc mừng ngày đặc biệt ngay trên màn hình khóa!</p>
                <button id="request-push-btn" style="background:#d81b60; color:white; padding:12px 28px; border:none; border-radius:50px; font-size:1.1em; margin-top:10px; cursor:pointer;">
                    Bật thông báo đẩy ngay ❤️
                </button>
                <p style="font-size:0.85em; margin-top:12px; color:#555;">Chỉ tap 1 lần, bạn có thể tắt bất cứ lúc nào trong Cài đặt.</p>
            `;
            document.body.appendChild(pushGuide);

            // Khi tap nút → gọi requestPermission()
            document.getElementById('request-push-btn').addEventListener('click', async function () {
                try {
                    const perm = await Notification.requestPermission();
                    if (perm === 'granted') {
                        // Subscribe push (thay YOUR_PUBLIC_VAPID_KEY bằng key thật)
                        const reg = await navigator.serviceWorker.ready;
                        const vapidKey = urlBase64ToUint8Array('YOUR_PUBLIC_VAPID_KEY_HERE');

                        const subscription = await reg.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: vapidKey
                        });

                        // Nếu có backend: gửi subscription đi (fetch('/subscribe', ...))

                        pushGuide.innerHTML = '<p style="color:#2e7d32; font-weight:bold;">Đã bật thành công! Sẽ có nhiều bất ngờ từ chúng ta ❤️✨</p>';
                        setTimeout(() => pushGuide.remove(), 5000);  // Tự ẩn sau 5s
                    } else {
                        pushGuide.innerHTML = '<p style="color:#d32f2f;">Bạn đã từ chối. Có thể bật lại trong Cài đặt > Thông báo > Tình Yêu</p>';
                    }
                } catch (err) {
                    console.error('Push request error:', err);
                    pushGuide.innerHTML = '<p style="color:#d32f2f;">Lỗi xảy ra, thử lại hoặc kiểm tra Cài đặt iPhone nhé!</p>';
                }
            });
        } else if (permission === 'granted') {
            // Đã granted trước → có thể subscribe nếu chưa
            console.log('Push đã được bật');
        } else {
            // Denied → hiện guide nhỏ nhắc bật thủ công
            const deniedGuide = document.createElement('div');
            deniedGuide.style.cssText = 'position:fixed; bottom:20px; left:10%; right:10%; background:#fffde7; padding:12px; border-radius:12px; text-align:center; z-index:9999; font-size:0.9em; color:#f57c00;';
            deniedGuide.innerHTML = 'Thông báo đẩy bị từ chối trước đó. Vào Cài đặt iPhone > Thông báo > "Tình Yêu" để bật lại nhé ❤️';
            document.body.appendChild(deniedGuide);
            setTimeout(() => deniedGuide.remove(), 8000);
        }
    }

}, false);

// Helper VAPID
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
