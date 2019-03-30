#include <stdlib.h>

#ifndef printf
#define printf(...) \
    ;
#endif

// Workarounds for webAssembly
void my_memcpy(void *dest, void *src, int size)
{
    for (int index = 0; index < size; index++)
    {
        ((char *)dest)[index] = ((char *)src)[index];
    }
}
/** left&right or byte */
struct /*__attribute__((__packed__))*/ HuffmanNode
{
    short int byte;
    unsigned long count;
    short int nextIdx;
    short int leftIdx;
    short int rightIdx;
};

// Just random values for header
char magic[] = {85, 92, 110, 65};

unsigned char *huffman_encode(unsigned char *in, long len, long *outlen)
{
    printf("Creating buffer for counts and counting\n");
    unsigned long counts[256] = {0};
    for (unsigned long i = 0; i < len; i++)
    {
        counts[in[i]]++;
    };

    struct HuffmanNode *list = (struct HuffmanNode *)malloc(sizeof(struct HuffmanNode) * 511);
    printf("Size of node is %i\n", sizeof(struct HuffmanNode)); // Lol, it is aligned

    printf("Building initial list\n");
    for (int i = 0; i < 256; i++)
    {

        list[i].byte = (unsigned char)i;
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
        if (list[min1idx].leftIdx != -1)
        {
            printf("MIN1 leaf left=%i right=%i min1idx=%i\n", list[min1idx].leftIdx, list[min1idx].rightIdx, min1idx);
        }
        else
        {
            printf("MIN1 byte=%i min1idx=%i\n", list[min1idx].byte, min1idx);
        };
        if (list[min2idx].leftIdx != -1)
        {
            printf("MIN2 leaf left=%i right=%i min1idx=%i\n", list[min2idx].leftIdx, list[min2idx].rightIdx, min2idx);
        }
        else
        {
            printf("MIN2 byte=%i min2idx=%i\n", list[min2idx].byte, min2idx);
        };

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

    printf("Creating bytes structure\n");
    struct StreamNode
    {
        unsigned char bitLength; // Ranges are 1..255
        unsigned char bits[32];
    };
    struct StreamNode *bytes = (struct StreamNode *)(malloc(sizeof(struct StreamNode) * 256));
    struct StreamNode *initial = (struct StreamNode *)(malloc(sizeof(struct StreamNode)));
    initial->bitLength = 0;
    for (unsigned char i = 0; i < 32; i++)
    {
        initial->bits[i] = 0;
    };
    void writeBitToStreamNode(struct StreamNode * node, char bitIdx, char bit)
    {

        unsigned char currentBitStreamNode = bitIdx & 7;
        unsigned char currentByteStreamNode = bitIdx >> 3;
        printf("Writing bit bitIdx=%i, bit=%i byte=%i \n", bitIdx, currentBitStreamNode, currentByteStreamNode);
        if (bit > 0)
        {
            char targetMask = 1 << (7 - currentBitStreamNode);
            node->bits[currentByteStreamNode] = node->bits[currentByteStreamNode] | targetMask;
        }
        else
        {
            char targetMask = 255 - (1 << (7 - currentBitStreamNode));
            node->bits[currentByteStreamNode] = node->bits[currentByteStreamNode] & targetMask;
        };
    };

    void goTree(int idx, struct StreamNode *path)
    {
        printf("In node %i. path len = %i \n", idx, path->bitLength);
        if (list[idx].leftIdx != -1 && list[idx].rightIdx != -1)
        {
            printf("In internal node %i. left=%i right=%i \n", idx, list[idx].leftIdx, list[idx].rightIdx);
            struct StreamNode *left = path;
            struct StreamNode *right = (struct StreamNode *)(malloc(sizeof(struct StreamNode)));
            my_memcpy(right, left, sizeof(struct StreamNode));
            writeBitToStreamNode(left, left->bitLength, 0);
            writeBitToStreamNode(right, right->bitLength, 1);
            printf("Bits left=%i right=%i\n", left->bitLength, right->bitLength);
            left->bitLength++;
            right->bitLength++;
            printf("After ++ left=%i right=%i\n", left->bitLength, right->bitLength);
            goTree(list[idx].leftIdx, left);
            goTree(list[idx].rightIdx, right);
        }
        else
        {
            printf("In leaf node %i. left=%i right=%i \n", idx, list[idx].leftIdx, list[idx].rightIdx);
            if (idx > 256)
            {
                printf("Internal error, wrong idx for leaf node\n");
            }
            my_memcpy(&bytes[idx], path, sizeof(struct StreamNode));
            free(path);
        };
    };
    goTree(510, initial);

    // TODO: it will overflow on big files
    //   need to implelement overflow safe-multiplication
    unsigned long total_stream_size_bits = 0;
    for (int i = 0; i < 256; i++)
    {
        total_stream_size_bits += counts[i] * bytes[i].bitLength;
    };
    unsigned long total_stream_bytes = (total_stream_size_bits >> 3) +
                                       (((total_stream_size_bits & 7) != 0) ? 1 : 0);
    unsigned char *out = malloc(total_stream_bytes + 328);

    printf("Initializing header\n");
    *outlen = 0;
    out[0] = magic[0];
    out[1] = magic[1];
    out[2] = magic[2];
    out[3] = magic[3];
    *outlen += 4;

    *(long *)&out[4] = len;
    *outlen += sizeof(long);

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
            printf("It is Internal\n");
            writeBit(0);
            writeNode(list[idx].leftIdx);
            writeNode(list[idx].rightIdx);
        }
        else
        {
            printf("It is Leaf byte=%u\n", list[idx].byte);
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
    if (*outlen != 327 || currentBit != 7)
    {
        printf("Internal error");
        return NULL;
    }
    writeBit(0);
    free(list);
    printf("Built a list of bytes, start to write byte stream\n");

    for (unsigned long i = 0; i < len; i++)
    {
        struct StreamNode *node = &bytes[in[i]];
        //printf("Byte idx = %lu, val = %x\n", i, in[i]);
        //printf("Node bitLen=%i\n", node->bitLength);
        //printf("Node bytes %x %x %x %x", node->bits[0], node->bits[1], node->bits[2], node->bits[3]);
        //return NULL;
        for (unsigned char bitPos = 0; bitPos < node->bitLength; bitPos++)
        {

            unsigned char bitBitPos = bitPos & 7;
            unsigned char bitBytePos = bitPos >> 3;
            unsigned char bitValue = node->bits[bitBytePos] >> (7 - bitBitPos) & 1;
            writeBit(bitValue);
        }
    };
    printf("Input written\n");
    free(bytes);
    if (currentBit != 0)
    {
        *outlen = *outlen + 1;
    }

    printf("Done\n");
    return out;
};
