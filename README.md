# pvhero-contracts

**Pre-ICO контракты для проведения закрытого размещения токенов**

**Общая архитектура контрактов**
![Архитектура смарт контрактов](https://raw.githubusercontent.com/EthernalHeroes/pvhero-contracts/master/docs/images/Architecture.png)


**Спецификация**

Задание на закрытое размещение проекта **Ethernal Heroes**:

Есть необходимость провести закрытое размещение токенов для дальнейшего проведения полноценного ICO.
Предполагается продажа токенов **PMAGE**.

За один **ETH** выдается **6 000** токенов **PMAGE**. Набор параметров:

- Всего можно продать **160 000 000** токенов
- Заданные даты проведения продаж: начало и конец. После окончания срока проведения, перевод средств на адрес контракта будет невозможен
- Контракт продаж должен поддерживать прием средств, которые должны поступать на специальный кошелек, который задается в настройках деплоя контрактов.
Ограничения на использование средств отсутствуют
- Должна быть предусмотрена возможность остановить/возобновить продажи
- У покупателей токенов должна быть возможность подключить к своему кошельку контракт токена и наблюдать за своим счетом токенов, а также осуществлять свободный перевод токенов с аккаунта на аккаунт
- Минимальная сумма входа - **15 ETH**, иначе возврат
- Бонус **25%** токенов, при переводе от **15** (включительно) до **50** (не включительно) **ETH** 
- Бонус **30%** токенов, при переводе >= **50 ETH**

Все настройки должны быть вынесены в отдельный файл.

Для тестового режима общее количество токенов, которые можно продать равно **200**. Стоимость **1 PMAGE** токена равна **1 ETH**.

**Установка и тестирование**

Необходимо установить:

- Node.js и NPM: https://nodejs.org/en/download/
- Truffle: https://www.npmjs.com/package/truffle
- Test RPC: https://github.com/ethereumjs/testrpc

Далее:

- Склонировать проект: **$ git clone https://github.com/EthernalHeroes/pvhero-contracts**
- Перейти в папку с проектом: **$ cd pvhero-contracts/**
- Выполнить: **$ npm install**
- Запустить Test RPC: **$ testrpc**

Для деплоя выполнить: **$ truffle migrate**

Для выполнения тестов выполнить: **$ truffle test**

