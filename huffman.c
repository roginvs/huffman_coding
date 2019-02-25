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

/** left&right or byte */
struct HuffmanNode
{
    int byte;
    unsigned long count;
    struct HuffmanNode *next;
    struct HuffmanNode *left;
    struct HuffmanNode *right;
};
struct PackedNode
{
    byte byte;
    int leftIdx;
    int rightIdx;
};
int huffman(byte *in, long len, byte *out, long max_out, long *outlen)
{
    printf("Creating buffer for counts and counting\n");
    unsigned long counts[256] = {0};
    for (unsigned long i = 0; i < len; i++)
    {
        counts[in[i]]++;
    };

    printf("Building initial list\n");
    struct HuffmanNode *list;
    struct HuffmanNode *last = NULL;
    // Lol, if use "byte" then it goes to infinitive loop
    for (int i = 0; i < 256; i++)
    {
        struct HuffmanNode *node = malloc(sizeof(struct HuffmanNode));
        node->byte = i;
        node->count = counts[i];
        node->next = NULL;
        node->left = NULL;
        node->right = NULL;
        if (last == NULL)
        {
            last = node;
            list = node;
        }
        else
        {
            last->next = node;
        }
        last = node;
    }
    printf("Transforming list into tree\n");
    while (1)
    {
        struct HuffmanNode *min1 = NULL;
        struct HuffmanNode *min2 = NULL;
        struct HuffmanNode *current = list;
        if (current->next == NULL)
        {
            // This should never happen because we check and break in the end of this while loop
            break;
        }
        // Two passes to find two minimums. Not optimal
        while (current != NULL)
        {
            if (min1 == NULL || current->count < min1->count)
            {
                min1 = current;
            }
            current = current->next;
        }
        current = list;
        while (current != NULL)
        {
            if (min2 == NULL || current->count < min2->count)
            {
                if (min1 != current)
                {
                    min2 = current;
                }
            }
            current = current->next;
        }
        printf("Found min1=%i min2=%i\n", min1->byte, min2->byte);
        struct HuffmanNode *node = malloc(sizeof(struct HuffmanNode));
        node->count = min1->count + min2->count;
        node->left = min1;
        node->right = min2;
        node->next = NULL;

        // Removing items from list
        printf("Removing min1 from list\n");
        struct HuffmanNode *last = NULL;
        current = list;
        while (current != NULL)
        {
            if (current == min1)
            {
                if (last == NULL)
                {
                    list = current->next;
                }
                else
                {
                    last->next = current->next;
                }
                break;
            }
            last = current;
            current = current->next;
        }
        printf("Removing min2 from list\n");
        last = NULL;
        current = list;
        while (current != NULL)
        {
            if (current == min2)
            {
                if (last == NULL)
                {
                    list = current->next;
                }
                else
                {
                    last->next = current->next;
                }
                break;
            }
            last = current;
            current = current->next;
        }
        printf("Add new item to list\n");
        if (list == NULL)
        {
            printf("List is null, tree is built\n");
            list = node;
            break;
        }
        else
        {
            current = list;
            while (current->next != NULL)
            {
                current = current->next;
            }
            current->next = node;
        }

        int i = 0;
        current = list;
        while (current != NULL)
        {
            i++;
            current = current->next;
        }
        printf("List have %i items\n", i);
    }

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

    // todo: free tree
    printf("Done\n");
    *outlen = 0;
    *(long *)&out[0] = len;
    *outlen += sizeof(long);

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