package com.meshnet.app.net

import kotlin.math.ln
import kotlin.math.pow

/** Compact "what I have" manifest exchanged on every node encounter. */
class BloomFilter(private val bits: BooleanArray, val hashCount: Int) {

    /** Exact bit-array size. Must travel alongside [toByteArray] — the encoded bytes
     *  are padded to a byte boundary, so the receiver needs this to rebuild the same
     *  modulus [hashesFor] used, or its hash indices won't match the sender's. */
    val bitCount: Int get() = bits.size

    fun mightContain(id: String): Boolean =
        hashesFor(id).all { bits[it] }

    fun toByteArray(): ByteArray {
        val bytes = ByteArray((bits.size + 7) / 8)
        bits.forEachIndexed { i, b -> if (b) bytes[i / 8] = (bytes[i / 8].toInt() or (1 shl (i % 8))).toByte() }
        return bytes
    }

    private fun hashesFor(id: String): IntArray {
        val h1 = id.hashCode()
        val h2 = id.reversed().hashCode()
        return IntArray(hashCount) { i -> Math.floorMod(h1 + i * h2, bits.size) }
    }

    companion object {
        fun build(ids: Collection<String>, falsePositiveRate: Double = 0.01): BloomFilter {
            val n = maxOf(ids.size, 1)
            val m = (-(n * ln(falsePositiveRate)) / ln(2.0).pow(2)).toInt().coerceAtLeast(64)
            val k = ((m.toDouble() / n) * ln(2.0)).toInt().coerceIn(1, 8)
            val bits = BooleanArray(m)
            val filter = BloomFilter(bits, k)
            ids.forEach { id -> filter.hashesFor(id).forEach { bits[it] = true } }
            return filter
        }

        fun from(bytes: ByteArray, hashCount: Int, bitCount: Int): BloomFilter {
            val bits = BooleanArray(bitCount)
            for (i in 0 until bitCount) {
                val byte = bytes[i / 8].toInt()
                if ((byte shr (i % 8)) and 1 == 1) bits[i] = true
            }
            return BloomFilter(bits, hashCount)
        }
    }
}
