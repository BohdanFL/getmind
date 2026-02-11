

#### 1. Domain Model (Модель знань) — «ЩО ми вчимо?»
- **У класичних системах:** Це була жорстка база правил, написана експертами.
- **У твоему проєкті:** Це твій **RAG-конвеєр та Граф знань**. Ти автоматично вибудовуєш модель знань із завантаженого PDF-файлу за допомогою LLM. Це «AI-native» підхід до Domain Model.

#### 2. Student Model (Модель учня) — «ХТО вчиться?»
- **У класичних системах:** Таблиця зі списком того, що учень знає, а що ні.
- **У твоему проєкті:** Це твоя аналітика та **Баєсівський алгоритм (BKT)**. Система відстежує ймовірність того, що учень засвоїв конкретну тему. Сюди ж входить історія твоїх помилок та впевненості.

#### 3. Pedagogical Model (Тьюторська модель) — «ЯК ми вчимо?»
- **У класичних системах:** Набір правил «Якщо помилився 3 рази — покажи підказку».
- **У твоему проєкті:** Це твоя реалізація **принципів Make It Stick** (Active Recall, Spaced Repetition, Project Lab). Твій "Socratic Prompt" — це і є алгоритм педагогічної моделі, який вирішує, яке питання поставити далі.

#### 4. Interface Model (Інтерфейс) — «ДЕ ми вчимо?
- **У твоему проєкті:** Це твій **Study Cockpit** у браузері. Це простір, де контент, чат і нотатки працюють як єдине ціле.

---
# IN DEEP

### 1. Доменна модель (Domain Model): Як система «знає» предмет

Це мозок системи.[1](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQE3tQ7W41nYczOR3mLuFfw9hUc2qWUIYPZa7JrKP3-od0ajmaw8LQW05h0chtiS9DUWeGsQ7NaLU1MDq7M3iQ8oP8fBZ78sOiKXwp-UXFA26BuxHHeJxM8H9WalaCLGK5tzsnYa-J7Bhd7wVm7ex9bd_mRNvs6DUgzyqCZd4cXL9lMoKW5ddBTj3SNK0D8%3D) Є два основних підходи до її побудови:

- **Overlay Model (Накладна модель):** Система бачить знання учня як «підмножину» знань експерта. Якщо експерт знає теми A, B, C, D, а учень лише A і B, система бачить «дірки» і спрямовує туди навчання.
    
    - Для тебе: Твій ШІ генерує цей список тем (A, B, C) з PDF, а потім «накладає» прогрес учня зверху.
        
- **Constraint-Based Modeling (CBM):** Замість того, щоб вчити учня правильному шляху, система стежить, щоб він не порушував «обмеження» (правила). Це часто використовується в програмуванні або математиці.
    
    - Приклад: «У мові Python після if має бути двокрапка». Якщо учень її забув — система вмикає підказку.
        

---

### 2. Модель учня (Student Model): Математика прогнозування

Тут використовуються алгоритми, про які ти питав (Баєсівські).

- **Bayesian Knowledge Tracing (BKT):** Це золотий стандарт. Він використовує 4 параметри для кожної мікро-навички:
    
    1. **Probability of Learning (**
        
                **`p(L0)p(L0​)`**
              
        
        **):** Ймовірність того, що учень уже знав тему до початку.
        
    2. **Probability of Transition (**
        
                **`p(T)p(T)`**
              
        
        **):** Шанс, що після вивчення теми учень її дійсно зрозумів.
        
    3. **Probability of Guess (**
        
                **`p(G)p(G)`**
              
        
        **):** Шанс, що учень вгадав правильну відповідь, хоча не знає теми.
        
    4. **Probability of Slip (**
        
                **`p(S)p(S)`**
              
        
        **):** Шанс, що учень помилився випадково, хоча знає тему.
        
- **Performance Factors Analysis (PFA):** Альтернатива Баєсу.[[2](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQGtbZEtQF3qCvvHBAp-X6QsozxDxRm32Fz2olIfIvUm_ZBQqeLb-a8M5_40luFD0r-7stVYJjpSg3cygA0-kABlYTalEjSiB0DXsrDFGntM1E5HEqp-oFlgw5SXfEWG9mn2xlA58_MXrcVnOwmkX1N40dlYbbAVY8x9sXAPaO2EhxxWPdpFEW3Bpme6bro791cTsTeXPpxz8tiakBe2_FgKcn0s_CjfKBIBVEoL1t3iftT4nLpxWEZKvOcdUQ%3D%3D)] Вона простіша в реалізації (логістична регресія) і часто точніша. Вона каже: «Кожна правильна відповідь підвищує шанс знання на X, а кожна помилка — на Y».
    

