#include <stdlib.h>
#include <string.h>
#include <stdint.h>

// Workarounds for webAssembly
#ifdef __EMSCRIPTEN__
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
void *my_malloc(uint32_t size)
{
    return malloc(size);
};
EMSCRIPTEN_KEEPALIVE
void my_free(void *cur)
{
    return free(cur);
};
#else
#include <stdio.h>
#include <stdarg.h>
#define EMSCRIPTEN_KEEPALIVE
#endif

void debug(char *fmt, ...)
{
#ifndef __EMSCRIPTEN__
    va_list args;
    va_start(args, fmt);
    // vprintf(fmt,args);
    va_end(args);
#endif
}

/** left&right or byte */
struct HuffmanNode
{
    short int byte;
    uint32_t count;
    short int nextIdx;
    short int leftIdx;
    short int rightIdx;
};

// Just random values for header
char magic[] = {85, 92, 110, 65};

struct StreamNode
{
    unsigned char bitLength; // Ranges are 1..255
    unsigned char bits[32];
};
void writeBitToStreamNode(struct StreamNode *node, char bitIdx, char bit)
{

    unsigned char currentBitStreamNode = bitIdx & 7;
    unsigned char currentByteStreamNode = bitIdx >> 3;
    debug("Writing bit bitIdx=%i, bit=%i byte=%i \n", bitIdx, currentBitStreamNode, currentByteStreamNode);
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

void goTreeForStream(struct HuffmanNode *list, struct StreamNode *bytes, int idx, struct StreamNode *path)
{
    debug("In node %i. path len = %i \n", idx, path->bitLength);
    if (list[idx].leftIdx != -1 && list[idx].rightIdx != -1)
    {
        debug("In internal node %i. left=%i right=%i \n", idx, list[idx].leftIdx, list[idx].rightIdx);
        struct StreamNode *left = path;
        struct StreamNode *right = (struct StreamNode *)(malloc(sizeof(struct StreamNode)));
        memcpy(right, left, sizeof(struct StreamNode));
        writeBitToStreamNode(left, left->bitLength, 0);
        writeBitToStreamNode(right, right->bitLength, 1);
        debug("Bits left=%i right=%i\n", left->bitLength, right->bitLength);
        left->bitLength++;
        right->bitLength++;
        debug("After ++ left=%i right=%i\n", left->bitLength, right->bitLength);
        goTreeForStream(list, bytes, list[idx].leftIdx, left);
        goTreeForStream(list, bytes, list[idx].rightIdx, right);
    }
    else
    {
        debug("In leaf node %i. left=%i right=%i \n", idx, list[idx].leftIdx, list[idx].rightIdx);
        if (idx > 256)
        {
            debug("Internal error, wrong idx for leaf node\n");
        }
        memcpy(&bytes[idx], path, sizeof(struct StreamNode));
        free(path);
    };
};

void writeBit(unsigned char *out, uint32_t *outlen, unsigned char *currentBit, char bit)
{
    if (bit > 0)
    {
        char targetMask = 1 << (7 - *currentBit);
        // debug("mask=%x\n", targetMask);
        // debug("out before=%x\n", out[*outlen]);
        out[*outlen] = out[*outlen] | targetMask;
        // debug("out after=%x\n", out[*outlen]);
    }
    else
    {
        char targetMask = 255 - (1 << (7 - *currentBit));
        out[*outlen] = out[*outlen] & targetMask;
    }
    *currentBit = *currentBit + 1;
    if (*currentBit >= 8)
    {
        *currentBit = 0;
        *outlen += 1;
    }
};

void writeHeaderNode(struct HuffmanNode *list, unsigned char *out, uint32_t *outlen, unsigned char *currentBit, int idx)
{
    debug("Writing header node %i. left=%i right=%i \n", idx, list[idx].leftIdx, list[idx].rightIdx);
    if (list[idx].leftIdx != -1 && list[idx].rightIdx != -1)
    {
        debug("It is Internal\n");
        writeBit(out, outlen, currentBit, 0);
        writeHeaderNode(list, out, outlen, currentBit, list[idx].leftIdx);
        writeHeaderNode(list, out, outlen, currentBit, list[idx].rightIdx);
    }
    else
    {
        debug("It is Leaf byte=%u\n", list[idx].byte);
        writeBit(out, outlen, currentBit, 1);
        for (int i = 0; i < 8; i++)
        {
            char bit = list[idx].byte >> (7 - i) & 1;
            writeBit(out, outlen, currentBit, bit);
        }
    }
};

EMSCRIPTEN_KEEPALIVE
unsigned char *huffman_encode(unsigned char *in, uint32_t len, uint32_t *outlen)
{
    debug("Creating buffer for counts and counting\n");
    uint32_t counts[256] = {0};
    for (uint32_t i = 0; i < len; i++)
    {
        counts[in[i]]++;
    };

    struct HuffmanNode *list = (struct HuffmanNode *)malloc(sizeof(struct HuffmanNode) * 511);
    // debug("Size of node is %i\n", sizeof(struct HuffmanNode)); // Lol, it is aligned

    debug("Building initial list\n");
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
    debug("Transforming list into tree\n");
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
            debug("MIN1 leaf left=%i right=%i min1idx=%i\n", list[min1idx].leftIdx, list[min1idx].rightIdx, min1idx);
        }
        else
        {
            debug("MIN1 byte=%i min1idx=%i\n", list[min1idx].byte, min1idx);
        };
        if (list[min2idx].leftIdx != -1)
        {
            debug("MIN2 leaf left=%i right=%i min1idx=%i\n", list[min2idx].leftIdx, list[min2idx].rightIdx, min2idx);
        }
        else
        {
            debug("MIN2 byte=%i min2idx=%i\n", list[min2idx].byte, min2idx);
        };

        list[freeIdx].count = list[min1idx].count + list[min2idx].count;
        list[freeIdx].leftIdx = min1idx;
        list[freeIdx].rightIdx = min2idx;
        list[freeIdx].nextIdx = -1;

        // Removing items from list
        debug("Removing min1 from list\n");
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
        debug("Removing min2 from list\n");
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

        debug("Add new item to list\n");
        if (listIdx == -1)
        {
            debug("List is null, tree is built\n");
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
        debug("List have %i items\n", i);
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
    debug("Tree have %i nodes\n", nodes_count);
    */
    //

    debug("Creating bytes structure\n");
    struct StreamNode *bytes = (struct StreamNode *)(malloc(sizeof(struct StreamNode) * 256));
    struct StreamNode *initial = (struct StreamNode *)(malloc(sizeof(struct StreamNode)));
    initial->bitLength = 0;
    for (unsigned char i = 0; i < 32; i++)
    {
        initial->bits[i] = 0;
    };

    goTreeForStream(list, bytes, 510, initial);

    // TODO: it will overflow on big files
    //   need to implelement overflow safe-multiplication
    uint32_t total_stream_size_bits = 0;
    for (int i = 0; i < 256; i++)
    {
        total_stream_size_bits += counts[i] * bytes[i].bitLength;
    };
    uint32_t total_stream_bytes = (total_stream_size_bits >> 3) +
                                  (((total_stream_size_bits & 7) != 0) ? 1 : 0);
    unsigned char *out = malloc(total_stream_bytes + 328);

    debug("Initializing header\n");
    *outlen = 0;
    out[0] = magic[0];
    out[1] = magic[1];
    out[2] = magic[2];
    out[3] = magic[3];
    *outlen += 4;

    *(uint32_t *)&out[4] = len;
    *outlen += sizeof(uint32_t);

    unsigned char currentBit = 0;

    debug("Writing header\n");
    writeHeaderNode(list, out, outlen, &currentBit, 510);
    debug("Header is written,outlen=%lu bit=%i\n", *outlen, currentBit);
    if (*outlen != 327 || currentBit != 7)
    {
        debug("Internal error with outlen and bits: %i %i\n", *outlen, currentBit);
        return NULL;
    }
    writeBit(out, outlen, &currentBit, 0);
    free(list);
    debug("Built a list of bytes, start to write byte stream\n");

    for (uint32_t i = 0; i < len; i++)
    {
        struct StreamNode *node = &bytes[in[i]];
        //debug("Byte idx = %lu, val = %x\n", i, in[i]);
        //debug("Node bitLen=%i\n", node->bitLength);
        //debug("Node bytes %x %x %x %x", node->bits[0], node->bits[1], node->bits[2], node->bits[3]);
        //return NULL;
        for (unsigned char bitPos = 0; bitPos < node->bitLength; bitPos++)
        {

            unsigned char bitBitPos = bitPos & 7;
            unsigned char bitBytePos = bitPos >> 3;
            unsigned char bitValue = node->bits[bitBytePos] >> (7 - bitBitPos) & 1;
            writeBit(out, outlen, &currentBit, bitValue);
        }
    };
    debug("Input written\n");
    free(bytes);
    while (currentBit != 0)
    {
        writeBit(out, outlen, &currentBit, 0);
    };

    debug("Done\n");
    return out;
};

EMSCRIPTEN_KEEPALIVE
unsigned char *huffman_decode(unsigned char *in, uint32_t *outlen)
{
    debug("Checking header magic\n");
    if (in[0] != magic[0] ||
        in[1] != magic[1] || in[2] != magic[2] || in[3] != magic[3])
    {
        debug("Header is not correct");
        return NULL;
    }

    *outlen = *(uint32_t *)&in[4];

    //

    //
    debug("Creating buffer for counts and counting\n");
}