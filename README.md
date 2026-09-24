# IBM Bob 2.0 Hackathon — 25–27 сентября 2026

Тема: **Build with purpose using IBM Bob 2.0** — улучшить конкретный
workflow разработчика (онбординг, дебаг, код-ревью, тестирование,
поддержка, релиз/деплой).

## Правила допуска к судейству

1. **Bob IDE — обязателен** как ключевой компонент решения. Фреймворки и
   технологии — любые, но Bob должен быть виден в архитектуре.
2. **Папка [`bob_sessions/`](bob_sessions/)** со скриншотами task session
   summary — обязательный деливерабл. Снимай по ходу работы, не в
   воскресенье вечером.
3. **Свои данные**, без клиентских/конфиденциальных/персональных данных и
   без соцсетей. Реестр источников — в [`DATA_SOURCES.md`](DATA_SOURCES.md).

## Бюджет Bobcoins

40 Bobcoins на аккаунт. При 100% — добавки не будет.

- Проверка: Bob IDE → **Settings** → **General**
- Или: https://bob.ibm.com/admin/subscription
- Аккаунт должен быть **`ibm-coding-challenge-uat` (регион `us-east`)**,
  а не личный.
- Делите задачи между участниками, чтобы тратить общий пул команды.
- Если кончились — остаются watsonx Orchestrate и watsonx.ai.

## Скриншот сессии за 10 секунд

```bash
powershell -File tools/new-session-shot.ps1 -Team myteam -Task 1 -Desc login_flow
```

`-Team` достаточно указать один раз — запомнится.

## Идеи из гайда

- Smart developer onboarding assistant — разбор репозитория, объяснение
  архитектуры, генерация setup-инструкций, стартовые задачи
- Intelligent code review coach — риски, объяснения, фиксы, саммари ревью
- Automated testing hub — генерация юнит-тестов, дыры в покрытии
- Release readiness assistant — зависимости, риски, release notes
- Legacy modernization accelerator — объяснение старого кода, миграция

Сильные сабмишены используют Agent mode, parallel tasks, subagents и
document understanding — не просто автокомплит. Показывай измеримый эффект:
меньше ручной работы, меньше ошибок, часы → минуты.

## Ссылки

- [Гайд хакатона](https://lablab-ibm-bob-2-hackathon-guide.s3.us.cloud-object-storage.appdomain.cloud/index.html)
- [Документация Bob IDE](https://bob.ibm.com/docs/ide/getting-started/quickstart)
- [Best practices](https://bob.ibm.com/docs/ide/getting-started/best-practices)
- [Упражнения для разогрева](https://bob.ibm.com/docs/ide/getting-started/tutorials/introduction)
- [Admin dashboard (Bobcoins)](https://bob.ibm.com/admin/subscription)
