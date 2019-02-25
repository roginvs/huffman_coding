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

int huffman(byte *in, long int len, byte *out, long int max_out, long int *outlen)
{
    return 0;
};

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

    // not optimal
    long int outlen;
    long int max_out = sb.st_size;
    byte *buf = malloc(max_out);
    int huffman_result = huffman(memblock, sb.st_size, buf, max_out, &outlen);
    if (huffman_result != 0)
    {
        perror("Huffman failed");
        exit(1);
    };
    printf("Original len=%lu, compressed len=%lu", sb.st_size, outlen);

    if (munmap(memblock, sb.st_size) == -1)
    {
        perror("Error un-mmapping the file");
    }
    close(fd);
}