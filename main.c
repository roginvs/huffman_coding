#include "./huffman_pack.c"

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include "./mman-win32/mman.c"
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

/*

gcc -Wall -o 1 main.c && ./1 

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
    unsigned char *memblock = mmap(NULL, sb.st_size, PROT_READ, MAP_PRIVATE, fd, 0);

    if (memblock == MAP_FAILED)
    {
        perror("Error with mmap");
        exit(1);
    }

    long int outlen;
    unsigned char *out = huffman_encode(memblock, sb.st_size, &outlen);
    if (out == NULL)
    {
        perror("Huffman failed");
        exit(1);
    };
    printf("Original len=%lu, compressed len=%lu\n", sb.st_size, outlen);
    int fd_out = open("hpmor_ru.html.c.huffman", O_RDWR | O_CREAT | O_TRUNC, 0666);
    if (fd_out == -1)
    {
        perror("Error opening output file");
        exit(1);
    }
    // lseek(fd_out, max_out, SEEK_SET);
    unsigned char *out_file = mmap(0, outlen, PROT_READ | PROT_WRITE, MAP_SHARED, fd_out, 0);
    if (out_file == MAP_FAILED)
    {
        perror("Error mmap out file");
        exit(1);
    }
    memcpy(out_file, out, outlen);
    printf("Outfile written\n");
    free(out);

    if (munmap(memblock, sb.st_size) == -1)
    {
        perror("Error un-mmapping the file");
    }
    if (munmap(out, outlen) == -1)
    {
        perror("Error un-mmapping the file");
    }
    close(fd);
    ftruncate(fd_out, outlen);
    close(fd_out);
}
