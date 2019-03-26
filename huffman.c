#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include "./mman-win32/mman.c"
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
/*

gcc -Wall -o 1 huffman.c && ./1

*/

/** left&right or byte */
struct __attribute__((__packed__)) HuffmanNode
{
    short int byte;
    unsigned long count;
    short int nextIdx;
    short int leftIdx;
    short int rightIdx;
};

int huffman(byte *in, long len, char *out, long max_out, long *outlen)
{
    printf("Creating buffer for counts and counting\n");
    unsigned long counts[256] = {0};
    for (unsigned long i = 0; i < len; i++)
    {
        counts[in[i]]++;
    };

    printf("Initializing header");
    *outlen = 0;
    *(long *)&out[0] = len;
    *outlen += sizeof(long);
    struct HuffmanNode *list = (struct HuffmanNode *)(&out[*outlen]);
    printf("Size of node is %i\n", sizeof(struct HuffmanNode)); // Lol, it is aligned

    printf("Building initial list\n");
    for (int i = 0; i < 256; i++)
    {

        list[i].byte = i;
        list[i].count = counts[i];
        list[i].leftIdx = -1;
        list[i].rightIdx = -1;
        list[i].nextIdx = i < 255 ? i + 1 : -1;
    }

    *outlen += sizeof(struct HuffmanNode) * 511;

    int listIdx = 0;
    int freeIdx = 256;
    printf("Transforming list into tree\n");
    while (1)
    {
        int min1idx = -1;
        int min2idx = -1;
        int currentIdx = listIdx;
        if (list[listIdx].nextIdx == -1)
        {
            // This should never happen because we check and break in the end of this while loop
            break;
        }
        // Two passes to find two minimums. Not optimal
        while (currentIdx != -1)
        {
            if (min1idx == -1 || list[currentIdx].count < list[min1idx].count)
            {
                min1idx = currentIdx;
            }
            currentIdx = list[currentIdx].nextIdx;
        }
        currentIdx = listIdx;
        while (currentIdx != -1)
        {
            if (min2idx == -1 || list[currentIdx].count < list[min2idx].count)
            {
                if (min1idx != currentIdx)
                {
                    min2idx = currentIdx;
                }
            }
            currentIdx = list[currentIdx].nextIdx;
        }
        printf("Found min1byte=%i min2byte=%i min1idx=%i min2idx=%i\n", list[min1idx].byte, list[min2idx].byte,
               min1idx, min2idx);
        list[freeIdx].count = list[min1idx].count + list[min2idx].count;
        list[freeIdx].leftIdx = min1idx;
        list[freeIdx].rightIdx = min2idx;
        list[freeIdx].nextIdx = -1;

        // Removing items from list
        printf("Removing min1 from list\n");
        int previousIdx = -1;
        currentIdx = listIdx;
        while (currentIdx != -1)
        {
            if (currentIdx == min1idx)
            {
                if (previousIdx == -1)
                {
                    listIdx = list[currentIdx].nextIdx;
                }
                else
                {
                    list[previousIdx].nextIdx = list[currentIdx].nextIdx;
                }
                break;
            }
            previousIdx = currentIdx;
            currentIdx = list[currentIdx].nextIdx;
        }
        printf("Removing min2 from list\n");
        previousIdx = -1;
        currentIdx = listIdx;
        while (currentIdx != -1)
        {
            if (currentIdx == min2idx)
            {
                if (previousIdx == -1)
                {
                    listIdx = list[currentIdx].nextIdx;
                }
                else
                {
                    list[previousIdx].nextIdx = list[currentIdx].nextIdx;
                }
                break;
            }
            previousIdx = currentIdx;
            currentIdx = list[currentIdx].nextIdx;
        }

        printf("Add new item to list\n");
        if (listIdx == -1)
        {
            printf("List is null, tree is built\n");
            break;
        }
        else
        {
            currentIdx = listIdx;
            while (list[currentIdx].nextIdx != -1)
            {

                currentIdx = list[currentIdx].nextIdx;
            }
            list[currentIdx].nextIdx = freeIdx;
        }

        int i = 0;
        currentIdx = listIdx;
        while (currentIdx != -1)
        {
            i++;
            currentIdx = list[currentIdx].nextIdx;
        }
        printf("List have %i items\n", i);
        freeIdx++;
    };
    // We did 255 steps in the previous loop, each step was removing
    //  two items from list and adding one. So, it always will be 511 nodes
    /*
    int nodes_count = 0;
    void count_nodes(struct HuffmanNode * pos)
    {
        nodes_count++;
        if (pos->left != NULL)
        {
            count_nodes(pos->left);
        };
        if (pos->right != NULL)
        {
            count_nodes(pos->right);
        };
    };
    count_nodes(list);
    printf("Tree have %i nodes\n", nodes_count);
    */
    int treeIdx = 510;

    struct StreamNode
    {
        unsigned char bitLength; // Ranges are 1..255
        unsigned char bits[32];
    };
    struct StreamNode *bits = (struct StreamNode *)(malloc(sizeof(struct StreamNode) * 256));

    void goTree(int goIdx)
    {
        if (list[goIdx].left == -1 && list[goIdx].right == -1)
        {
            bits[list[goIdx].byte] =
        }
    }
    //
    free(bits);
    printf("Done\n");
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
    long int max_out = sb.st_size + sizeof(long) + sizeof(struct HuffmanNode) * 511;
    //byte *buf = malloc(max_out);
    int fd_out = open("hpmor_ru.html.huffman", O_RDWR | O_CREAT | O_TRUNC, 0666);
    if (fd_out == -1)
    {
        perror("Error opening output file");
        exit(1);
    }
    lseek(fd_out, max_out, SEEK_SET);
    char *out = mmap(0, max_out, PROT_READ | PROT_WRITE, MAP_SHARED, fd_out, 0);
    if (out == MAP_FAILED)
    {
        perror("Error mmap out file");
        exit(1);
    }

    int huffman_result = huffman(memblock, sb.st_size, out, max_out, &outlen);
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
    if (munmap(out, max_out) == -1)
    {
        perror("Error un-mmapping the file");
    }
    close(fd);
    ftruncate(fd_out, outlen);
    close(fd_out);
}