package com.meshnet.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface MessageDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(message: MessageEntity)

    @Query("SELECT id FROM messages WHERE ttlExpiresAtMillis > :now")
    suspend fun activeIds(now: Long = System.currentTimeMillis()): List<String>

    @Query("SELECT * FROM messages WHERE id IN (:ids)")
    suspend fun getByIds(ids: List<String>): List<MessageEntity>

    @Query("DELETE FROM messages WHERE ttlExpiresAtMillis <= :now")
    suspend fun evictExpired(now: Long = System.currentTimeMillis())

    @Query("SELECT * FROM messages ORDER BY createdAtMillis DESC")
    fun observeAll(): Flow<List<MessageEntity>>

    @Query("SELECT COUNT(*) FROM messages")
    fun observeCount(): Flow<Int>

    @Query("SELECT COALESCE(SUM(LENGTH(payload)), 0) FROM messages")
    fun observeTotalBytes(): Flow<Long>
}
