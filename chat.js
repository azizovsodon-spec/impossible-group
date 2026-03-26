(function() {
    // 1. КОНФИГ И ИНИЦИАЛИЗАЦИЯ FIREBASE
    const firebaseConfig = {
        apiKey: "AIzaSyCUsG1MmdAho0WdnDYFUA84B8Q3wEYmKUQ",
        authDomain: "ig-group-9d7f2.firebaseapp.com",
        databaseURL: "https://ig-group-9d7f2-default-rtdb.firebaseio.com",
        projectId: "ig-group-9d7f2",
        storageBucket: "ig-group-9d7f2.firebasestorage.app",
        messagingSenderId: "322683127822",
        appId: "1:322683127822:web:f779cf12428151ad54945f"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // ДАННЫЕ ТЕЛЕГРАМА
    const TG_TOKEN = "8722765200:AAG373Xov1f3VaJdqfZZmX6BQoRc_fxKQFg";
    const ADMIN_ID = "5932685938";
    let lastUpdateId = 0;

    // 2. СТИЛИ
    const style = document.createElement('style');
    style.innerHTML = `
        .chat-widget { position: fixed; bottom: 30px; right: 30px; z-index: 9999; font-family: 'Inter', sans-serif; }
        .chat-button { width: 60px; height: 60px; background: #0066ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 25px rgba(0, 102, 255, 0.3); transition: 0.3s; }
        .chat-window { position: absolute; bottom: 80px; right: 0; width: 320px; background: white; border-radius: 25px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); display: none; flex-direction: column; overflow: hidden; border: 1px solid rgba(0,0,0,0.05); }
        .chat-header { background: #0066ff; color: white; padding: 18px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; }
        .chat-body { padding: 15px; height: 320px; overflow-y: auto; background: #f9f9fb; display: flex; flex-direction: column; gap: 10px; }
        .chat-input-area { padding: 12px; border-top: 1px solid #eee; display: flex; gap: 8px; background: white; }
        .chat-input-area input { flex: 1; border: none; background: #f0f0f2; padding: 10px 15px; border-radius: 50px; outline: none; font-size: 13px; }
        .msg { padding: 10px 14px; border-radius: 18px; max-width: 85%; font-size: 13px; line-height: 1.4; word-wrap: break-word; }
        .msg.bot { background: #fff; border: 1px solid #eee; align-self: flex-start; border-bottom-left-radius: 4px; }
        .msg.user { background: #0066ff; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    `;
    document.head.appendChild(style);

    // 3. СТРУКТУРА
    const chatWidget = document.createElement('div');
    chatWidget.className = 'chat-widget';
    chatWidget.innerHTML = `
        <div class="chat-window" id="chatWin">
            <div class="chat-header"><span>NEXT.DEV Support</span><span style="cursor:pointer" id="closeChat">×</span></div>
            <div class="chat-body" id="chatContent"></div>
            <div class="chat-input-area"><input type="text" id="userInput" placeholder="Ваш вопрос..."></div>
        </div>
        <div class="chat-button" id="openBtn">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
    `;
    document.body.appendChild(chatWidget);

    const chatContent = document.getElementById('chatContent');
    const userInput = document.getElementById('userInput');

    // 4. ФУНКЦИИ
    function addMsgToUI(text, type) {
        const m = document.createElement('div');
        m.className = `msg ${type}`;
        m.innerText = text;
        chatContent.appendChild(m);
        chatContent.scrollTop = chatContent.scrollHeight;
    }

    // ЗАГРУЗКА ИСТОРИИ ИЗ FIREBASE
    db.ref("messages").on("child_added", (snapshot) => {
        const data = snapshot.val();
        addMsgToUI(data.text, data.type);
    });

    // ОТПРАВКА
    userInput.onkeypress = async (e) => {
        if (e.key === 'Enter' && userInput.value.trim() !== "") {
            const val = userInput.value;
            
            // Сохраняем в базу (оно само отобразится в чате через child_added)
            db.ref("messages").push({
                text: val,
                type: "user",
                timestamp: Date.now()
            });

            // Шлем в Телеграм
            fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: ADMIN_ID,
                    text: `💬 ЧАТ: ${val}\n\n(Ответь через Reply)`
                })
            });

            userInput.value = "";
        }
    };

    // ПРОВЕРКА ТЕЛЕГРАМА (Чтобы твой ответ тоже сохранился в базу)
    async function checkTgAnswers() {
        try {
            const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`);
            const data = await res.json();
            if (data.result && data.result.length > 0) {
                data.result.forEach(update => {
                    lastUpdateId = update.update_id;
                    if (update.message && update.message.from.id == ADMIN_ID && update.message.reply_to_message) {
                        // Если ты ответил в Телеге — пушим это в Firebase!
                        db.ref("messages").push({
                            text: update.message.text,
                            type: "bot",
                            timestamp: Date.now()
                        });
                    }
                });
            }
        } catch (e) { }
    }

    setInterval(checkTgAnswers, 3000);

    // УПРАВЛЕНИЕ ОКНОМ
    document.getElementById('openBtn').onclick = () => {
        const win = document.getElementById('chatWin');
        win.style.display = (win.style.display === 'flex') ? 'none' : 'flex';
    };
    document.getElementById('closeChat').onclick = () => document.getElementById('chatWin').style.display = 'none';

})();