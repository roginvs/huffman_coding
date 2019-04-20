
#include <stdio.h>

#include "./huffman.c"
#include <stdlib.h>
#include <stdint.h>
#if defined(_WIN32) || defined(WIN32)
#include "./mman-win32/mman.c"
#else
#include <sys/mman.h>
#endif
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

/*

gcc -Wall -o 1 main.c && ./1 hpmor_ru.html hpmor_ru.html.c.huffman

*/

int main(int argc, char *argv[])
{
    if (argc != 4)
    {
        printf("Use: %s <in_file> <out_file>\n", argv[0]);
        return 1;
    }
    if (strcmp(argv[1], "encode") != 0)
    {
        printf("TODO");
        return 1;
    }
    printf("Opening input file %s\n", argv[2]);
    int fd = open(argv[2], O_RDONLY);
    if (fd == -1)
    {
        perror("Error opening input file");
        exit(1);
    }
    struct stat sb;
    fstat(fd, &sb);
    printf("Size: %lu\n", sb.st_size);
    unsigned char *memblock = NULL;
    if (sb.st_size != 0)
    {
        memblock = mmap(NULL, sb.st_size, PROT_READ, MAP_PRIVATE, fd, 0);
        if (memblock == MAP_FAILED)
        {
            perror("Error with mmap");
            exit(1);
        }
    };
    uint32_t outlen;
    unsigned char *out = huffman_encode(memblock, sb.st_size, &outlen);
    if (out == NULL)
    {
        perror("Huffman failed");
        exit(1);
    };
    printf("Original len=%lu, compressed len=%u\n", sb.st_size, outlen);
    int fd_out = open(argv[3], O_RDWR | O_CREAT | O_TRUNC, 0666);
    if (fd_out == -1)
    {
        perror("Error opening output file");
        exit(1);
    }
    if (lseek(fd_out, outlen, SEEK_SET) == -1)
    {
        perror("Error with growing file");
        exit(1);
    }
    ftruncate(fd_out, outlen);
    unsigned char *out_file = mmap(0, outlen, PROT_READ | PROT_WRITE, MAP_SHARED, fd_out, 0);
    if (out_file == MAP_FAILED)
    {
        perror("Error mmap out file");
        exit(1);
    }
    memcpy(out_file, out, outlen);
    printf("Outfile written into %s\n", argv[3]);
    free(out);

    if (sb.st_size != 0)
    {
        if (munmap(memblock, sb.st_size) == -1)
        {
            perror("Error un-mmapping input file");
        }
    }
    if (munmap(out_file, outlen) == -1)
    {
        perror("Error un-mmapping output file");
    }
    close(fd);
    close(fd_out);
}
