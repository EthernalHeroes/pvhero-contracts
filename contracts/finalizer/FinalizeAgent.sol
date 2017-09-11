pragma solidity ^0.4.8;

/**
 * Шаблон интерфейса для финализатора
 *
 * - Распределение токенов по определенным правилам, разблокировка токенов, и т.д.
 */

contract FinalizeAgent {

    function isFinalizeAgent() public constant returns (bool) {
        return true;
    }

    /** Возвращает true, если finalize() успешно вызвался
     *
     * Если финализатор не установлен, то продажи не начинаются
     */
    function isSane() public constant returns (bool);

    /** Вызывается в контракте продаж, в методе finalize() если продажи успешно прошли */
    function finalize();

}