---

### 3. Педагогічна модель (Tutoring/Pedagogical Module)

Це логіка «Коли і як допомагати?». Ось конкретні стратегії:

- **Scaffolding (Риштування):** Система дає підтримку на початку (наприклад, план рішення) і поступово її прибирає (fading), коли учень стає впевненішим.
    
- **Socratic Dialogue (Сократівський діалог):** Замість «Ти помилився, відповідь — 42», система питає: «А що буде, якщо ми помножимо це число на два?». Твій ШІ ідеально підходить для цього.
    
- **Hint Hierarchies (Ієрархія підказок):**
    
    1. Рівень 1: Натяк (Point out error).
        
    2. Рівень 2: Правило (State the rule).
        
    3. Рівень 3: Повне рішення (Bottom-out hint).
        
    
    - Для тебе: Промпт для ШІ має бути налаштований так, щоб він спочатку давав лише «Рівень 1».[[3](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQEksxP48Ev_ls74sXAJ0WfN_ib6aWUU80OYNpkunEWCyhSNCdhP5rhCkmzj9Czd6acgZd9iiozoUfE0f1jqpn6xnkMVG5-ljmfijwg2hqAUQihcjhgt_4bMLICVRxdMiIlPo6hYUMdH0sd1V0BJI-nMp9et-WM%3D)]
        
- **Model Tracing:** Система стежить за кожним кроком рішення (а не тільки за фінальним результатом). Це дуже важливо для твого Project Lab.
    

---

### 4. Конкретні методики ITS, які «вистрелять» у дипломі:

1. **Cognitive Task Analysis (CTA):** Це метод проектування.[[4](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQGcvwHMpaWxTml0824D5YJFyFxApze9thj7gT40IAmiBU4RnHXVnfAQmsV-3rfg3vzaOBGZ2KqwqGCZF500TCi0Aigp2zIfQZOEWi4G7bZgo_sX_JsB85-XmL0mDB0sGvVJDibP5c2kMQKwodqcHsbPGUueaJA87QQJzCaPJJ-kcs8iriCauaVWswMCeh2AJftdmSmOF3gaqWwgYVlv03auCMv3UOrg)] Перед тим як кодити, ти аналізуєш, які саме ментальні кроки робить людина, коли вивчає твій PDF. Потім ти вчиш ШІ перевіряти кожен із цих кроків.
    
2. **Mastery Learning (Навчання до майстерності):** Принцип, за яким учень не може перейти до Розділу 2, поки ймовірність знання (з BKT-моделі) у Розділі 1 не досягне, наприклад, 0.95.
    
3. **Zone of Proximal Development (ZPD) - Зона найближчого розвитку:** Система має давати завдання, які трішки складніші за те, що учень може зробити сам, але під силу з підказкою ШІ.
    

---

### Як це виглядає в архітектурі CogniFlow:

Коли ти будеш писати диплом, твоя архітектура ITS буде виглядати так:

1. **Knowledge Base:** Твої PDF-документи (Domain Model).
    
2. **Student Model Tracker:** База даних з Баєсівськими ймовірностями (Student Model).
    
3. **Instructional Planner:** Логіка, яка каже «Час для Project Lab!» або «Час для повторення» (Pedagogical Model).
    
4. **Generative AI Layer:** ШІ, який втілює педагогічну модель через мовну взаємодію.[[5](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQGKnCPYdcOibrHTMdXEtETVNl5H_vMJn5fKUEfUCs-yHsnOTBF_7ZK5OiYlJyVaNutumEDwvpwxuOJB1sXsMOvlc1yJ3bsNWchUzP5qx0qO49rtwoobl0GIAEcDMp7IXxFPELY%3D)]
    

### Що почитати (для списку літератури):

- John R. Anderson — основоположник ACT-R архітектури для ITS.
    
- Kurt VanLehn — про порівняння живого тьютора та ITS.
    
- Albert Corbett — про Bayesian Knowledge Tracing.