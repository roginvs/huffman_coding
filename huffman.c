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
struct /*__attribute__((__packed__))*/ HuffmanNode
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
    struct HuffmanNode *list = (struct HuffmanNode *)malloc(sizeof(struct HuffmanNode) * 511);
    //struct HuffmanNode *list = (struct HuffmanNode *)(&out[*outlen]);
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
    //
    free(list);

    char currentBit = 0;

    void writeBit(char bit)
    {
        if (bit > 0)
        {
            char targetMask = 1 << (7 - currentBit);
            // printf("mask=%x\n", targetMask);
            // printf("out before=%x\n", out[*outlen]);
            out[*outlen] = out[*outlen] | targetMask;
            // printf("out after=%x\n", out[*outlen]);
        }
        else
        {
            char targetMask = 255 - (1 << (7 - currentBit));
            out[*outlen] = out[*outlen] & targetMask;
        }
        currentBit++;
        if (currentBit >= 8)
        {
            currentBit = 0;
            *outlen = *outlen + 1;
        }
    };
    printf("Writing header\n");
    void writeNode(int idx)
    {
        printf("Writing header node %i. left=%i right=%i \n", idx, list[idx].leftIdx, list[idx].rightIdx);
        if (list[idx].leftIdx != -1 && list[idx].rightIdx != -1)
        {
            printf("Internal\n");
            writeBit(0);
            writeNode(list[idx].leftIdx);
            writeNode(list[idx].rightIdx);
        }
        else
        {
            printf("Leaf\n");
            writeBit(1);
            for (int i = 0; i < 8; i++)
            {
                char bit = list[idx].byte >> (7 - i) & 1;
                writeBit(bit);
            }
        }
    };
    writeNode(510);
    printf("Header is written,outlen=%lu bit=%i\n", *outlen, currentBit);
    if (currentBit != 0)
    {
        *outlen = *outlen + 1;
    }
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