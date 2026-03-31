(function() {
    // 1. КОНФИГ FIREBASE (Твои актуальные данные)
    const firebaseConfig = {
        apiKey: "AIzaSyCUsG1MmdAho0WdnDYFUA84B8Q3wEYmKUQ",
        authDomain: "ig-group-9d7f2.firebaseapp.com",
        databaseURL: "https://ig-group-9d7f2-default-rtdb.firebaseio.com",
        projectId: "ig-group-9d7f2",
        storageBucket: "ig-group-9d7f2.firebasestorage.app",
        messagingSenderId: "322683127822",
        appId: "1:322683127822:web:f779cf12428151ad54945f"
    };

    // Инициализация Firebase
    if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
    const db = firebase.database();

    // ГЕНЕРАЦИЯ ID (Уникальный для каждого браузера)
    let guestId = localStorage.getItem('imp_id');
    if (!guestId) {
        guestId = 'guest_' + Math.floor(Math.random() * 8999 + 1000);
        localStorage.setItem('imp_id', guestId);
    }

    const TG_TOKEN = "8722765200:AAG373Xov1f3VaJdqfZZmX6BQoRc_fxKQFg";
    const ADMIN_ID = "5932685938";
    let lastUpdateId = 0;

    // 2. СТИЛИ (Премиальный, компактный дизайн)
    const style = document.createElement('style');
    style.innerHTML = `
        .chat-widget { position: fixed; bottom: 20px; right: 20px; z-index: 10000; font-family: 'Inter', -apple-system, sans-serif; }
        
        /* Кнопка открытия (стала чуть меньше) */
        .chat-btn { width: 55px; height: 55px; background: #0066ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 8px 25px rgba(0, 102, 255, 0.25); transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .chat-btn:hover { transform: scale(1.05); background: #005ce6; }
        
        /* Окно чата (стало компактнее: ширина 300px, высота меньше) */
        .chat-win { position: absolute; bottom: 70px; right: 0; width: 300px; background: white; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.12); display: none; flex-direction: column; overflow: hidden; border: 1px solid rgba(0,0,0,0.04); transition: 0.3s; transform: translateY(10px); opacity: 0; }
        .chat-win.active { display: flex; transform: translateY(0); opacity: 1; }
        
        /* Шапка */
        .chat-head { background: #fff; color: #1d1d1f; padding: 15px 20px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; font-size: 14px; border-bottom: 1px solid #eee; }
        .chat-head span { display: flex; align-items: center; gap: 8px; }
        .status-dot { width: 8px; height: 8px; background: #27ae60; border-radius: 50%; }

        /* Тело чата (высота уменьшена до 320px) */
        .chat-body { padding: 15px; height: 320px; overflow-y: auto; background: #f9f9fc; display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth; }
        
        /* Поле ввода */
        .chat-input { padding: 12px; background: white; border-top: 1px solid #eee; display: flex; gap: 8px; align-items: center; }
        .chat-input input { flex: 1; border: none; background: #f1f1f4; padding: 10px 15px; border-radius: 20px; outline: none; font-size: 13px; color: #1d1d1f; }
        .chat-input input::placeholder { color: #86868b; }

        /* Сообщения (более компактные) */
        .msg { padding: 10px 14px; border-radius: 18px; max-width: 82%; font-size: 13px; line-height: 1.4; animation: msgShow 0.2s ease-out; word-wrap: break-word; }
        @keyframes msgShow { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        
        .msg.bot { background: white; align-self: flex-start; border-bottom-left-radius: 4px; border: 1px solid #eee; color: #1d1d1f; }
        .msg.user { background: #0066ff; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
        
        /* Убираем скроллбар */
        .chat-body::-webkit-scrollbar { width: 0px; background: transparent; }
    `;
    document.head.appendChild(style);

    // 3. СТРУКТУРА
    const widget = document.createElement('div');
    widget.className = 'chat-widget';
    widget.innerHTML = `
        <div class="chat-win" id="impWin">
            <div class="chat-head">
                <span><div class="status-dot"></div> Impossible AI</span>
                <span style="cursor:pointer; font-size: 18px; color: #86868b;" id="impClose">×</span>
            </div>
            <div class="chat-body" id="impContent"></div>
            <div class="chat-input"><input type="text" id="impInp" placeholder="Напишите вопрос..." autocomplete="off"></div>
        </div>
        <div class="chat-btn" id="impBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
    `;
    document.body.appendChild(widget);

    const body = document.getElementById('impContent');
    const input = document.getElementById('impInp');

    // 4. ФУНКЦИИ УПРАВЛЕНИЯ
    function addMsg(text, type) {
        const d = document.createElement('div');
        d.className = `msg ${type}`;
        d.innerText = text;
        body.appendChild(d);
        body.scrollTop = body.scrollHeight;
    }

    // Приветствие при первом открытии
    if (!localStorage.getItem('imp_welcomed')) {
        setTimeout(() => {
            addMsg("🤖 Салам! Я искусственный интеллект Impossible Group. Задайте мне вопрос про нашу команду или услуги.", "bot");
            localStorage.setItem('imp_welcomed', 'true');
        }, 1000);
    }

    // Слушаем базу (только сообщения этого гостя)
    db.ref("chats/" + guestId).on("child_added", (snap) => {
        const m = snap.val();
        // Избегаем дублирования приветствия, если оно уже есть в базе
        if (m.type === 'bot' && m.text.includes("Салам! Я искусственный интеллект")) {
             // Пропускаем, так как мы добавили его локально
             return;
        }
        addMsg(m.text, m.type);
    });

    // 5. ИСПРАВЛЕННАЯ ЛОГИКА АВТООТВЕТЧИКА
    input.onkeypress = async (e) => {
        if (e.key === 'Enter' && input.value.trim() !== "") {
            const val = input.value;
            // Приводим к нижнему регистру и убираем лишние пробелы для сравнения
            const cleanVal = val.toLowerCase().trim();
            
            // Сохраняем сообщение пользователя в Firebase
            db.ref("chats/" + guestId).push({ text: val, type: "user", time: Date.now() });

            // Определение ответа бота
            let autoReply = "";

            // Проверка ключевых слов (исправлено)
            if (cleanVal.includes("кто создал") || cleanVal.includes("разработчик") || cleanVal.includes("команда") || cleanVal.includes("автор")) {
                autoReply = "🤖 Над проектом NEXT.DEV работали трое: Азизов Шодон (Project Lead), Хобилов Чахонгир (UI/UX Дизайнер) и Мирзокамоли Мирзонабизод (Backend).";
            } else if (cleanVal.includes("привет") || cleanVal.includes("салам") || cleanVal.includes("здравствуй")) {
                autoReply = "🤖 Салам! Чем могу помочь?";
            } else if (cleanVal.includes("цена") || cleanVal.includes("сколько стоит") || cleanVal.includes("прайс")) {
                autoReply = "🤖 Стоимость разработки зависит от сложности проекта. Для точного расчета оставьте заявку в разделе 'Контакты'.";
            } else if (cleanVal.includes("услуги") || cleanVal.includes("что делаете")) {
                autoReply = "🤖 Мы создаем современные веб-сайты, UI/UX дизайн и занимаемся backend-разработкой. Также у нас есть IT Академия.";
            }

            // Если бот знает ответ
            if (autoReply !== "") {
                setTimeout(() => {
                    // Сохраняем ответ бота в Firebase
                    db.ref("chats/" + guestId).push({ text: autoReply, type: "bot", time: Date.now() });
                }, 700);
            } else {
                // Если бот НЕ знает ответа — пересылаем ТЕБЕ в Telegram
                fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: ADMIN_ID,
                        parse_mode: 'html',
                        text: `<b>🆘 ВОПРОС КОНСУЛЬТАНТУ</b>\nID: <code>${guestId}</code>\n\nТекст: ${val}\n\n<i>Ответь через Reply!</i>`
                    })
                });
                
                // Уведомляем пользователя
                setTimeout(() => {
                    addMsg("🤖 Я передал ваш вопрос нашему консультанту Шодиёну. Он ответит вам здесь в ближайшее время.", "bot");
                }, 1000);
            }
            input.value = "";
        }
    };

    // 6. ПРОВЕРКА ОТВЕТОВ ИЗ TELEGRAM (Reply Mode)
    async function checkTG() {
        try {
            const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`);
            const d = await r.json();
            if (d.result) {
                d.result.forEach(u => {
                    lastUpdateId = u.update_id;
                    // Если это ответ админа на сообщение
                    if (u.message && u.message.from.id == ADMIN_ID && u.message.reply_to_message) {
                        const replyToText = u.message.reply_to_message.text || u.message.reply_to_message.caption || "";
                        // Ищем ID гостя в оригинальном сообщении
                        const foundId = replyToText.match(/guest_\d+/);
                        if (foundId) {
                            // Пушим ответ админа в ветку этого гостя
                            db.ref("chats/" + foundId[0]).push({
                                text: u.message.text,
                                type: "bot",
                                time: Date.now()
                            });
                        }
                    }
                });
            }
        } catch (e) {}
    }
    // Проверяем ответы каждые 3 секунды
    setInterval(checkTG, 3000);

    // Управление окном чата
    const win = document.getElementById('impWin');
    const openBtn = document.getElementById('impBtn');
    const closeBtn = document.getElementById('impClose');

    openBtn.onclick = () => {
        win.classList.toggle('active');
    };
    
    closeBtn.onclick = () => {
        win.classList.remove('active');
    };

})();
