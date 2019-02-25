#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include "./mman-win32/mman.c"
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

/*

gcc -Wall -o 1 huffman.c && ./1

*/
int main()
{
    int fd = open("hpmor_ru.html", O_RDONLY);
    if (fd == -1)
    {
        perror("Error opening input file");
        exit(1);
    }
    struct stat sb;
    fstat(fd, &sb);
    printf("Size: %lu\n", sb.st_size);
    byte *memblock = mmap(NULL, sb.st_size, PROT_READ, MAP_PRIVATE, fd, 0);
    if (memblock == MAP_FAILED)
    {
        perror("Error with mmap");
        exit(1);
    }

    if (munmap(memblock, sb.st_size) == -1)
    {
        perror("Error un-mmapping the file");
    }
    close(fd);
}