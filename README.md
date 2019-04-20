# Демо алгоритма Хаффмана

Этот репозиторий состоит из реализаций кодирования и раскодирования по алгоритму Хаффмана. Кодирование реализовано на C и Typescript, декодирование только на Typescript. Имеются консольные версии и web-демо.

# Формат сжатого файла

Первые 4 байта - заголовок, фиксированные случайно выбранные 4 байта
Далее 4 байта - размер оригинального файла.
После этого идёт поток битов для описания дерева. Дерево записывается простым обходом. Если это внутренний узел, то записать бит 0. Если это лист, то записать бит 1 и далее 8 битов на соответствующий байт. Всего должно получиться 255 внутренних узлов и 256 листов, т.е. `255*1 + 256*(1 + 8) = 2559 битов`. После этого идёт контрольный нулевой бит для того чтобы заголовок закончился на целом байте.
Далее идёт поток битов для самих данных.
Последний байт дополняется до целого байта нулевыми битами если нужно.

# C-версия (только архиватор)

Архиватор находится в `huffman.c`, CLI оболочка в `main.c`. Собирается через gcc на Windows (с mingw) или на Linux:

```
gcc -Wall -o main main.c
./main <имя входного файла> <имя выходного файла>
```

# TypeScript версия для nodejs, архиватор и разархиватор,

Ядро находится в `huffman.ts`, CLI оболочка в `main.ts`. Для запуска нужен nodejs и typescript, можно предварительно собирать в js либо запускать сразу с `ts-node`

```
ts-node -T main.ts encode some-input-file some-output-encoded-file
ts-node -T main.ts decode some-input-encoded-file some-output-decoded-file
```

# Тесты

Тесты проверяют сжатие обоими версиями (C и TS), проверяют что файл распаковывается и совпадает с оригинальным. Запускаются тесты в `./test.sh`

# WebAssembly версия

Собирается с emscripten в `buildWeb.sh`, доступна по адресу <https://roginvs.github.io/huffman_coding/web/>
Я не использовал webpack/react/etc чтобы не тянуть большие зависимости.
Интересно что я из C кода экспортировал malloc/free для того, чтобы иметь возможность получать в javascript буферы в аллокаторе из stdlib.

# TODO

Почему-то WebAssembly версия падает на файле `hpmor_ru.html.huffman.huffman` (два раза сжатый `./test/hpmor_ru.html`). При этом C версия пакует нормально и полученный файл так же распаковывается. Возможно где-то неправильно используется `emscripten`.
